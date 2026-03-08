import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, Download } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../AuthContext';
import { api } from '../api';

const Analytics = () => {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const { token } = useAuth();

  useEffect(() => {
    fetchTrends();
  }, [days]);

  const fetchTrends = async () => {
    try {
      const response = await fetch(api(`/analytics/trends?days=${days}`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTrends(data);
      }
    } catch (error) {
      console.error('Error fetching trends:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-white text-xl">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="text-blue-400" size={32} />
          <div>
            <h2 className="text-2xl font-bold text-white">Network Analytics</h2>
            <p className="text-gray-400">Historical trends and performance insights</p>
          </div>
        </div>
        <div className="flex gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-4 py-2 bg-white/10 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={7}>Last 7 Days</option>
            <option value={14}>Last 14 Days</option>
            <option value={30}>Last 30 Days</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all">
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {/* Uptime Trend */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp size={24} className="text-green-400" />
          Network Uptime Trend
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trends?.uptime_trend || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" domain={[0, 100]} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="uptime_percent"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ r: 4 }}
              name="Uptime %"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Latency Trend */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp size={24} className="text-blue-400" />
          Average Latency Trend
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trends?.latency_trend || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="avg_latency"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 4 }}
              name="Latency (ms)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Incident Trend */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <BarChart3 size={24} className="text-red-400" />
          Incident Trend by Severity
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={trends?.incident_trend || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend />
            <Bar dataKey="incident_count" fill="#ef4444" name="Incidents" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Analytics;