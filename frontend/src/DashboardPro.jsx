import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial, Float, Text3D, Center } from '@react-three/drei';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, Cell, RadialBarChart, RadialBar,
  Treemap, Sankey, FunnelChart, Funnel, LabelList
} from 'recharts';
import { 
  Activity, AlertTriangle, Server, Wifi, WifiOff, TrendingUp, TrendingDown,
  Clock, Zap, CheckCircle, XCircle, AlertCircle, Eye, Settings, Download,
  Map, BarChart3, PieChart as PieChartIcon, Network, Cpu, HardDrive, 
  Monitor, Globe, Shield, Database, Layers, GitBranch, Radio, Tv,
  Smartphone, Tablet, Watch, Cloud, CloudRain, Sun, Moon, Star,
  Target, Award, Bell, BellOff, Volume2, VolumeX,
  Maximize2, Minimize2, RefreshCw, Filter, Search, ChevronDown
} from 'lucide-react';
import GaugeChart from 'react-gauge-chart';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import Particles from 'react-particles';
import { loadFull } from "tsparticles";

import { api, API_BASE_URL } from './api';

// 3D Animated Sphere Component
const AnimatedSphere = ({ status }) => {
  const meshRef = useRef();

  useEffect(() => {
    const interval = setInterval(() => {
      if (meshRef.current) {
        meshRef.current.rotation.x += 0.01;
        meshRef.current.rotation.y += 0.01;
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // determine color based on status with a neutral fallback
  const color = (() => {
    if (status === 'UP') return '#10b981';
    if (status === 'DOWN') return '#ef4444';
    // loading or unknown
    return '#60a5fa';
  })();

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <Sphere ref={meshRef} args={[1, 32, 32]}>
        <MeshDistortMaterial
          color={color}
          attach="material"
          distort={0.5}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
};

// Particle Background Configuration
const particlesInit = async (main) => {
  await loadFull(main);
};

const particlesConfig = {
  particles: {
    number: {
      value: 80,
      density: {
        enable: true,
        value_area: 800
      }
    },
    color: {
      value: "#60a5fa"
    },
    shape: {
      type: "circle"
    },
    opacity: {
      value: 0.3,
      random: true,
      anim: {
        enable: true,
        speed: 1,
        opacity_min: 0.1,
        sync: false
      }
    },
    size: {
      value: 3,
      random: true,
      anim: {
        enable: true,
        speed: 2,
        size_min: 0.1,
        sync: false
      }
    },
    line_linked: {
      enable: true,
      distance: 150,
      color: "#60a5fa",
      opacity: 0.2,
      width: 1
    },
    move: {
      enable: true,
      speed: 1,
      direction: "none",
      random: false,
      straight: false,
      out_mode: "out",
      bounce: false,
    }
  },
  interactivity: {
    detect_on: "canvas",
    events: {
      onhover: {
        enable: true,
        mode: "repulse"
      },
      onclick: {
        enable: true,
        mode: "push"
      },
      resize: true
    },
    modes: {
      repulse: {
        distance: 100,
        duration: 0.4
      },
      push: {
        particles_nb: 4
      }
    }
  },
  retina_detect: true
};

// Premium Metric Card Component
const MetricCard3D = ({ title, value, icon: Icon, gradient, trend, trendValue, delay }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotateX: -30 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ 
        delay, 
        duration: 0.8,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ 
        scale: 1.05, 
        rotateY: 5,
        z: 50,
        transition: { duration: 0.3 }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative group perspective-1000"
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div className={`relative bg-gradient-to-br ${gradient} rounded-3xl p-6 shadow-2xl overflow-hidden`}>
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 opacity-30">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id={`grid-${title}`} width="20" height="20" patternUnits="userSpaceOnUse">
                <motion.path
                  d="M 20 0 L 0 0 0 20"
                  fill="none"
                  stroke="white"
                  strokeWidth="0.5"
                  animate={{ pathLength: [0, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#grid-${title})`} />
          </svg>
        </div>

        {/* Holographic Effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{
            x: isHovered ? ['0%', '100%', '0%'] : '0%',
          }}
          transition={{
            duration: 2,
            repeat: isHovered ? Infinity : 0,
            ease: "linear"
          }}
          style={{ transform: 'skewX(-20deg)' }}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Icon with 3D effect */}
          <motion.div
            className="mb-4 relative"
            animate={{
              rotateY: isHovered ? 360 : 0,
              rotateX: isHovered ? [0, 10, 0] : 0
            }}
            transition={{ duration: 1 }}
          >
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-white/20 blur-xl rounded-full transform scale-150" />
              <div className="relative bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/30">
                <Icon className="text-white" size={32} />
              </div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.h3 
            className="text-white/80 text-sm font-medium mb-2"
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {title}
          </motion.h3>

          {/* Value with counting animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.3, type: "spring" }}
            className="text-4xl font-bold text-white mb-2"
          >
            {value}
          </motion.div>

          {/* Trend Indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {trend === 'up' ? (
                <TrendingUp className="text-white/80" size={16} />
              ) : (
                <TrendingDown className="text-white/80" size={16} />
              )}
              <span className="text-white/80 text-sm">{trendValue}</span>
            </div>

            {/* Mini Sparkline */}
            <svg width="60" height="20" className="opacity-50">
              <motion.polyline
                points="0,15 10,12 20,14 30,8 40,10 50,5 60,7"
                fill="none"
                stroke="white"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, delay }}
              />
            </svg>
          </div>
        </div>

        {/* Glow Effect */}
        <motion.div
          className="absolute bottom-0 right-0 w-40 h-40 rounded-full blur-3xl"
          animate={{
            scale: isHovered ? [1, 1.2, 1] : 1,
            opacity: isHovered ? [0.2, 0.4, 0.2] : 0.2
          }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)' }}
        />

        {/* Corner Accent */}
        <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <motion.path
              d="M100,0 L100,100 L0,100 Z"
              fill="white"
              initial={{ scale: 0, rotate: 0 }}
              animate={{ scale: 1, rotate: 360 }}
              transition={{ duration: 2, delay }}
            />
          </svg>
        </div>
      </div>
    </motion.div>
  );
};

// Advanced Gauge Component
const AdvancedGauge = ({ value, title, color }) => {
  return (
    <div className="relative">
      <GaugeChart
        id={`gauge-${title}`}
        nrOfLevels={30}
        percent={value / 100}
        colors={[color, "#4ade80"]}
        arcWidth={0.3}
        needleColor="#1f2937"
        needleBaseColor="#1f2937"
        textColor="#ffffff"
        animate={true}
        animDelay={500}
      />
      <div className="text-center mt-2">
        <p className="text-white font-semibold text-lg">{value}%</p>
        <p className="text-gray-400 text-sm">{title}</p>
      </div>
    </div>
  );
};

// Heat Map Component
const HeatMap = ({ data }) => {
  const [hoveredCell, setHoveredCell] = useState(null);

  return (
    <div className="grid grid-cols-7 gap-2">
      {data.map((item, idx) => {
        const intensity = item.value / 100;
        return (
          <motion.div
            key={idx}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: idx * 0.02 }}
            whileHover={{ scale: 1.2, z: 50 }}
            onHoverStart={() => setHoveredCell(idx)}
            onHoverEnd={() => setHoveredCell(null)}
            className="relative aspect-square rounded-lg cursor-pointer"
            style={{
              backgroundColor: `rgba(59, 130, 246, ${intensity})`,
              boxShadow: hoveredCell === idx ? '0 10px 30px rgba(59, 130, 246, 0.5)' : 'none'
            }}
          >
            {hoveredCell === idx && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
              >
                {item.label}: {item.value}%
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

// Network Flow Visualization
const NetworkFlow = ({ devices }) => {
  return (
    <div className="relative h-64">
      <svg className="w-full h-full">
        <defs>
          <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Central Node */}
        <motion.circle
          cx="50%"
          cy="50%"
          r="30"
          fill="#3b82f6"
          stroke="#3b82f6"
          strokeWidth="2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1 }}
        />

        {/* Connection Lines with Flow Animation */}
        {devices?.slice(0, 8).map((device, idx) => {
          const angle = (idx / 8) * Math.PI * 2;
          const x = 50 + Math.cos(angle) * 40;
          const y = 50 + Math.sin(angle) * 35;

          return (
            <g key={device.id}>
              <motion.line
                x1="50%"
                y1="50%"
                x2={`${x}%`}
                y2={`${y}%`}
                stroke="url(#flowGradient)"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: idx * 0.1 }}
              />

              {/* Flowing Particles */}
              <motion.circle
                r="3"
                fill="#3b82f6"
                animate={{
                  cx: ['50%', `${x}%`, '50%'],
                  cy: ['50%', `${y}%`, '50%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: idx * 0.3,
                  ease: "linear"
                }}
              />

              {/* Endpoint Nodes */}
              <motion.circle
                cx={`${x}%`}
                cy={`${y}%`}
                r="10"
                fill={device.status === 'UP' ? '#10b981' : '#ef4444'}
                stroke="white"
                strokeWidth="2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.5 }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// Main Dashboard Component
const DashboardPro = () => {
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('overview'); // overview, analytics, topology, reports
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  useEffect(() => {
    console.log('DashboardPro mounting - fetching data');
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);
  const fetchData = async () => {
    try {
      console.log('DashboardPro.fetchData: starting');
      const [summaryRes, alertsRes] = await Promise.all([
        fetch(api('/summary')),
        fetch(api('/alerts'))
      ]);

      console.log('DashboardPro.fetchData: summary status', summaryRes.status, 'alerts status', alertsRes.status);

      const summaryData = summaryRes.ok ? await summaryRes.json() : null;
      const alertsData = alertsRes.ok ? await alertsRes.json() : null;

      if (!summaryRes.ok) console.error('Failed to fetch /summary', summaryRes.status);
      if (!alertsRes.ok) console.error('Failed to fetch /alerts', alertsRes.status);

      setSummary(summaryData);
      setAlerts(alertsData);
      setLoading(false);
    } catch (error) {
      console.error('DashboardPro.fetchData error:', error);
      setLoading(false);
      setSummary(null);
      setAlerts(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        <Particles id="tsparticles" init={particlesInit} options={particlesConfig} />
        
        <div className="relative z-10 text-center">
          {/* 3D Loading Animation */}
          <div className="w-64 h-64 mx-auto mb-8">
            <Canvas>
              <Suspense fallback={null}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <AnimatedSphere status="loading" />
                <OrbitControls enableZoom={false} />
              </Suspense>
            </Canvas>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-4xl font-bold text-white mb-2">
              Initializing Neural Network
            </h2>
            <p className="text-gray-400">Loading quantum metrics...</p>
            
            {/* Progress Bar */}
            <div className="w-64 h-2 bg-gray-800 rounded-full mx-auto overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const avgUptime = (summary?.devices || []).reduce((acc, dev) => acc + (dev.uptime_percent || 0), 0) / (summary?.devices?.length || 1);
  const devicesUpRatio = summary?.total_devices ? ((summary?.devices_up || 0) / (summary?.total_devices || 1)) * 100 : 0;
  const networkHealth = Math.round(((isFinite(avgUptime) ? avgUptime : 0) + devicesUpRatio) / 2);

  // Generate heat map data
  const heatMapData = Array.from({ length: 28 }, (_, i) => ({
    label: `Day ${i + 1}`,
    value: Math.random() * 100
  }));

  // If we've finished loading but received no summary, surface a clear message
  if (!loading && !summary) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-2xl text-center">
          <h2 className="text-2xl font-bold mb-4">No data received from backend</h2>
          <p className="text-gray-400 mb-4">The dashboard did not receive data from <code>{API_BASE_URL}/summary</code>. Check the backend, CORS, or open developer tools for errors.</p>
          <div className="flex justify-center gap-4">
            <button onClick={fetchData} className="px-4 py-2 bg-blue-600 rounded">Retry</button>
            <button onClick={() => console.log('Auth token:', localStorage.getItem('token'))} className="px-4 py-2 bg-gray-700 rounded">Dump Token</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Particle Background */}
      <Particles 
        id="tsparticles-main" 
        init={particlesInit} 
        options={particlesConfig}
        className="fixed inset-0"
      />

      {/* Main Content */}
      <div className="relative z-10">
        {/* Ultra-Modern Header */}
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-50 backdrop-blur-2xl bg-gradient-to-r from-gray-900/80 via-blue-900/80 to-purple-900/80 border-b border-white/10"
        >
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo with 3D effect */}
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ 
                    rotateY: [0, 360],
                    rotateX: [0, 360]
                  }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-2xl"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <Activity className="text-white" size={24} />
                </motion.div>
                
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    NEURAL NETWORK MONITOR
                  </h1>
                  <p className="text-xs text-gray-400">Enterprise Edition v4.0</p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <nav className="flex gap-2 bg-white/5 p-2 rounded-2xl backdrop-blur-xl">
                {[
                  { id: 'overview', label: 'Overview', icon: Eye },
                  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                  { id: 'topology', label: 'Topology', icon: Network },
                  { id: 'reports', label: 'Reports', icon: PieChartIcon }
                ].map((tab) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => setSelectedView(tab.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
                      selectedView === tab.id
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <tab.icon size={18} />
                    <span className="font-medium">{tab.label}</span>
                  </motion.button>
                ))}
              </nav>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={fetchData}
                  className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all backdrop-blur-xl"
                >
                  <RefreshCw size={20} />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all backdrop-blur-xl"
                >
                  {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </motion.button>

                <div className="flex items-center gap-2 bg-green-500/20 px-4 py-2 rounded-xl border border-green-500/30">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 bg-green-500 rounded-full"
                  />
                  <span className="text-green-400 text-sm font-semibold">LIVE</span>
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Main Content Area */}
        <main className="container mx-auto px-6 py-8">
          <AnimatePresence mode="wait">
            {selectedView === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ duration: 0.5 }}
              >
                {/* Premium Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                  <MetricCard3D
                    title="Total Devices"
                    value={summary?.total_devices || 0}
                    icon={Server}
                    gradient="from-blue-600 via-blue-500 to-cyan-500"
                    trend="up"
                    trendValue="+12.5%"
                    delay={0}
                  />
                  <MetricCard3D
                    title="Online Now"
                    value={summary?.devices_up || 0}
                    icon={Wifi}
                    gradient="from-green-600 via-emerald-500 to-teal-500"
                    trend="up"
                    trendValue="98.2%"
                    delay={0.1}
                  />
                  <MetricCard3D
                    title="Offline"
                    value={summary?.devices_down || 0}
                    icon={WifiOff}
                    gradient="from-red-600 via-rose-500 to-pink-500"
                    trend="down"
                    trendValue="-2.1%"
                    delay={0.2}
                  />
                  <MetricCard3D
                    title="Active Alerts"
                    value={alerts ? (alerts.CRITICAL + alerts.HIGH + alerts.MEDIUM + alerts.LOW) : 0}
                    icon={AlertTriangle}
                    gradient="from-orange-600 via-amber-500 to-yellow-500"
                    trend="down"
                    trendValue="-5 today"
                    delay={0.3}
                  />
                  <MetricCard3D
                    title="Health Score"
                    value={`${networkHealth}%`}
                    icon={Award}
                    gradient="from-purple-600 via-violet-500 to-indigo-500"
                    trend="up"
                    trendValue="Excellent"
                    delay={0.4}
                  />
                </div>

                {/* Advanced Visualizations Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  {/* Network Health Gauge */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl"
                  >
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <Target className="text-purple-400" size={24} />
                      Network Health
                    </h3>
                    <AdvancedGauge 
                      value={networkHealth} 
                      title="Overall Performance" 
                      color="#ef4444"
                    />
                  </motion.div>

                  {/* Network Flow Visualization */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl"
                  >
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <Network className="text-blue-400" size={24} />
                      Network Topology
                    </h3>
                    <NetworkFlow devices={summary?.devices} />
                  </motion.div>

                  {/* Activity Heat Map */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 }}
                    className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl"
                  >
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <Layers className="text-pink-400" size={24} />
                      Activity Heat Map
                    </h3>
                    <HeatMap data={heatMapData} />
                  </motion.div>
                </div>

                {/* Real-time Metrics Section */}
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl mb-8"
                >
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold flex items-center gap-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      >
                        <Zap className="text-yellow-400" size={28} />
                      </motion.div>
                      Real-Time Performance Metrics
                    </h3>

                    <div className="flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold"
                      >
                        Last 24h
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-2 bg-white/10 rounded-xl font-semibold hover:bg-white/20 transition-all"
                      >
                        Export Data
                      </motion.button>
                    </div>
                  </div>

                  {/* Circular Progress Indicators */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                    {[
                      { label: 'Uptime', value: avgUptime, color: '#10b981' },
                      { label: 'Throughput', value: 87, color: '#3b82f6' },
                      { label: 'Response Time', value: 92, color: '#8b5cf6' },
                      { label: 'Packet Loss', value: 5, color: '#ef4444' }
                    ].map((metric, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.9 + idx * 0.1 }}
                        className="relative"
                      >
                        <div className="w-32 h-32 mx-auto">
                          <CircularProgressbar
                            value={metric.value}
                            text={`${Math.round(metric.value)}%`}
                            styles={buildStyles({
                              rotation: 0.25,
                              strokeLinecap: 'round',
                              textSize: '16px',
                              pathTransitionDuration: 1.5,
                              pathColor: metric.color,
                              textColor: '#ffffff',
                              trailColor: '#1f2937',
                              backgroundColor: '#000000',
                            })}
                          />
                        </div>
                        <p className="text-center mt-3 text-gray-400 font-medium">
                          {metric.label}
                        </p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Advanced Line Chart */}
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart
                      data={(summary?.devices || []).slice(0, 10).map((d, i) => ({
                        name: d?.name || `Device ${i+1}`,
                        latency: d?.latest_latency_ms || 0,
                        uptime: d?.uptime_percent || 0,
                        health: Math.random() * 100
                      }))}
                    >
                      <defs>
                        <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorUptime" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#9ca3af"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '12px',
                          boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
                        }}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="uptime" 
                        fill="url(#colorUptime)" 
                        stroke="#10b981"
                        strokeWidth={2}
                        animationDuration={1500}
                      />
                      <Bar 
                        dataKey="latency" 
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                        animationDuration={1000}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="health" 
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        dot={{ r: 5 }}
                        animationDuration={2000}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* 3D Device Status Grid */}
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                  className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl"
                >
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <Monitor className="text-cyan-400" size={28} />
                    Live Device Status
                  </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {(summary?.devices || []).slice(0, 8).map((device, idx) => (
                      <motion.div
                        key={device.id}
                        initial={{ opacity: 0, rotateY: -90 }}
                        animate={{ opacity: 1, rotateY: 0 }}
                        transition={{ delay: 1.1 + idx * 0.05 }}
                        whileHover={{ scale: 1.05, rotateY: 10, z: 50 }}
                        className="relative bg-gradient-to-br from-gray-800/50 to-gray-700/50 rounded-2xl p-6 border border-white/5 hover:border-white/20 transition-all cursor-pointer"
                        style={{ transformStyle: 'preserve-3d' }}
                      >
                        {/* Status Indicator */}
                        <div className="absolute top-3 right-3">
                          <motion.div
                            animate={{
                              scale: device.status === 'UP' ? [1, 1.2, 1] : 1,
                              opacity: device.status === 'UP' ? [1, 0.5, 1] : 1
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className={`w-3 h-3 rounded-full ${
                              device.status === 'UP' ? 'bg-green-500' : 'bg-red-500'
                            }`}
                          />
                        </div>

                        {/* Device Icon */}
                        <div className="mb-4">
                          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                            <Server className="text-blue-400" size={32} />
                          </div>
                        </div>

                        {/* Device Info */}
                        <h4 className="text-white font-bold text-center mb-2">
                          {device.name}
                        </h4>
                        <p className="text-gray-400 text-sm text-center font-mono mb-3">
                          {device.ip_address}
                        </p>

                        {/* Mini Stats */}
                        <div className="flex justify-between text-xs">
                          <div className="text-center flex-1">
                            <p className="text-gray-500 mb-1">Uptime</p>
                            <p className="text-green-400 font-bold">
                              {(Number(device?.uptime_percent) || 0).toFixed(0)}%
                            </p>
                          </div>
                          <div className="text-center flex-1 border-x border-gray-700">
                            <p className="text-gray-500 mb-1">Latency</p>
                            <p className="text-blue-400 font-bold">
                              {device?.latest_latency_ms != null ? `${Math.round(device.latest_latency_ms)}ms` : 'N/A'}
                            </p>
                          </div>
                          <div className="text-center flex-1">
                            <p className="text-gray-500 mb-1">Status</p>
                            <p className={`font-bold ${device.status === 'UP' ? 'text-green-400' : 'text-red-400'}`}>
                              {device.status}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default DashboardPro;