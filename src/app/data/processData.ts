export interface RepairRecord {
  sNo: number;
  serialNumber: string;
  version: string;
  vehicleNo: string;
  repairedBy: string;
  ticketId: string;
  damageType: string;
  clientName: string;
  issueReported: string;
  parts: string;
  reportedDate: string;
  resolutionDate: string;
  contactPerson: string;
  contactNumber: string;
  location: string;
  rootCause: string;
  replacedParts: string;
  solution: string;
  remarks1: string;
  remarks2: string;
  videoLink: string;
}

interface SheetApiResponse {
  success: boolean;
  data?: unknown[];
  error?: string;
}

export const DEFAULT_SHEET_ID = "15oOilG4YSj41YiyiHi_n6z2fOG38rBxLyjglyYv5QXA";
export const DEFAULT_SHEET_GID = 367318406;
export const ALL_ENGINEERS = "__ALL_ENGINEERS__";
export const ALL_LOCATIONS = "__ALL_LOCATIONS__";
export const ALL_DAMAGE_TYPES = "__ALL_DAMAGE_TYPES__";
export const ALL_CLIENTS = "__ALL_CLIENTS__";

const stringify = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
};

const normalizeText = (value: unknown): string => stringify(value).toLowerCase().replace(/\s+/g, " ");
export const normalizeSerialNumber = (value: string): string =>
  stringify(value)
    .toUpperCase()
    .replace(/[\s-]+/g, "");

const NORMALIZED_ALL_ENGINEERS = normalizeText(ALL_ENGINEERS);
const NORMALIZED_ALL_LOCATIONS = normalizeText(ALL_LOCATIONS);
const NORMALIZED_ALL_DAMAGE_TYPES = normalizeText(ALL_DAMAGE_TYPES);
const NORMALIZED_ALL_CLIENTS = normalizeText(ALL_CLIENTS);

const isAllSelection = (value: string, field: "engineer" | "location" | "damageType" | "client"): boolean => {
  if (!value) {
    return true;
  }

  if (field === "engineer") {
    if (value === NORMALIZED_ALL_ENGINEERS || value === ALL_ENGINEERS) {
      return true;
    }
    return /^all engineer(s)?$/.test(value);
  }
  if (field === "location") {
    if (value === NORMALIZED_ALL_LOCATIONS || value === ALL_LOCATIONS) {
      return true;
    }
    return /^all location(s)?$/.test(value);
  }
  if (field === "damageType") {
    if (value === NORMALIZED_ALL_DAMAGE_TYPES || value === ALL_DAMAGE_TYPES) {
      return true;
    }
    return /^all damage type(s)?$/.test(value);
  }
  if (value === NORMALIZED_ALL_CLIENTS || value === ALL_CLIENTS) {
    return true;
  }
  return /^all client(s)?$/.test(value);
};

const toNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeDate = (value: unknown): string => {
  const raw = stringify(value);
  if (!raw) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const parts = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (!parts) {
    return raw;
  }

  const day = parts[1].padStart(2, "0");
  const month = parts[2].padStart(2, "0");
  const year = parts[3].length === 2 ? `20${parts[3]}` : parts[3];
  return `${year}-${month}-${day}`;
};

