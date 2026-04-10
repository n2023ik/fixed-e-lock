import { useOutletContext } from "react-router";
import { Award, TrendingUp, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { getFilteredData, getEngineerLeaderboard } from "../../data/processData";
import type { DashboardOutletContext } from "../../types/dashboard";

export default function Engineers() {
  const { filters, data } = useOutletContext<DashboardOutletContext>();

  const filteredData = getFilteredData(data, filters);
  const leaderboard = getEngineerLeaderboard(filteredData);

  // Engineer performance radar
  const engineerPerformance = leaderboard.slice(0, 3).map((eng) => ({
    engineer: eng.name,
    resolved: eng.resolved,
    total: eng.total,
    efficiency: eng.total > 0 ? Math.round((eng.resolved / eng.total) * 100) : 0,
  }));

  // Engineer workload over time
  const engineerWorkload = leaderboard.map((eng) => ({
    name: eng.name,
    resolved: eng.resolved,
    pending: eng.pending,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Engineer Performance</h2>
          <p className="text-slate-400">Track and analyze field engineer metrics</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 rounded-lg">
          <Award className="w-5 h-5 text-cyan-400" />
          <span className="text-white font-medium">Top Performers</span>
        </div>
      </div>

      {/* Top Engineers Cards */}
      <div className="grid grid-cols-3 gap-4">
        {leaderboard.slice(0, 3).map((engineer, index) => (
          <div
            key={engineer.name}
            className={`bg-gradient-to-br ${
              index === 0
                ? "from-yellow-500/10 to-yellow-600/5 border-yellow-500/30"
                : index === 1
                ? "from-slate-400/10 to-slate-500/5 border-slate-400/30"
                : "from-orange-500/10 to-orange-600/5 border-orange-500/30"
            } border rounded-xl p-6 relative overflow-hidden`}
          >
            <div className="absolute top-4 right-4">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                  index === 0
                    ? "bg-yellow-500/20 text-yellow-400"
                    : index === 1
                    ? "bg-slate-400/20 text-slate-300"
                    : "bg-orange-500/20 text-orange-400"
                }`}
              >
                #{index + 1}
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-white text-xl font-semibold">{engineer.name}</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Resolved</span>
                  <span className="text-teal-400 font-bold text-lg">{engineer.resolved}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Total Jobs</span>
                  <span className="text-white font-medium">{engineer.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Efficiency</span>
                  <span className="text-cyan-400 font-medium">
                    {engineer.total > 0 ? Math.round((engineer.resolved / engineer.total) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Workload Distribution */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h3 className="text-white font-semibold">Workload Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={engineerWorkload} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} width={60} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f1f5f9',
                }}
              />
              <Bar dataKey="resolved" stackId="a" fill="#14b8a6" radius={[0, 4, 4, 0]} />
              <Bar dataKey="pending" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Metrics */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-cyan-400" />
            <h3 className="text-white font-semibold">Performance Metrics</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={engineerPerformance}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="engineer" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <PolarRadiusAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Radar name="Efficiency" dataKey="efficiency" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f1f5f9',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Leaderboard */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">Detailed Rankings</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Rank</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Engineer</th>
                <th className="text-center py-3 px-4 text-slate-400 font-medium text-sm">Total Jobs</th>
                <th className="text-center py-3 px-4 text-slate-400 font-medium text-sm">Resolved</th>
                <th className="text-center py-3 px-4 text-slate-400 font-medium text-sm">Pending</th>
                <th className="text-center py-3 px-4 text-slate-400 font-medium text-sm">Efficiency</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium text-sm">Status</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((engineer, index) => {
                const efficiency = engineer.total > 0 ? Math.round((engineer.resolved / engineer.total) * 100) : 0;
                return (
                  <tr key={engineer.name} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                    <td className="py-3 px-4">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
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
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-white font-medium">{engineer.name}</span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-200">{engineer.total}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-teal-400 font-medium">{engineer.resolved}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-orange-400 font-medium">{engineer.pending}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-teal-500"
                            style={{ width: `${efficiency}%` }}
                          ></div>
                        </div>
                        <span className="text-cyan-400 text-sm font-medium w-10">{efficiency}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          efficiency >= 90
                            ? "bg-emerald-500/20 text-emerald-400"
                            : efficiency >= 70
                            ? "bg-cyan-500/20 text-cyan-400"
                            : "bg-orange-500/20 text-orange-400"
                        }`}
                      >
                        {efficiency >= 90 ? "Excellent" : efficiency >= 70 ? "Good" : "Average"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
