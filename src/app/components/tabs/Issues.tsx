import { useOutletContext } from "react-router";
import { AlertCircle, TrendingDown, AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { getFilteredData, getIssueFrequency, getRootCauseAnalysis } from "../../data/processData";
import type { DashboardOutletContext } from "../../types/dashboard";

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#8b5cf6'];

export default function Issues() {
  const { filters, data } = useOutletContext<DashboardOutletContext>();

  const filteredData = getFilteredData(data, filters);
  const issueFrequency = getIssueFrequency(filteredData);
  const rootCauses = getRootCauseAnalysis(filteredData);

  // Calculate issue trends
  const issuesByType = issueFrequency.slice(0, 3);
  const criticalIssues = filteredData.filter(r => r.issueReported === "Won't open" || r.issueReported === "Broken casing").length;
  const resolvedIssues = filteredData.filter(r => r.resolutionDate).length;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Issue Analysis</h2>
          <p className="text-slate-400">Monitor and analyze reported issues</p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <div>
                <div className="text-xs text-red-400">Critical</div>
                <div className="text-lg font-bold text-white">{criticalIssues}</div>
              </div>
            </div>
          </div>
          <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-xs text-emerald-400">Resolved</div>
                <div className="text-lg font-bold text-white">{resolvedIssues}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Issue Overview Cards */}
      <div className="grid grid-cols-3 gap-4">
        {issuesByType.map((issue, index) => (
          <div
            key={issue.name}
            className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 border border-slate-700/50 rounded-xl p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Issue Type</div>
                <div className="text-white font-semibold">{issue.name}</div>
              </div>
              <AlertCircle className={`w-5 h-5 ${index === 0 ? 'text-red-400' : index === 1 ? 'text-orange-400' : 'text-yellow-400'}`} />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-white">{issue.value}</div>
                <div className="text-xs text-slate-400">occurrences</div>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                index === 0 ? 'bg-red-500/20 text-red-400' : index === 1 ? 'bg-orange-500/20 text-orange-400' : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {index === 0 ? 'High' : index === 1 ? 'Medium' : 'Low'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Issue Distribution */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Issue Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={issueFrequency}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {issueFrequency.map((entry, index) => (
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

        {/* Issue Frequency Trend */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Frequency Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={issueFrequency}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-15} textAnchor="end" height={80} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f1f5f9',
                }}
              />
              <Bar dataKey="value" fill="#06b6d4" radius={[8, 8, 0, 0]}>
                {issueFrequency.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Root Cause Deep Dive */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">Root Cause Deep Dive</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            {rootCauses.slice(0, 4).map((cause) => {
              const maxValue = Math.max(...rootCauses.map((c) => c.value));
              const percentage = (cause.value / maxValue) * 100;
              return (
                <div key={cause.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-medium">{cause.name}</span>
                    <span className="text-cyan-400 font-bold">{cause.value}</span>
                  </div>
                  <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="space-y-4">
            {rootCauses.slice(4).map((cause) => {
              const maxValue = Math.max(...rootCauses.map((c) => c.value));
              const percentage = (cause.value / maxValue) * 100;
              return (
                <div key={cause.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-medium">{cause.name}</span>
                    <span className="text-cyan-400 font-bold">{cause.value}</span>
                  </div>
                  <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
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

      {/* Issue Details Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">Recent Issues</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Issue</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Root Cause</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Device</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Engineer</th>
                <th className="text-center py-3 px-4 text-slate-400 font-medium text-sm">Status</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium text-sm">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.slice(0, 10).map((record) => (
                <tr key={record.serialNumber} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                  <td className="py-3 px-4 text-white">{record.issueReported}</td>
                  <td className="py-3 px-4 text-slate-300">{record.rootCause}</td>
                  <td className="py-3 px-4 text-slate-300 font-mono text-sm">{record.serialNumber}</td>
                  <td className="py-3 px-4 text-slate-300">{record.repairedBy}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        record.resolutionDate
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-orange-500/20 text-orange-400"
                      }`}
                    >
                      {record.resolutionDate ? "Resolved" : "Pending"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400 text-sm">{record.reportedDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