const toRepairRecord = (row: Record<string, unknown>, index: number): RepairRecord => ({
  sNo: toNumber(row.sNo ?? row.s_no, index + 1),
  serialNumber: stringify(row.serialNumber ?? row.serial_number),
  version: stringify(row.fixedVersion ?? row.version ?? row.fixed_e_lock_version),
  vehicleNo: stringify(row.vehicleNo ?? row.vehicle_no),
  repairedBy: stringify(row.repairedBy ?? row.repaired_by),
  ticketId: stringify(row.zohoTicketId ?? row.ticketId ?? row.zoho_project_ticket_id),
  damageType: stringify(row.damageType ?? row.damage_type),
  clientName: stringify(row.clientName ?? row.client_name),
  issueReported: stringify(row.issueReported ?? row.issue_reported),
  parts: stringify(row.parts),
  reportedDate: normalizeDate(row.reportedDate ?? row.reported_date),
  resolutionDate: normalizeDate(row.resolutionDate ?? row.resoultion_date ?? row.resolution_date),
  contactPerson: stringify(row.contactPersonName ?? row.contactPerson ?? row.contact_person_name),
  contactNumber: stringify(row.contactNumber ?? row.contact_number),
  location: stringify(row.addressLocation ?? row.location ?? row.address_location),
  rootCause: stringify(row.rootCause ?? row.root_cause),
  replacedParts: stringify(row.replacedParts ?? row.replaced_parts),
  solution: stringify(row.solutionDetail ?? row.solution ?? row.solution_in_detail),
  remarks1: stringify(row.remarks1 ?? row.remarks_1),
  remarks2: stringify(row.remarks2 ?? row.remarks_2),
  videoLink: stringify(row.videoLink ?? row.video_link),
});

const parseRecordDate = (value: string): Date | null => {
  if (!value) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
    const [day, month, year] = value.split("-");
    const date = new Date(`${year}-${month}-${day}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export async function fetchSheetData(apiUrl: string, requestInit?: RequestInit): Promise<RepairRecord[]> {
  const trimmedUrl = apiUrl.trim();
  if (!trimmedUrl) {
    return [];
  }

  const response = await fetch(trimmedUrl, { cache: "no-store", ...requestInit });
  if (!response.ok) {
    throw new Error(`Data request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as SheetApiResponse;
  if (!payload.success) {
    throw new Error(payload.error || "Sheet API returned an unsuccessful response.");
  }

  const rows = Array.isArray(payload.data) ? payload.data : [];
  return rows
    .filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null)
    .map((row, index) => toRepairRecord(row, index));
}

export function buildSheetApiUrl(scriptUrl: string, sheetId = DEFAULT_SHEET_ID, gid = DEFAULT_SHEET_GID): string {
  const trimmedScriptUrl = scriptUrl.trim();
  if (!trimmedScriptUrl) {
    return "";
  }

  const url = new URL(trimmedScriptUrl);
  url.searchParams.set("sheetId", sheetId);
  url.searchParams.set("gid", String(gid));
  return url.toString();
}

export function ensureSheetApiUrl(
  inputUrl: string,
  sheetId = DEFAULT_SHEET_ID,
  gid = DEFAULT_SHEET_GID
): string {
  const trimmed = inputUrl.trim();
  if (!trimmed) {
    return "";
  }

  const url = new URL(trimmed);
  if (!url.searchParams.has("sheetId")) {
    url.searchParams.set("sheetId", sheetId);
  }
  if (!url.searchParams.has("gid")) {
    url.searchParams.set("gid", String(gid));
  }

  return url.toString();
}

export function getFilteredData(
  data: RepairRecord[],
  filters: {
    engineer?: string;
    location?: string;
    damageType?: string;
    client?: string;
    searchId?: string;
    dateFrom?: string;
    dateTo?: string;
  }
) {
  const engineerFilter = normalizeText(filters.engineer);
  const locationFilter = normalizeText(filters.location);
  const damageTypeFilter = normalizeText(filters.damageType);
  const clientFilter = normalizeText(filters.client);
  const searchTerms = normalizeText(filters.searchId)
    .split(/[\s,]+/)
    .map((term) => term.trim())
    .filter(Boolean);
  const fromDate = filters.dateFrom ? new Date(`${filters.dateFrom}T00:00:00`) : null;
  const toDate = filters.dateTo ? new Date(`${filters.dateTo}T23:59:59`) : null;

  return data.filter((record) => {
    if (!isAllSelection(engineerFilter, "engineer") && normalizeText(record.repairedBy) !== engineerFilter) {
      return false;
    }
    if (!isAllSelection(locationFilter, "location") && normalizeText(record.location) !== locationFilter) {
      return false;
    }
    if (!isAllSelection(damageTypeFilter, "damageType") && normalizeText(record.damageType) !== damageTypeFilter) {
      return false;
    }
    if (!isAllSelection(clientFilter, "client") && normalizeText(record.clientName) !== clientFilter) {
      return false;
    }
    if (searchTerms.length > 0) {
      const searchableFields = [
        String(record.sNo),
        record.serialNumber,
        record.ticketId,
        record.vehicleNo,
        record.issueReported,
        record.damageType,
        record.clientName,
        record.repairedBy,
        record.location,
        record.parts,
        record.rootCause,
        record.replacedParts,
        record.reportedDate,
        record.resolutionDate,
        record.remarks1,
        record.remarks2,
      ];

      const searchableText = searchableFields.map((field) => normalizeText(field)).join(" | ");
      const matchesAllTerms = searchTerms.every((term) => searchableText.includes(term));
      if (!matchesAllTerms) {
        return false;
      }
    }

    if (fromDate || toDate) {
      const recordDate = parseRecordDate(record.reportedDate);
      if (!recordDate) {
        return false;
      }
      if (fromDate && recordDate < fromDate) {
        return false;
      }
      if (toDate && recordDate > toDate) {
        return false;
      }
    }

    return true;
  });
}

