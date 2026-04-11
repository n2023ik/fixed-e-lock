import { useOutletContext } from "react-router";
import { HardDrive, RefreshCw, Package, Activity } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { getFilteredData, getVersionFailures, getDeviceRecurrences, normalizeSerialNumber } from "../../data/processData";
import type { DashboardOutletContext } from "../../types/dashboard";

const COLORS = ['#06b6d4', '#14b8a6', '#10b981', '#84cc16', '#f59e0b'];

export default function Devices() {
  const { filters, data } = useOutletContext<DashboardOutletContext>();

  const filteredData = getFilteredData(data, filters);
  const versionFailures = getVersionFailures(filteredData);
  const filteredRecurrences = getDeviceRecurrences(filteredData);
  const allRecurrences = getDeviceRecurrences(data);
  const showingGlobalRecurrences = filteredRecurrences.length === 0 && allRecurrences.length > 0;
  const deviceRecurrences = showingGlobalRecurrences ? allRecurrences : filteredRecurrences;

  // Device statistics
  const totalDevices = new Set(filteredData.map((r) => normalizeSerialNumber(r.serialNumber)).filter((s) => s)).size;
  const recurringDevices = deviceRecurrences.length;
  const uniqueVersions = new Set(filteredData.map(r => r.version)).size;

  // Parts replacement data
  const partsData: Record<string, number> = {};
  filteredData.forEach(record => {
    if (record.replacedParts) {
      partsData[record.replacedParts] = (partsData[record.replacedParts] || 0) + 1;
    }
  });
  const partsReplacement = Object.entries(partsData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Device Management</h2>
          <p className="text-slate-400">Monitor device health and maintenance</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-500/30 rounded-lg">
          <Activity className="w-5 h-5 text-teal-400" />
          <span className="text-white font-medium">Device Insights</span>
        </div>
      </div>

      {/* Device Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <HardDrive className="w-8 h-8 text-cyan-400" />
            <div className="px-2 py-1 bg-cyan-500/20 rounded text-xs text-cyan-400 font-medium">Active</div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{totalDevices}</div>
          <div className="text-sm text-slate-400">Total Devices</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <RefreshCw className="w-8 h-8 text-orange-400" />
            <div className="px-2 py-1 bg-orange-500/20 rounded text-xs text-orange-400 font-medium">Watch</div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{recurringDevices}</div>
          <div className="text-sm text-slate-400">Recurring Issues</div>
        </div>

        <div className="bg-gradient-to-br from-teal-500/10 to-teal-600/5 border border-teal-500/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <Package className="w-8 h-8 text-teal-400" />
            <div className="px-2 py-1 bg-teal-500/20 rounded text-xs text-teal-400 font-medium">Info</div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{uniqueVersions}</div>
          <div className="text-sm text-slate-400">Firmware Versions</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <Activity className="w-8 h-8 text-purple-400" />
            <div className="px-2 py-1 bg-purple-500/20 rounded text-xs text-purple-400 font-medium">Track</div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{filteredData.length}</div>
          <div className="text-sm text-slate-400">Service Events</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Version Distribution */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Firmware Version Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={versionFailures}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
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
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Parts Replacement */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Parts Replacement Frequency</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={partsReplacement}>
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
              <Bar dataKey="value" fill="#14b8a6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recurring Devices */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Devices with Recurring Issues</h3>
          <span className="text-xs text-slate-400">
            {showingGlobalRecurrences ? "Showing global recurrences" : "Attention Required"}
          </span>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 max-h-[32rem] overflow-y-auto pr-1">
          {deviceRecurrences.length === 0 ? (
            <div className="col-span-2 rounded-lg border border-slate-700/60 bg-slate-900/40 px-4 py-8 text-center text-slate-400">
              No recurring device found in available data.
            </div>
          ) : null}
          {deviceRecurrences.map((device) => {
            const deviceData = (showingGlobalRecurrences ? data : filteredData).find(
              (r) => normalizeSerialNumber(r.serialNumber) === normalizeSerialNumber(device.serial)
            );
            return (
              <div
                key={`${device.serial}-${device.issue}`}
                className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4 hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="text-xs text-slate-400 mb-1">Serial Number</div>
                    <div className="text-white font-mono font-medium">{device.serial}</div>
                    <div className="text-xs text-slate-500 mt-1">Case: {device.issue}</div>
                    <div className="text-[11px] text-slate-400 mt-1">Same case: {device.count}x</div>
                  </div>
                  <div
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      device.count > 2
                        ? "bg-red-500/20 text-red-400"
                        : "bg-amber-500/20 text-amber-400"
                    }`}
                  >
                    {device.totalCount} repairs
                  </div>
                </div>
                {deviceData && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Version:</span>
                      <span className="text-cyan-400">{deviceData.version}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Vehicle:</span>
                      <span className="text-slate-300">{deviceData.vehicleNo}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Last Issue:</span>
                      <span className="text-slate-300">{deviceData.issueReported}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Engineers:</span>
                      <span className="text-slate-300 text-right">{device.engineers.length > 0 ? device.engineers.join(', ') : 'N/A'}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Device List */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">Device Service History</h3>
        <div className="max-h-[28rem] overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Serial Number</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Version</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Vehicle</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Issue</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Part Replaced</th>
                <th className="text-center py-3 px-4 text-slate-400 font-medium text-sm">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((record, index) => (
                <tr key={`${record.serialNumber}-${index}`} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                  <td className="py-3 px-4 text-cyan-400 font-mono text-sm">{record.serialNumber || 'N/A'}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-slate-700 rounded text-slate-300 text-xs">{record.version}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{record.vehicleNo}</td>
                  <td className="py-3 px-4 text-slate-300">{record.issueReported}</td>
                  <td className="py-3 px-4 text-teal-400">{record.replacedParts}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        record.resolutionDate
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-orange-500/20 text-orange-400"
                      }`}
                    >
                      {record.resolutionDate ? "Fixed" : "In Progress"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
