import { useOutletContext } from "react-router";
import { TrendingUp, Clock, AlertTriangle, BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  getFilteredData,
  getStats,
  getEngineerLeaderboard,
  getLocationHeatmap,
  getIssueFrequency,
  getVersionFailures,
  getRootCauseAnalysis,
  getDamageTypeDistribution,
  getDeviceRecurrences,
  getRepeatedDevices,
  normalizeSerialNumber,
} from "../../data/processData";
import type { DashboardOutletContext } from "../../types/dashboard";

const COLORS = ['#06b6d4', '#14b8a6', '#10b981', '#22c55e', '#84cc16'];

export default function Overview() {
  const { filters, data } = useOutletContext<DashboardOutletContext>();

  const normalizeIssueKey = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();
  const buildCombinedRecurrences = (rows: typeof data) => {
    const sameCaseCountByKey = new Map(
      getDeviceRecurrences(rows).map((entry) => [
        `${normalizeSerialNumber(entry.serial)}::${normalizeIssueKey(entry.issue)}`,
        entry.count,
      ])
    );

    return getRepeatedDevices(rows).map((entry) => ({
      ...entry,
      sameCaseCount:
        sameCaseCountByKey.get(`${normalizeSerialNumber(entry.serial)}::${normalizeIssueKey(entry.issue)}`) || 1,
    }));
  };

  const filteredData = getFilteredData(data, filters);
  const stats = getStats(filteredData);
  const leaderboard = getEngineerLeaderboard(filteredData);
  const locationData = getLocationHeatmap(filteredData);
  const issueFrequency = getIssueFrequency(filteredData);
  const versionFailures = getVersionFailures(filteredData);
  const rootCauses = getRootCauseAnalysis(filteredData);
  const damageTypes = getDamageTypeDistribution(filteredData);
  const filteredCombinedRecurrences = buildCombinedRecurrences(filteredData);
  const globalCombinedRecurrences = buildCombinedRecurrences(data);
  const showingGlobalRecurrences = filteredCombinedRecurrences.length === 0 && globalCombinedRecurrences.length > 0;
  const combinedRecurrences = showingGlobalRecurrences ? globalCombinedRecurrences : filteredCombinedRecurrences;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        {/* Total Complaints */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 border border-slate-700/50 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="text-slate-400 text-sm mb-2 uppercase tracking-wide">Total Complaints</div>
            <div className="text-4xl font-bold text-white mb-1">{stats.total}</div>
            <div className="text-orange-400 text-xs">Regular tickets</div>
          </div>
        </div>

        {/* Resolved */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 border border-teal-500/20 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="text-slate-400 text-sm mb-2 uppercase tracking-wide">Resolved</div>
            <div className="text-4xl font-bold text-white mb-1">{stats.resolved}</div>
            <div className="text-teal-400 text-xs">
              {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}% resolution rate
            </div>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 border border-red-500/20 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="text-slate-400 text-sm mb-2 uppercase tracking-wide">Pending</div>
            <div className="text-4xl font-bold text-white mb-1">{stats.pending}</div>
            <div className="text-red-400 text-xs">Pending actions</div>
          </div>
        </div>

        {/* Avg Resolution */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 border border-cyan-500/20 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="text-slate-400 text-sm mb-2 uppercase tracking-wide">Avg Resolution</div>
            <div className="text-4xl font-bold text-white mb-1">{stats.avgResolution}d</div>
            <div className="text-cyan-400 text-xs">Days to close ticket</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Engineer Leaderboard */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Engineer Leaderboard</h3>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-5 gap-2 text-xs text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-700/50">
              <div className="col-span-2">Engineer</div>
              <div className="text-center">Jobs</div>
              <div className="text-center">Avg</div>
              <div className="text-center">Load</div>
            </div>
            {leaderboard.map((engineer, index) => (
              <div key={engineer.name} className="grid grid-cols-5 gap-2 items-center">
                <div className="flex items-center gap-2 col-span-2">
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                      index === 0
                        ? "bg-yellow-500/20 text-yellow-400"
                        : index === 1
                        ? "bg-slate-400/20 text-slate-300"
                        : index === 2
                        ? "bg-orange-500/20 text-orange-400"
                        : "bg-slate-700/50 text-slate-400"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="text-slate-200 text-sm">{engineer.name}</span>
                </div>
                <div className="text-center text-cyan-400 text-sm">{engineer.resolved}</div>
                <div className="text-center text-slate-300 text-sm">{engineer.total}</div>
                <div className="flex-1">
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-teal-500"
                      style={{ width: `${stats.total > 0 ? (engineer.total / stats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Location Heatmap */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Location Heatmap</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={locationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f1f5f9',
                }}
              />
              <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Device Recurrences Tracker */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-white font-semibold">Device Recurrences Tracker</h3>
            <span className="text-xs text-slate-400">
              {showingGlobalRecurrences ? "Showing global recurrences" : "Filtered recurrences"}
            </span>
          </div>
          <div className="space-y-2">
            {combinedRecurrences.length === 0 ? (
              <div className="rounded-lg border border-slate-700/60 bg-slate-900/40 px-4 py-6 text-center text-slate-400">
                No recurring device found for the current filters.
              </div>
            ) : null}
            {combinedRecurrences.map((device) => (
              <div key={`${device.serial}-${device.issue}`} className="flex items-center justify-between gap-3 py-2 px-3 bg-slate-700/30 rounded-lg">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-1 h-1 rounded-full bg-amber-500"></div>
                  <div className="min-w-0">
                    <div className="text-slate-300 text-sm font-mono truncate">{device.serial}</div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate">Latest case: {device.issue}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Same case: {device.sameCaseCount}x</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  <span className="px-2 py-1 rounded-md border border-slate-600/70 bg-slate-900/50 text-[11px] text-slate-300 max-w-[180px] truncate">
                    {device.engineers.length > 0 ? device.engineers.join(', ') : 'No engineer'}
                  </span>
                  <span className="text-xs text-slate-400">{device.totalCount} repairs</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    device.totalCount > 2 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {device.totalCount > 2 ? 'OPEN' : 'CLOSED'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Issue Frequency */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Issue Frequency</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={issueFrequency}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f1f5f9',
                }}
              />
              <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Third Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Version Failures */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Version Failures</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={versionFailures}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {versionFailures.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '12px' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Root Cause Analysis */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Root Cause Analysis</h3>
          <div className="space-y-3">
            {rootCauses.map((cause, index) => {
              const maxValue = Math.max(...rootCauses.map((c) => c.value));
              const percentage = (cause.value / maxValue) * 100;
              return (
                <div key={cause.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm">{cause.name}</span>
                    <span className="text-cyan-400 text-sm font-medium">{cause.value}</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Damage Type Distribution */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">Damage Type Distribution</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={damageTypes}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#f1f5f9',
              }}
            />
            <Bar dataKey="value" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
                <stop offset="50%" stopColor="#14b8a6" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.6} />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
