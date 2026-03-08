import React, { useState, useEffect } from 'react';
import { Settings, Save, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { api } from '../api';

const ThresholdConfig = () => {
  const [thresholds, setThresholds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const { token, hasRole } = useAuth();

  useEffect(() => {
    fetchThresholds();
  }, []);

  const fetchThresholds = async () => {
    try {
      const response = await fetch(api('/thresholds'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setThresholds(data);
      }
    } catch (error) {
      console.error('Error fetching thresholds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id, warning, critical) => {
    try {
      const response = await fetch(api(`/thresholds/${id}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ warning, critical })
      });

      if (response.ok) {
        fetchThresholds();
        setEditing(null);
      }
    } catch (error) {
      console.error('Error updating threshold:', error);
    }
  };

  const getMetricIcon = (metric) => {
    const icons = {
      'latency': '⏱️',
      'packet_loss': '📉',
      'cpu_usage': '🔥',
      'memory_usage': '💾',
      'uptime': '⬆️'
    };
    return icons[metric] || '📊';
  };

  const getMetricColor = (metric) => {
    const colors = {
      'latency': 'blue',
      'packet_loss': 'red',
      'cpu_usage': 'orange',
      'memory_usage': 'purple',
      'uptime': 'green'
    };
    return colors[metric] || 'gray';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-white text-xl">Loading thresholds...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="text-blue-400" size={32} />
          <div>
            <h2 className="text-2xl font-bold text-white">Threshold Configuration</h2>
            <p className="text-gray-400">Configure alerting thresholds for network metrics</p>
          </div>
        </div>
        {hasRole('operator') && (
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all">
            <Plus size={18} />
            Add Threshold
          </button>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-blue-500/20 border border-blue-500 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="text-blue-400 flex-shrink-0 mt-1" size={20} />
        <div>
          <p className="text-blue-200 font-medium">How Thresholds Work</p>
          <p className="text-blue-300 text-sm mt-1">
            Warning thresholds trigger notifications. Critical thresholds create high-priority incidents.
            Adjust these values based on your network requirements.
          </p>
        </div>
      </div>

      {/* Thresholds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {thresholds.map((threshold) => (
          <div
            key={threshold.id}
            className={`bg-white/10 backdrop-blur-md rounded-xl p-6 border-2 ${
              editing === threshold.id ? 'border-blue-500' : 'border-transparent'
            } transition-all`}
          >
            {/* Metric Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`text-3xl bg-${getMetricColor(threshold.metric_type)}-500/20 w-14 h-14 rounded-lg flex items-center justify-center`}>
                  {getMetricIcon(threshold.metric_type)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white capitalize">
                    {threshold.metric_type.replace('_', ' ')}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {threshold.device_id ? `Device #${threshold.device_id}` : 'Global'}
                  </p>
                </div>
              </div>
              {hasRole('operator') && (
                <button
                  onClick={() => setEditing(editing === threshold.id ? null : threshold.id)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                >
                  <Settings className="text-gray-400" size={20} />
                </button>
              )}
            </div>

            {/* Threshold Values */}
            {editing === threshold.id ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Warning Threshold</label>
                  <input
                    type="number"
                    defaultValue={threshold.warning_threshold}
                    id={`warning-${threshold.id}`}
                    className="w-full px-4 py-2 bg-white/10 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Critical Threshold</label>
                  <input
                    type="number"
                    defaultValue={threshold.critical_threshold}
                    id={`critical-${threshold.id}`}
                    className="w-full px-4 py-2 bg-white/10 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <button
                  onClick={() => {
                    const warning = parseFloat(document.getElementById(`warning-${threshold.id}`).value);
                    const critical = parseFloat(document.getElementById(`critical-${threshold.id}`).value);
                    handleUpdate(threshold.id, warning, critical);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                >
                  <Save size={18} />
                  Save Changes
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Warning Level */}
                <div className="flex items-center justify-between p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-yellow-200 font-medium">Warning</span>
                  </div>
                  <span className="text-yellow-100 font-bold text-lg">
                    {threshold.warning_threshold}
                    {threshold.metric_type.includes('usage') || threshold.metric_type === 'uptime' ? '%' : 
                     threshold.metric_type === 'latency' ? 'ms' : ''}
                  </span>
                </div>

                {/* Critical Level */}
                <div className="flex items-center justify-between p-3 bg-red-500/20 rounded-lg border border-red-500/30">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-red-200 font-medium">Critical</span>
                  </div>
                  <span className="text-red-100 font-bold text-lg">
                    {threshold.critical_threshold}
                    {threshold.metric_type.includes('usage') || threshold.metric_type === 'uptime' ? '%' : 
                     threshold.metric_type === 'latency' ? 'ms' : ''}
                  </span>
                </div>

                {/* Operator Info */}
                <div className="text-center text-gray-400 text-sm pt-2">
                  Trigger when {threshold.operator === 'greater_than' ? '≥' : '≤'} threshold
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThresholdConfig;