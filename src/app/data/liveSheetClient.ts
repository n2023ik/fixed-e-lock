import { fetchSheetData, type RepairRecord } from "./processData";

type SyncMode = "checking" | "live" | "retrying";

interface MetaResponse {
  success?: boolean;
  version?: string | number;
  timestamp?: string | number;
  updatedAt?: string | number;
  lastUpdated?: string | number;
  rowCount?: number;
}

interface CachePayload {
  rows: RepairRecord[];
  fingerprint: string;
  cachedAt: number;
}

export interface LiveSyncOptions {
  dataUrl: string;
  metaUrl?: string;
  pollIntervalMs?: number;
  maxBackoffMs?: number;
  cacheTtlMs?: number;
  onData: (rows: RepairRecord[], meta: { fromCache: boolean; changed: boolean }) => void;
  onError: (message: string) => void;
  onStatus: (mode: SyncMode) => void;
}

const DEFAULT_POLL_INTERVAL_MS = 45_000;
const DEFAULT_MAX_BACKOFF_MS = 5 * 60_000;
const DEFAULT_CACHE_TTL_MS = 15 * 60_000;

const safeString = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
};

const buildFingerprint = (rows: RepairRecord[]): string => {
  if (rows.length === 0) {
    return "0::empty";
  }

  const sample = rows.slice(0, 3).concat(rows.slice(-3));
  const compact = sample
    .map((row) => `${row.sNo}|${row.serialNumber}|${row.reportedDate}|${row.resolutionDate}`)
    .join("||");

  return `${rows.length}::${compact}`;
};

const getCacheKey = (dataUrl: string): string => `sheet-cache::${encodeURIComponent(dataUrl)}`;

const readCache = (cacheKey: string): CachePayload | null => {
  try {
    const raw = window.localStorage.getItem(cacheKey);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as CachePayload;
    if (!Array.isArray(parsed.rows) || typeof parsed.cachedAt !== "number") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const writeCache = (cacheKey: string, payload: CachePayload) => {
  try {
    window.localStorage.setItem(cacheKey, JSON.stringify(payload));
  } catch {
    // Ignore storage write errors (private mode, quota exceeded, etc).
  }
};

const extractChangeToken = (payload: MetaResponse): string => {
  const version = safeString(payload.version);
  if (version) {
    return `v:${version}`;
  }

  const ts = safeString(payload.updatedAt || payload.lastUpdated || payload.timestamp);
  const rowCount = Number(payload.rowCount) || 0;
  return `${ts}::${rowCount}`;
};

const fetchMetaToken = async (metaUrl: string, signal: AbortSignal): Promise<string> => {
  const response = await fetch(metaUrl, {
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Meta check failed with status ${response.status}`);
  }

  const payload = (await response.json()) as MetaResponse;
  if (payload.success === false) {
    throw new Error("Meta endpoint returned unsuccessful response.");
  }

  return extractChangeToken(payload);
};

export function startLiveSheetSync(options: LiveSyncOptions): () => void {
  const pollIntervalMs = Math.max(options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS, 30_000);
  const maxBackoffMs = Math.max(options.maxBackoffMs ?? DEFAULT_MAX_BACKOFF_MS, pollIntervalMs);
  const cacheTtlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
  const cacheKey = getCacheKey(options.dataUrl);

  let stopped = false;
  let timer: number | undefined;
  let inFlight = false;
  let currentAbort: AbortController | null = null;
  let failureCount = 0;
  let lastKnownToken = "";
  let lastFingerprint = "";

  const schedule = (delayMs: number) => {
    if (stopped) {
      return;
    }
    const jitter = Math.floor(Math.random() * 4_000);
    timer = window.setTimeout(() => {
      void runCycle();
    }, delayMs + jitter);
  };

  const emitCachedData = () => {
    const cached = readCache(cacheKey);
    if (!cached) {
      return;
    }

    const age = Date.now() - cached.cachedAt;
    if (age > cacheTtlMs) {
      return;
    }

    lastFingerprint = cached.fingerprint;
    options.onData(cached.rows, { fromCache: true, changed: true });
  };

  const runCycle = async () => {
    if (stopped || inFlight) {
      return;
    }

    inFlight = true;
    options.onStatus("checking");
    currentAbort = new AbortController();

    try {
      let shouldFetchRows = true;

      if (options.metaUrl) {
        const token = await fetchMetaToken(options.metaUrl, currentAbort.signal);
        if (token && token === lastKnownToken) {
          shouldFetchRows = false;
        } else {
          lastKnownToken = token;
        }
      }

      if (!shouldFetchRows) {
        failureCount = 0;
        options.onStatus("live");
        schedule(pollIntervalMs);
        return;
      }

      const rows = await fetchSheetData(options.dataUrl, { signal: currentAbort.signal });
      const fingerprint = buildFingerprint(rows);
      const changed = fingerprint !== lastFingerprint;

      failureCount = 0;
      options.onStatus("live");

      if (changed) {
        lastFingerprint = fingerprint;
        options.onData(rows, { fromCache: false, changed: true });
        writeCache(cacheKey, {
          rows,
          fingerprint,
          cachedAt: Date.now(),
        });
      } else {
        options.onData(rows, { fromCache: false, changed: false });
      }

      schedule(pollIntervalMs);
    } catch (error) {
      if (stopped) {
        return;
      }

      failureCount += 1;
      options.onStatus("retrying");

      const message = error instanceof Error ? error.message : "Live sync failed.";
      options.onError(message);

      const backoff = Math.min(pollIntervalMs * 2 ** (failureCount - 1), maxBackoffMs);
      schedule(backoff);
    } finally {
      inFlight = false;
      currentAbort = null;
    }
  };

  emitCachedData();
  void runCycle();

  return () => {
    stopped = true;
    if (timer) {
      window.clearTimeout(timer);
    }
    if (currentAbort) {
      currentAbort.abort();
    }
  };
}
