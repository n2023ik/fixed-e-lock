import { useEffect, useMemo, useState } from "react";
import { Outlet, NavLink } from "react-router";
import { Lock, Activity, AlertCircle, HardDrive, FileText } from "lucide-react";
import {
  ALL_CLIENTS,
  ALL_DAMAGE_TYPES,
  ALL_ENGINEERS,
  ALL_LOCATIONS,
  DEFAULT_SHEET_GID,
  DEFAULT_SHEET_ID,
  buildSheetApiUrl,
  ensureSheetApiUrl,
  getUniqueValues,
  type RepairRecord,
} from "../data/processData";
import { startLiveSheetSync } from "../data/liveSheetClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import type { DashboardOutletContext } from "../types/dashboard";

const POLL_INTERVAL_MS = 45_000;

export default function Dashboard() {
  const [engineer, setEngineer] = useState(ALL_ENGINEERS);
  const [location, setLocation] = useState(ALL_LOCATIONS);
  const [damageType, setDamageType] = useState(ALL_DAMAGE_TYPES);
  const [client, setClient] = useState(ALL_CLIENTS);
  const [data, setData] = useState<RepairRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<"checking" | "live" | "retrying">("checking");

  const apiUrl = useMemo(() => {
    const envSheetId = (import.meta.env.VITE_SHEET_ID || "").trim();
    const envGidRaw = (import.meta.env.VITE_SHEET_GID || "").trim();
    const envGid = Number(envGidRaw);
    const resolvedSheetId = envSheetId || DEFAULT_SHEET_ID;
    const resolvedGid = Number.isFinite(envGid) ? envGid : DEFAULT_SHEET_GID;

    const directUrl = import.meta.env.VITE_SHEET_API_URL || "";
    if (directUrl.trim()) {
      const hasExplicitSheetParams = Boolean(envSheetId || envGidRaw);
      return hasExplicitSheetParams
        ? ensureSheetApiUrl(directUrl, resolvedSheetId, resolvedGid)
        : directUrl.trim();
    }

    const scriptUrl = import.meta.env.VITE_SHEET_SCRIPT_URL || "";
    return buildSheetApiUrl(scriptUrl, resolvedSheetId, resolvedGid);
  }, []);

  useEffect(() => {
    if (!apiUrl) {
      setError("Set VITE_SHEET_API_URL or VITE_SHEET_SCRIPT_URL in your environment to load live data.");
      setIsLoading(false);
      return;
    }

    const metaUrl = (import.meta.env.VITE_SHEET_META_URL || "").trim();
    const stopSync = startLiveSheetSync({
      dataUrl: apiUrl,
      metaUrl: metaUrl || undefined,
      pollIntervalMs: POLL_INTERVAL_MS,
      onData: (rows, meta) => {
        setData(rows);
        setIsLoading(false);
        if (meta.changed) {
          setLastUpdated(new Date().toLocaleTimeString());
        }
        if (!meta.fromCache) {
          setError(null);
        }
      },
      onError: (message) => {
        setIsLoading(false);
        setError(`Live sync warning: ${message}. Showing last successful snapshot.`);
      },
      onStatus: (mode) => {
        setSyncState(mode);
      },
    });

    return () => {
      stopSync();
    };
  }, [apiUrl]);

  const engineers = getUniqueValues(data, "repairedBy");
  const locations = getUniqueValues(data, "location");
  const damageTypes = getUniqueValues(data, "damageType").filter((d) => d !== "None");
  const clients = getUniqueValues(data, "clientName");

  const outletContext: DashboardOutletContext = {
    filters: { engineer, location, damageType, client },
    data,
    isLoading,
    error,
    lastUpdated,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-lg">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold">E-Lock Ops Center</h1>
              <p className="text-slate-400 text-xs">Field Service Analytics</p>
            </div>
          </div>
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
              syncState === "retrying"
                ? "bg-amber-500/10 border-amber-500/40"
                : "bg-emerald-500/10 border-emerald-500/30"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                syncState === "retrying" ? "bg-amber-400" : "bg-emerald-500 animate-pulse"
              }`}
            ></div>
            <span className={`text-sm font-medium ${syncState === "retrying" ? "text-amber-300" : "text-emerald-400"}`}>
              {syncState === "retrying" ? "RETRY MODE" : syncState === "checking" ? "SYNCING" : "LIVE DATA"}
            </span>
            <span className={`text-xs ${syncState === "retrying" ? "text-amber-200/70" : "text-emerald-400/60"}`}>
              {lastUpdated ? `Updated ${lastUpdated}` : "Waiting"}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-6 flex gap-1 border-t border-slate-800/50">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                isActive
                  ? "text-cyan-400"
                  : "text-slate-400 hover:text-slate-200"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Activity className="w-4 h-4" />
                Overview
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-teal-500"></div>
                )}
              </>
            )}
          </NavLink>
          <NavLink
            to="/engineers"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                isActive
                  ? "text-cyan-400"
                  : "text-slate-400 hover:text-slate-200"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Activity className="w-4 h-4" />
                Engineers
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-teal-500"></div>
                )}
              </>
            )}
          </NavLink>
          <NavLink
            to="/issues"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                isActive
                  ? "text-cyan-400"
                  : "text-slate-400 hover:text-slate-200"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <AlertCircle className="w-4 h-4" />
                Issues
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-teal-500"></div>
                )}
              </>
            )}
          </NavLink>
          <NavLink
            to="/devices"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                isActive
                  ? "text-cyan-400"
                  : "text-slate-400 hover:text-slate-200"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <HardDrive className="w-4 h-4" />
                Devices
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-teal-500"></div>
                )}
              </>
            )}
          </NavLink>
          <NavLink
            to="/reports"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                isActive
                  ? "text-cyan-400"
                  : "text-slate-400 hover:text-slate-200"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <FileText className="w-4 h-4" />
                Reports
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-teal-500"></div>
                )}
              </>
            )}
          </NavLink>
        </nav>
      </header>

      {/* Filters */}
      <div className="px-6 py-4 bg-slate-900/30 border-b border-slate-800/50">
        <div className="grid grid-cols-4 gap-4">
          <Select value={engineer} onValueChange={setEngineer}>
            <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-slate-200 hover:bg-slate-800/70">
              <SelectValue placeholder="All Engineers" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value={ALL_ENGINEERS} className="text-slate-200">All Engineers</SelectItem>
              {engineers.map((eng) => (
                <SelectItem key={eng} value={eng} className="text-slate-200">{eng}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-slate-200 hover:bg-slate-800/70">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value={ALL_LOCATIONS} className="text-slate-200">All Locations</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc} value={loc} className="text-slate-200 capitalize">{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={damageType} onValueChange={setDamageType}>
            <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-slate-200 hover:bg-slate-800/70">
              <SelectValue placeholder="All Damage Types" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value={ALL_DAMAGE_TYPES} className="text-slate-200">All Damage Types</SelectItem>
              {damageTypes.map((type) => (
                <SelectItem key={type} value={type} className="text-slate-200">{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={client} onValueChange={setClient}>
            <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-slate-200 hover:bg-slate-800/70">
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value={ALL_CLIENTS} className="text-slate-200">All Clients</SelectItem>
              {clients.map((cli) => (
                <SelectItem key={cli} value={cli} className="text-slate-200">{cli}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {error ? (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}
        {!isLoading && !error && data.length === 0 ? (
          <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Live API returned 0 records. On Vercel, verify `VITE_SHEET_API_URL` is set in Project Settings and redeploy.
          </div>
        ) : null}
        <Outlet context={outletContext} />
      </div>
    </div>
  );
}
