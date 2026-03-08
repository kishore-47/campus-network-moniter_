import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  Activity, AlertTriangle, Server, Wifi, WifiOff, TrendingUp, TrendingDown,
  Clock, Zap, CheckCircle, XCircle, AlertCircle, Eye, Settings, Download,
  Map, BarChart3, PieChart as PieChartIcon, Network, Cpu, HardDrive, 
  Monitor, Globe, Shield, Database
} from 'lucide-react';
import NotificationContainer, { showNotification } from './components/Notifications';
import SearchFilter from './components/SearchFilter';
import ExportPanel from './components/ExportPanel';
import HealthScore from './components/HealthScore';
import { api, API_BASE_URL } from './api';

// API_BASE_URL is also exported for components that reference it directly

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [latencyData, setLatencyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', 'map'
  const [selectedMetric, setSelectedMetric] = useState('latency');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // log the URLs we are about to call so they appear in the console
      const sumUrl = api('/summary');
      const alertUrl = api('/alerts');
      console.log('fetchData: calling', sumUrl, alertUrl);

      const [summaryRes, alertsRes] = await Promise.all([
        fetch(sumUrl),
        fetch(alertUrl)
      ]);

      const summaryData = await summaryRes.json();
      const alertsData = await alertsRes.json();

      setSummary(summaryData);
      setAlerts(alertsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      // show the API_BASE_URL as part of the message to help debugging
      showNotification.error(`Failed to fetch network data from ${API_BASE_URL}`);
      setLoading(false);
    }
  };

  const fetchDeviceLatency = async (deviceId, deviceName) => {
    try {
      const res = await fetch(api(`/device/${deviceId}/latency?hours=24`));
      const data = await res.json();
      
      const formattedData = data.data.map(entry => ({
        time: new Date(entry.timestamp).toLocaleTimeString(),
        latency: entry.latency_ms,
        timestamp: entry.timestamp
      }));

      setLatencyData(formattedData);
      setSelectedDevice(deviceName);
      showNotification.success(`Loaded data for ${deviceName}`);
    } catch (error) {
      console.error('Error fetching device latency:', error);
      showNotification.error('Failed to load device data');
    }
  };

  const filteredDevices = summary?.devices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.ip_address.includes(searchTerm);
    const matchesType = filterType === 'all' || device.device_type === filterType;
    const matchesStatus = filterStatus === 'all' || device.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <div className="text-white text-2xl font-semibold">
            Initializing Network Dashboard...
          </div>
          <div className="text-gray-400 text-sm mt-2">
            Loading real-time metrics
          </div>
        </motion.div>
      </div>
    );
  }

  const pieData = [
    { name: 'UP', value: summary?.devices_up || 0, color: '#10b981' },
    { name: 'DOWN', value: summary?.devices_down || 0, color: '#ef4444' }
  ];

  const alertData = alerts ? [
    { severity: 'CRITICAL', count: alerts.CRITICAL, color: '#dc2626', icon: '🔴' },
    { severity: 'HIGH', count: alerts.HIGH, color: '#f97316', icon: '🟠' },
    { severity: 'MEDIUM', count: alerts.MEDIUM, color: '#eab308', icon: '🟡' },
    { severity: 'LOW', count: alerts.LOW, color: '#3b82f6', icon: '🔵' }
  ] : [];

  const avgUptime = summary?.devices.reduce((acc, dev) => acc + dev.uptime_percent, 0) / (summary?.devices.length || 1);
  const avgLatency = summary?.devices.reduce((acc, dev) => acc + (dev.latest_latency_ms || 0), 0) / (summary?.devices.length || 1);

  // Performance data for radar chart
  const performanceData = [
    { metric: 'Uptime', value: avgUptime, fullMark: 100 },
    { metric: 'Speed', value: Math.max(0, 100 - avgLatency), fullMark: 100 },
    { metric: 'Reliability', value: 85, fullMark: 100 },
    { metric: 'Security', value: 92, fullMark: 100 },
    { metric: 'Coverage', value: (summary?.devices_up / summary?.total_devices) * 100, fullMark: 100 },
  ];

  // Device type distribution
  const deviceTypeData = summary?.devices.reduce((acc, device) => {
    const existing = acc.find(item => item.name === device.device_type);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: device.device_type, value: 1 });
    }
    return acc;
  }, []) || [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900' : 'bg-gradient-to-br from-gray-100 via-blue-100 to-purple-100'} transition-all duration-500`}>
      <NotificationContainer />
      
      {/* Animated Background Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-blue-400 rounded-full"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight 
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: [1, 2, 1],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{
              duration: Math.random() * 20 + 10,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      <div className="relative z-10 p-6">
        {/* Header with Glass Morphism */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/20">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg"
                >
                  <Activity className="text-white" size={40} />
                </motion.div>
                <div>
                  <h1 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-3`}>
                    Campus Network Monitor
                    <span className="text-sm font-normal text-blue-400 bg-blue-500/20 px-3 py-1 rounded-full">
                      v4.0 Pro
                    </span>
                  </h1>
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mt-1 flex items-center gap-2`}>
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Real-time network monitoring & advanced analytics
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {/* View Mode Toggle */}
                <div className="flex gap-2 bg-white/10 p-2 rounded-xl">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    <BarChart3 size={20} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Server size={20} />
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'map' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Network size={20} />
                  </button>
                </div>

                {/* Dark Mode Toggle */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-3 bg-white/10 backdrop-blur-md rounded-xl hover:bg-white/20 transition-all shadow-lg"
                >
                  {darkMode ? '🌙' : '☀️'}
                </motion.button>

                {/* Live Status */}
                <div className="text-right bg-green-500/20 px-4 py-2 rounded-xl border border-green-500/30">
                  <div className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-sm flex items-center gap-2`}>
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-2 h-2 bg-green-500 rounded-full"
                    />
                    Live
                  </div>
                  <div className={`${darkMode ? 'text-white' : 'text-gray-900'} font-semibold`}>
                    {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced KPI Cards with 3D Effect */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {[
            {
              title: 'Total Devices',
              value: summary?.total_devices || 0,
              icon: Server,
              gradient: 'from-blue-500 to-blue-700',
              detail: 'Monitored',
              trend: '+2 this week',
              trendUp: true
            },
            {
              title: 'Devices UP',
              value: summary?.devices_up || 0,
              icon: Wifi,
              gradient: 'from-green-500 to-green-700',
              detail: 'Online',
              trend: `${((summary?.devices_up / summary?.total_devices) * 100).toFixed(1)}%`,
              trendUp: true
            },
            {
              title: 'Devices DOWN',
              value: summary?.devices_down || 0,
              icon: WifiOff,
              gradient: 'from-red-500 to-red-700',
              detail: 'Offline',
              trend: summary?.devices_down > 0 ? 'Action needed' : 'All good',
              trendUp: false
            },
            {
              title: 'Active Alerts',
              value: alerts ? (alerts.CRITICAL + alerts.HIGH + alerts.MEDIUM + alerts.LOW) : 0,
              icon: AlertTriangle,
              gradient: 'from-orange-500 to-orange-700',
              detail: 'Pending',
              trend: `${alerts?.CRITICAL || 0} critical`,
              trendUp: false
            },
            {
              title: 'Avg Uptime',
              value: `${avgUptime.toFixed(1)}%`,
              icon: TrendingUp,
              gradient: 'from-purple-500 to-purple-700',
              detail: 'Last 24h',
              trend: avgUptime > 95 ? 'Excellent' : 'Good',
              trendUp: avgUptime > 95
            }
          ].map((kpi, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="group"
            >
              <div className={`bg-gradient-to-br ${kpi.gradient} rounded-2xl p-6 shadow-2xl relative overflow-hidden`}>
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent"></div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-white/80 text-sm font-medium mb-1">{kpi.title}</p>
                      <motion.h3 
                        className="text-4xl font-bold text-white"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                      >
                        {kpi.value}
                      </motion.h3>
                      <p className="text-white/60 text-xs mt-1">{kpi.detail}</p>
                    </div>
                    <motion.div
                      animate={{ 
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="bg-white/20 p-3 rounded-xl backdrop-blur-sm"
                    >
                      <kpi.icon className="text-white" size={32} />
                    </motion.div>
                  </div>

                  {/* Trend */}
                  <div className="flex items-center gap-2 mt-2">
                    {kpi.trendUp ? (
                      <TrendingUp size={16} className="text-white" />
                    ) : (
                      <TrendingDown size={16} className="text-white" />
                    )}
                    <span className="text-white/80 text-sm">{kpi.trend}</span>
                  </div>
                </div>

                {/* Glow Effect */}
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search & Export Row */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-6 flex flex-wrap justify-between items-center gap-4"
        >
          <div className="flex-1 min-w-[300px]">
            <SearchFilter
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterType={filterType}
              setFilterType={setFilterType}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
            />
          </div>
          <ExportPanel devices={filteredDevices} summary={summary} />
        </motion.div>

        {/* Advanced Visualizations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Network Performance Radar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className={`${darkMode ? 'bg-white/10' : 'bg-white'} backdrop-blur-xl rounded-2xl p-6 shadow-2xl border ${darkMode ? 'border-white/20' : 'border-gray-200'}`}
          >
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center gap-2`}>
              <Zap size={24} className="text-yellow-400" />
              Network Performance
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={performanceData}>
                <PolarGrid stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <PolarAngleAxis 
                  dataKey="metric" 
                  tick={{ fill: darkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar 
                  name="Performance" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.6}
                  animationDuration={1000}
                />
              </RadarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="bg-blue-500/20 rounded-lg p-2 text-center">
                <p className="text-blue-400 text-xs">Overall Score</p>
                <p className={`${darkMode ? 'text-white' : 'text-gray-900'} font-bold text-lg`}>
                  {Math.round(performanceData.reduce((acc, d) => acc + d.value, 0) / performanceData.length)}%
                </p>
              </div>
              <div className="bg-green-500/20 rounded-lg p-2 text-center">
                <p className="text-green-400 text-xs">Status</p>
                <p className={`${darkMode ? 'text-white' : 'text-gray-900'} font-bold text-lg`}>Excellent</p>
              </div>
            </div>
          </motion.div>

          {/* Device Availability Donut */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className={`${darkMode ? 'bg-white/10' : 'bg-white'} backdrop-blur-xl rounded-2xl p-6 shadow-2xl border ${darkMode ? 'border-white/20' : 'border-gray-200'}`}
          >
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center gap-2`}>
              <PieChartIcon size={24} className="text-blue-400" />
              Device Availability
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={1000}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#1f2937' : '#ffffff', 
                    border: 'none', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex justify-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  UP: {summary?.devices_up}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  DOWN: {summary?.devices_down}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Alert Distribution */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className={`${darkMode ? 'bg-white/10' : 'bg-white'} backdrop-blur-xl rounded-2xl p-6 shadow-2xl border ${darkMode ? 'border-white/20' : 'border-gray-200'}`}
          >
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center gap-2`}>
              <AlertTriangle size={24} className="text-orange-400" />
              Alert Distribution
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={alertData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis 
                  dataKey="severity" 
                  stroke={darkMode ? '#9ca3af' : '#6b7280'}
                  tick={{ fontSize: 12 }}
                />
                <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                  }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} animationDuration={1000}>
                  {alertData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {alertData.map((alert, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-2xl mb-1">{alert.icon}</div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {alert.severity}
                  </div>
                  <div className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {alert.count}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Device Type Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className={`${darkMode ? 'bg-white/10' : 'bg-white'} backdrop-blur-xl rounded-2xl p-6 shadow-2xl border ${darkMode ? 'border-white/20' : 'border-gray-200'} mb-8`}
        >
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-6 flex items-center gap-2`}>
            <Network size={24} className="text-purple-400" />
            Device Type Distribution
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {deviceTypeData.map((type, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl p-4 text-center border border-blue-500/30"
              >
                <div className="text-4xl mb-2">
                  {type.name === 'Router' ? '🔀' :
                   type.name === 'Switch' ? '🔄' :
                   type.name === 'Server' ? '🖥️' :
                   type.name === 'Firewall' ? '🛡️' :
                   type.name === 'Computer' ? '💻' : '📱'}
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>
                  {type.name}
                </p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {type.value}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Device Table - Enhanced with Glass Morphism */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className={`${darkMode ? 'bg-white/10' : 'bg-white'} backdrop-blur-xl rounded-2xl p-6 shadow-2xl border ${darkMode ? 'border-white/20' : 'border-gray-200'} mb-8`}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
              <Monitor size={24} className="text-blue-400" />
              Device Status Monitor
              <span className={`text-sm font-normal ${darkMode ? 'text-gray-400' : 'text-gray-600'} ml-2`}>
                ({filteredDevices.length} devices)
              </span>
            </h3>
            
            {/* Mini Stats */}
            <div className="flex gap-4">
              <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 font-semibold">{summary?.devices_up} UP</span>
              </div>
              <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1 rounded-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-red-400 font-semibold">{summary?.devices_down} DOWN</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                  <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-semibold`}>Status</th>
                  <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-semibold`}>Device</th>
                  <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-semibold`}>Type</th>
                  <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-semibold`}>Location</th>
                  <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-semibold`}>Health</th>
                  <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-semibold`}>Uptime</th>
                  <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-semibold`}>Latency</th>
                  <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-semibold`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredDevices.map((device, index) => (
                    <motion.tr
                      key={device.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`border-b ${darkMode ? 'border-gray-800 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'} transition-all duration-200`}
                    >
                      <td className="py-4 px-4">
                        {device.status === 'UP' ? (
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="flex items-center gap-2"
                          >
                            <div className="relative">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                            </div>
                            <span className="text-green-400 font-semibold">UP</span>
                          </motion.div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span className="text-red-400 font-semibold">DOWN</span>
                          </div>
                        )}
                      </td>
                      
                      <td className="py-4 px-4">
                        <div>
                          <p className={`${darkMode ? 'text-white' : 'text-gray-900'} font-semibold`}>
                            {device.name}
                          </p>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} font-mono`}>
                            {device.ip_address}
                          </p>
                        </div>
                      </td>
                      
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium border border-blue-500/30">
                          {device.device_type}
                        </span>
                      </td>
                      
                      <td className="py-4 px-4">
                        <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {device.location}
                        </span>
                      </td>
                      
                      <td className="py-4 px-4">
                        <HealthScore device={device} />
                      </td>
                      
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${device.uptime_percent}%` }}
                              transition={{ duration: 1, delay: index * 0.05 }}
                              className={`h-full ${
                                device.uptime_percent >= 95 ? 'bg-green-500' :
                                device.uptime_percent >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                            />
                          </div>
                          <span className={`font-semibold text-sm ${
                            device.uptime_percent >= 95 ? 'text-green-400' :
                            device.uptime_percent >= 80 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {device.uptime_percent.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      
                      <td className="py-4 px-4">
                        {device.latest_latency_ms ? (
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-gray-400" />
                            <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} font-mono text-sm`}>
                              {device.latest_latency_ms.toFixed(1)}ms
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500">N/A</span>
                        )}
                      </td>
                      
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => fetchDeviceLatency(device.id, device.name)}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-all shadow-lg"
                          >
                            <Eye size={16} /> 
                            Details
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all"
                          >
                            <Settings size={16} />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Latency Graph - Enhanced with Gradient */}
        <AnimatePresence>
          {selectedDevice && latencyData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className={`${darkMode ? 'bg-white/10' : 'bg-white'} backdrop-blur-xl rounded-2xl p-6 shadow-2xl border ${darkMode ? 'border-white/20' : 'border-gray-200'}`}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                  <TrendingUp size={24} className="text-green-400" />
                  Latency History - {selectedDevice}
                </h3>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDevice(null)}
                  className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all"
                >
                  ✕ Close
                </motion.button>
              </div>
              
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={latencyData}>
                  <defs>
                    <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                  <XAxis 
                    dataKey="time" 
                    stroke={darkMode ? '#9ca3af' : '#6b7280'}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    stroke={darkMode ? '#9ca3af' : '#6b7280'}
                    label={{ 
                      value: 'Latency (ms)', 
                      angle: -90, 
                      position: 'insideLeft',
                      fill: darkMode ? '#9ca3af' : '#6b7280'
                    }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }}
                    labelStyle={{ color: darkMode ? '#fff' : '#000' }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="latency" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorLatency)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>

              {/* Latency Stats */}
              <div className="grid grid-cols-4 gap-4 mt-6">
                {[
                  { label: 'Average', value: `${(latencyData.reduce((acc, d) => acc + d.latency, 0) / latencyData.length).toFixed(1)}ms`, color: 'blue' },
                  { label: 'Minimum', value: `${Math.min(...latencyData.map(d => d.latency)).toFixed(1)}ms`, color: 'green' },
                  { label: 'Maximum', value: `${Math.max(...latencyData.map(d => d.latency)).toFixed(1)}ms`, color: 'red' },
                  { label: 'Current', value: `${latencyData[latencyData.length - 1].latency.toFixed(1)}ms`, color: 'purple' }
                ].map((stat, idx) => (
                  <div key={idx} className={`bg-${stat.color}-500/20 rounded-xl p-4 text-center border border-${stat.color}-500/30`}>
                    <p className={`text-${stat.color}-400 text-sm mb-1`}>{stat.label}</p>
                    <p className={`${darkMode ? 'text-white' : 'text-gray-900'} font-bold text-lg`}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Dashboard;