export function getStats(data: RepairRecord[]) {
  const total = data.length;
  const resolved = data.filter((r) => r.resolutionDate).length;
  const pending = total - resolved;

  let totalDays = 0;
  let count = 0;

  data.forEach((record) => {
    const reported = parseRecordDate(record.reportedDate);
    const resolvedDate = parseRecordDate(record.resolutionDate);

    if (!reported || !resolvedDate) {
      return;
    }

    const days = Math.floor((resolvedDate.getTime() - reported.getTime()) / (1000 * 60 * 60 * 24));
    if (days >= 0) {
      totalDays += days;
      count++;
    }
  });

  const avgResolution = count > 0 ? Math.round(totalDays / count) : 0;

  return { total, resolved, pending, avgResolution };
}

export function getEngineerLeaderboard(data: RepairRecord[]) {
  const engineerStats: Record<string, { name: string; resolved: number; pending: number; total: number }> = {};

  data.forEach((record) => {
    if (!record.repairedBy) {
      return;
    }

    if (!engineerStats[record.repairedBy]) {
      engineerStats[record.repairedBy] = { name: record.repairedBy, resolved: 0, pending: 0, total: 0 };
    }
    engineerStats[record.repairedBy].total++;
    if (record.resolutionDate) {
      engineerStats[record.repairedBy].resolved++;
    } else {
      engineerStats[record.repairedBy].pending++;
    }
  });

  return Object.values(engineerStats)
    .sort((a, b) => b.resolved - a.resolved);
}

