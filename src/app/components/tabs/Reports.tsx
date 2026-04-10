import { useOutletContext } from "react-router";
import { FileText, Download, TrendingUp, Calendar, MapPin, Users } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getFilteredData, getStats, getLocationHeatmap, getDamageTypeDistribution } from "../../data/processData";
import type { DashboardOutletContext } from "../../types/dashboard";

export default function Reports() {
  const { filters, data } = useOutletContext<DashboardOutletContext>();

  const filteredData = getFilteredData(data, filters);
  const stats = getStats(filteredData);
  const locationData = getLocationHeatmap(filteredData);
  const damageTypes = getDamageTypeDistribution(filteredData);

  // Monthly trend data
  const monthlyData: Record<string, { resolved: number; pending: number }> = {};
  filteredData.forEach(record => {
    if (record.reportedDate) {
      const month = record.reportedDate.split('-')[1];
      const monthName = month === '01' ? 'Jan' : month === '02' ? 'Feb' : 'Mar';
      if (!monthlyData[monthName]) {
        monthlyData[monthName] = { resolved: 0, pending: 0 };
      }
      if (record.resolutionDate) {
        monthlyData[monthName].resolved++;
      } else {
        monthlyData[monthName].pending++;
      }
    }
  });
  const monthlyTrend = Object.entries(monthlyData).map(([month, data]) => ({
    month,
    resolved: data.resolved,
    pending: data.pending,
    total: data.resolved + data.pending,
  }));

  // Client performance
  const clientData: Record<string, number> = {};
  filteredData.forEach(record => {
    clientData[record.clientName] = (clientData[record.clientName] || 0) + 1;
  });
  const clientStats = Object.entries(clientData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Analytics Reports</h2>
          <p className="text-slate-400">Comprehensive insights and export capabilities</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-lg transition-all">
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all">
            <FileText className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/30 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-slate-400 text-sm">Period</div>
          </div>
          <div className="text-xl font-bold text-white">Jan 2026</div>
          <div className="text-xs text-slate-400 mt-1">{filteredData.length} total records</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/30 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-slate-400 text-sm">Success Rate</div>
          </div>
          <div className="text-xl font-bold text-white">{stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%</div>
          <div className="text-xs text-emerald-400 mt-1">+5% from last month</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/30 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <MapPin className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-slate-400 text-sm">Locations</div>
          </div>
          <div className="text-xl font-bold text-white">{locationData.length}</div>
          <div className="text-xs text-slate-400 mt-1">Active service areas</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/30 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Users className="w-5 h-5 text-orange-400" />
            </div>
            <div className="text-slate-400 text-sm">Clients</div>
          </div>
          <div className="text-xl font-bold text-white">{clientStats.length}</div>
          <div className="text-xs text-slate-400 mt-1">Total clients served</div>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">Monthly Performance Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={monthlyTrend}>
            <defs>
              <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#f1f5f9',
              }}
            />
            <Area type="monotone" dataKey="resolved" stroke="#14b8a6" fillOpacity={1} fill="url(#colorResolved)" />
            <Area type="monotone" dataKey="pending" stroke="#f97316" fillOpacity={1} fill="url(#colorPending)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-2 gap-6">
        {/* Client Performance */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Client Service Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={clientStats} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} width={80} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f1f5f9',
                }}
              />
              <Bar dataKey="value" fill="#06b6d4" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Damage Analysis */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Damage Type Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
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
              <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">Executive Summary</h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-3">
            <div className="text-slate-400 text-sm uppercase tracking-wider">Performance Metrics</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-300">Total Complaints</span>
                <span className="text-white font-bold">{stats.total}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-300">Resolved</span>
                <span className="text-emerald-400 font-bold">{stats.resolved}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-300">Pending</span>
                <span className="text-orange-400 font-bold">{stats.pending}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-slate-400 text-sm uppercase tracking-wider">Efficiency Metrics</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-300">Avg Resolution Time</span>
                <span className="text-cyan-400 font-bold">{stats.avgResolution}d</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-300">Success Rate</span>
                <span className="text-teal-400 font-bold">
                  {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-300">Active Locations</span>
                <span className="text-purple-400 font-bold">{locationData.length}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-slate-400 text-sm uppercase tracking-wider">Resource Allocation</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-300">Engineers Active</span>
                <span className="text-white font-bold">3</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-300">Clients Served</span>
                <span className="text-white font-bold">{clientStats.length}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-300">Service Areas</span>
                <span className="text-white font-bold">{locationData.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold mb-1">Report Export Options</h3>
            <p className="text-slate-400 text-sm">Download comprehensive reports in your preferred format</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all text-sm">
              Excel (.xlsx)
            </button>
            <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all text-sm">
              CSV (.csv)
            </button>
            <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all text-sm">
              JSON (.json)
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-lg transition-all text-sm font-medium">
              PDF Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
