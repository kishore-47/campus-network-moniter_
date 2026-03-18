import React, { useEffect, useState } from 'react';
import { PlusCircle, RefreshCw, Server, MapPin, Network } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';

const DEVICE_TYPES = ['Router', 'Switch', 'Server', 'Firewall', 'Computer'];

export default function AdminDevices() {
  const { token } = useAuth();
  const { darkMode } = useTheme();

  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '',
    ip_address: '',
    device_type: 'Router',
    location: ''
  });

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  const loadDevices = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(api('/devices'), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load devices');
      }

      setDevices(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm({
      name: '',
      ip_address: '',
      device_type: 'Router',
      location: ''
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(api('/devices'), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(form)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add device');
      }

      setSuccess('Device added successfully.');
      resetForm();
      await loadDevices();
    } catch (err) {
      setError(err.message || 'Failed to add device');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen p-6 ${darkMode ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900' : 'bg-gradient-to-br from-slate-100 via-blue-100 to-slate-200'}`}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className={`lg:col-span-1 rounded-2xl border p-6 ${darkMode ? 'bg-gray-900/60 border-gray-700 text-white' : 'bg-white/90 border-gray-200 text-gray-900'}`}>
          <div className="flex items-center gap-3 mb-6">
            <PlusCircle className="text-blue-500" size={24} />
            <h1 className="text-2xl font-bold">Add Device</h1>
          </div>

          {error && (
            <div className={`mb-4 rounded-lg border px-4 py-3 ${darkMode ? 'bg-red-900/20 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-700'}`}>
              {error}
            </div>
          )}

          {success && (
            <div className={`mb-4 rounded-lg border px-4 py-3 ${darkMode ? 'bg-emerald-900/20 border-emerald-700 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
              {success}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Device Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => onChange('name', e.target.value)}
                required
                className={`w-full rounded-lg border px-3 py-2 ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Core-Router-1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">IP Address</label>
              <input
                type="text"
                value={form.ip_address}
                onChange={(e) => onChange('ip_address', e.target.value)}
                required
                className={`w-full rounded-lg border px-3 py-2 ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="192.168.1.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Device Type</label>
              <select
                value={form.device_type}
                onChange={(e) => onChange('device_type', e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                {DEVICE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => onChange('location', e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Building A - Floor 2"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 transition-colors"
            >
              {submitting ? 'Adding...' : 'Add Device'}
            </button>
          </form>
        </section>

        <section className={`lg:col-span-2 rounded-2xl border p-6 ${darkMode ? 'bg-gray-900/60 border-gray-700 text-white' : 'bg-white/90 border-gray-200 text-gray-900'}`}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Server className="text-blue-500" size={22} />
              <h2 className="text-xl font-semibold">Managed Devices</h2>
            </div>
            <button
              onClick={loadDevices}
              disabled={loading}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 border ${darkMode ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-100'} transition-colors`}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-700/40">
            <table className="w-full text-left">
              <thead className={`${darkMode ? 'bg-gray-800/80 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">IP</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Location</th>
                </tr>
              </thead>
              <tbody>
                {devices.length === 0 && !loading && (
                  <tr>
                    <td colSpan="4" className={`px-4 py-6 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      No devices found.
                    </td>
                  </tr>
                )}

                {devices.map((device) => (
                  <tr key={device.id} className={`${darkMode ? 'border-t border-gray-800' : 'border-t border-gray-200'}`}>
                    <td className="px-4 py-3 font-medium">{device.name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1">
                        <Network size={14} />
                        {device.ip_address}
                      </span>
                    </td>
                    <td className="px-4 py-3">{device.device_type}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={14} />
                        {device.location || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