export function getLocationHeatmap(data: RepairRecord[]) {
  const locationCounts: Record<string, number> = {};

  data.forEach((record) => {
    if (record.location) {
      const loc = record.location.charAt(0).toUpperCase() + record.location.slice(1);
      locationCounts[loc] = (locationCounts[loc] || 0) + 1;
    }
  });

  return Object.entries(locationCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function getIssueFrequency(data: RepairRecord[]) {
  const issueCounts: Record<string, number> = {};

  data.forEach((record) => {
    if (record.issueReported) {
      issueCounts[record.issueReported] = (issueCounts[record.issueReported] || 0) + 1;
    }
  });

  return Object.entries(issueCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function getVersionFailures(data: RepairRecord[]) {
  const versionCounts: Record<string, number> = {};

  data.forEach((record) => {
    if (record.version) {
      versionCounts[record.version] = (versionCounts[record.version] || 0) + 1;
    }
  });

  return Object.entries(versionCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function getRootCauseAnalysis(data: RepairRecord[]) {
  const rootCauseCounts: Record<string, number> = {};

  data.forEach((record) => {
    if (record.rootCause) {
      rootCauseCounts[record.rootCause] = (rootCauseCounts[record.rootCause] || 0) + 1;
    }
  });

  return Object.entries(rootCauseCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function getDamageTypeDistribution(data: RepairRecord[]) {
  const damageTypeCounts: Record<string, number> = {};

  data.forEach((record) => {
    if (record.damageType && record.damageType !== "None") {
      damageTypeCounts[record.damageType] = (damageTypeCounts[record.damageType] || 0) + 1;
    }
  });

  return Object.entries(damageTypeCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export interface DeviceRecurrenceEntry {
  serial: string;
  issue: string;
  count: number;
  totalCount: number;
  engineers: string[];
}

export interface RepeatedDeviceEntry {
  serial: string;
  totalCount: number;
  issue: string;
  engineers: string[];
}

export function getDeviceRecurrences(data: RepairRecord[]) {
  const recurrenceCounts = new Map<
    string,
    {
      serial: string;
      issue: string;
      count: number;
      totalCount: number;
      engineers: Set<string>;
    }
  >();
  const totalDeviceCounts = new Map<string, number>();

  data.forEach((record) => {
    const serial = stringify(record.serialNumber);
    const serialKey = normalizeSerialNumber(serial);
    const issue = stringify(record.issueReported);
    const issueKey = normalizeText(issue);
    const engineer = stringify(record.repairedBy);

    if (serialKey) {
      totalDeviceCounts.set(serialKey, (totalDeviceCounts.get(serialKey) || 0) + 1);

      if (issueKey) {
        const key = `${serialKey}::${issueKey}`;
        const current = recurrenceCounts.get(key);

        if (current) {
          current.count += 1;
          if (engineer) {
            current.engineers.add(engineer);
          }
        } else {
          recurrenceCounts.set(key, {
            serial,
            issue,
            count: 1,
            totalCount: 0,
            engineers: new Set(engineer ? [engineer] : []),
          });
        }
      }
    }
  });

  return Array.from(recurrenceCounts.values())
    .map((entry) => ({
      serial: entry.serial,
      issue: entry.issue,
      count: entry.count,
      totalCount: totalDeviceCounts.get(normalizeSerialNumber(entry.serial)) || entry.count,
      engineers: Array.from(entry.engineers).sort((a, b) => a.localeCompare(b)),
    }))
    .filter((item) => item.count > 1)
    .sort((a, b) => b.count - a.count);
}

export function getRepeatedDevices(data: RepairRecord[]) {
  const deviceCounts = new Map<
    string,
    {
      serial: string;
      totalCount: number;
      issue: string;
      reportedDate: number;
      engineers: Set<string>;
    }
  >();

  data.forEach((record) => {
    const serial = stringify(record.serialNumber);
    const serialKey = normalizeSerialNumber(serial);
    if (!serialKey) {
      return;
    }

    const issue = stringify(record.issueReported);
    const engineer = stringify(record.repairedBy);
    const reportedDate = parseRecordDate(record.reportedDate)?.getTime() ?? 0;
    const current = deviceCounts.get(serialKey);

    if (current) {
      current.totalCount += 1;
      if (reportedDate >= current.reportedDate) {
        current.issue = issue;
        current.reportedDate = reportedDate;
      }
      if (engineer) {
        current.engineers.add(engineer);
      }
      return;
    }

    deviceCounts.set(serialKey, {
      serial,
      totalCount: 1,
      issue,
      reportedDate,
      engineers: new Set(engineer ? [engineer] : []),
    });
  });

  return Array.from(deviceCounts.values())
    .filter((item) => item.totalCount > 1)
    .map((entry) => ({
      serial: entry.serial,
      totalCount: entry.totalCount,
      issue: entry.issue,
      engineers: Array.from(entry.engineers).sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => b.totalCount - a.totalCount);
}

export function getUniqueValues(data: RepairRecord[], field: keyof RepairRecord): string[] {
  const byNormalized = new Map<string, string>();

  data.forEach((record) => {
    const original = stringify(record[field]);
    if (!original) {
      return;
    }

    const normalized = normalizeText(original);
    if (!byNormalized.has(normalized)) {
      byNormalized.set(normalized, original);
    }
  });

  return Array.from(byNormalized.values()).sort((a, b) => a.localeCompare(b));
}
