# Intelligent Campus Network Monitoring and Health Analytics System 

<div align="center">

![Network Monitor](https://img.shields.io/badge/Network-Monitoring-blue?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.8+-green?style=for-the-badge&logo=python)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=for-the-badge&logo=flask)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**A real-time network monitoring system with enterprise-grade dashboard for tracking device health, performance metrics, and automated alerting.**

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Usage](#-usage) • [Architecture](#-architecture) • [Screenshots](#-screenshots)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Screenshots](#-screenshots)
- [Project Structure](#-project-structure)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

---

## 🎯 Overview

Campus Network Monitor is a comprehensive network monitoring solution designed for educational institutions, small businesses, and home networks. It provides real-time visibility into network device health, performance metrics, and automated incident management through an intuitive web-based dashboard.

### Key Highlights

- 🔄 **Real-time Monitoring** - Continuous device health checks every 30 seconds
- 📊 **Advanced Analytics** - Historical data analysis with interactive charts
- 🚨 **Smart Alerting** - Automatic incident creation with severity classification
- 🎨 **Modern UI** - Beautiful, responsive dashboard with dark/light themes
- 📱 **Mobile-Friendly** - Fully responsive design for on-the-go monitoring
- 📤 **Data Export** - Export reports in CSV and JSON formats

---

## ✨ Features

### Monitoring Capabilities

- ✅ **ICMP Ping Monitoring** - Continuous device reachability checks
- ✅ **Latency Measurement** - Real-time network performance tracking
- ✅ **Uptime Calculation** - 24-hour rolling uptime percentages
- ✅ **Health Scoring** - Intelligent device health score algorithm
- ✅ **State Detection** - Automatic detection of UP/DOWN transitions
- ✅ **Incident Management** - Automated incident creation with severity levels

### Dashboard Features

- 📊 **Live KPI Cards** - Total devices, UP/DOWN counts, active alerts, average uptime
- 📈 **Interactive Charts** - Pie charts, bar graphs, and area charts using Recharts
- 🔍 **Advanced Search & Filter** - Search by name/IP, filter by type and status
- 💾 **Data Export** - Export device data to CSV or JSON
- 🎨 **Theme Toggle** - Dark and light mode support
- 🔔 **Toast Notifications** - Real-time alerts for device state changes
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- ⚡ **Auto-Refresh** - Configurable refresh intervals (default: 30s)

### Technical Features

- 🏗️ **RESTful API** - Clean API architecture with Flask
- 💾 **Time-Series Database** - SQLite with optimized queries
- 🔄 **Background Processing** - Non-blocking monitoring with threading
- 🌐 **CORS Support** - Secure cross-origin resource sharing
- 🎯 **Modular Architecture** - Separation of concerns (Monitor, API, UI)

---

## 🛠️ Tech Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| ![Python](https://img.shields.io/badge/Python-3.8+-blue?logo=python) | 3.8+ | Core monitoring logic |
| ![Flask](https://img.shields.io/badge/Flask-3.0-black?logo=flask) | 3.0 | REST API server |
| ![SQLite](https://img.shields.io/badge/SQLite-3-blue?logo=sqlite) | 3 | Time-series database |
| Flask-CORS | 4.0 | Cross-origin support |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| ![React](https://img.shields.io/badge/React-18-61DAFB?logo=react) | 18.2 | UI framework |
| ![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite) | 5.0 | Build tool |
| ![Tailwind](https://img.shields.io/badge/Tailwind-3-38B2AC?logo=tailwind-css) | 3.3 | CSS framework |
| Recharts | 2.10 | Data visualization |
| Lucide React | 0.294 | Icon library |
| React Hot Toast | Latest | Notifications |

### Protocols & Standards

- **ICMP** - Internet Control Message Protocol for ping
- **REST** - Representational State Transfer for API
- **JSON** - Data exchange format

---

## 🏗️ Architecture

### System Architecture
```
┌─────────────────────────────────────────────────────┐
│                  Network Devices                     │
│  (Routers, Switches, Servers, Workstations, IoT)   │
└────────────────────┬────────────────────────────────┘
                     │ ICMP Ping (30s interval)
                     ▼
┌─────────────────────────────────────────────────────┐
│            Monitor Agent (monitor.py)                │
│  • Ping devices                                      │
│  • Measure latency                                   │
│  • Detect state changes                             │
│  • Create incidents                                  │
└────────────────────┬────────────────────────────────┘
                     │ Write
                     ▼
┌─────────────────────────────────────────────────────┐
│              SQLite Database                         │
│  ├─ devices        (Device registry)                │
│  ├─ device_status  (UP/DOWN history)                │
│  ├─ telemetry      (Latency measurements)           │
│  └─ incidents      (Alert records)                  │
└────────────────────┬────────────────────────────────┘
                     │ Query
                     ▼
┌─────────────────────────────────────────────────────┐
│           Flask REST API (app.py)                    │
│  • GET /api/summary                                  │
│  • GET /api/alerts                                   │
│  • GET /api/incidents                                │
│  • GET /api/device/<id>/latency                     │
│  • GET /api/health                                   │
└────────────────────┬────────────────────────────────┘
                     │ HTTP/JSON
                     ▼
┌─────────────────────────────────────────────────────┐
│         React Dashboard (Frontend)                   │
│  • KPI Cards                                         │
│  • Interactive Charts                                │
│  • Device Status Table                               │
│  • Search & Filters                                  │
│  • Export Functions                                  │
└─────────────────────────────────────────────────────┘
```

### Database Schema
```sql
-- Device Registry
CREATE TABLE devices (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE,
    ip_address TEXT,
    device_type TEXT,
    location TEXT,
    created_at TIMESTAMP
);

-- Status History
CREATE TABLE device_status (
    id INTEGER PRIMARY KEY,
    device_id INTEGER,
    status TEXT,  -- 'UP' or 'DOWN'
    timestamp TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id)
);

-- Performance Metrics
CREATE TABLE telemetry (
    id INTEGER PRIMARY KEY,
    device_id INTEGER,
    latency_ms REAL,
    timestamp TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id)
);

-- Incident Tracking
CREATE TABLE incidents (
    id INTEGER PRIMARY KEY,
    device_id INTEGER,
    severity TEXT,  -- 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
    description TEXT,
    status TEXT,  -- 'OPEN' or 'RESOLVED'
    created_at TIMESTAMP,
    resolved_at TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id)
);
```

---

## 📥 Installation

### Prerequisites

- **Python** 3.8 or higher
- **Node.js** 16 or higher
- **npm** or **yarn**
- **Git** (for cloning)

### Quick Start
```bash
# Clone the repository
git clone https://github.com/yourusername/campus-network-monitor.git
cd campus-network-monitor

# Setup Backend
cd backend
pip install -r requirements.txt
python init_db.py

# Setup Frontend (in new terminal)
cd frontend
npm install

# Start Backend
cd backend
python app.py

# Start Frontend (in new terminal)
cd frontend
npm run dev
```

### Detailed Installation

#### 1. Clone Repository
```bash
git clone https://github.com/yourusername/campus-network-monitor.git
cd campus-network-monitor
```

#### 2. Backend Setup
```bash
cd backend

# Install Python dependencies
pip install Flask==3.0.0 Flask-CORS==4.0.0

# Or use requirements.txt
pip install -r requirements.txt

# Initialize database with sample devices
python init_db.py
```

**Expected Output:**
```
============================================================
✅ DATABASE INITIALIZED SUCCESSFULLY!
============================================================
📊 Total devices in database: 8
```

#### 3. Frontend Setup
```bash
cd frontend

# Install Node.js dependencies
npm install

# Or use yarn
yarn install
```

#### 4. Start Services

**Terminal 1 - Backend:**
```bash
cd backend
python app.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

#### 5. Access Dashboard

Open browser: **http://localhost:3000**

---

## ⚙️ Configuration

### Adding Your Network Devices

Edit `backend/init_db.py`:
```python
devices = [
    # Your Router (find IP with 'ipconfig' or 'ip addr')
    ('Home-Router', '192.168.1.1', 'Router', 'Living Room'),
    
    # Your Computer
    ('My-PC', '192.168.1.100', 'Computer', 'Office'),
    
    # Your Phone
    ('iPhone-13', '192.168.1.110', 'Mobile', 'Personal'),
    
    # External DNS (always reachable)
    ('Google-DNS', '8.8.8.8', 'Server', 'External'),
    ('Cloudflare-DNS', '1.1.1.1', 'Server', 'External'),
]
```

Then reinitialize:
```bash
python init_db.py
```

### Configuring Monitoring Interval

Edit `backend/app.py` (line ~115):
```python
monitor = NetworkMonitor(db_name=DB_NAME, interval=30)  # 30 seconds
```

Change `interval=30` to your desired value (in seconds).

### Configuring Dashboard Refresh Rate

Edit `frontend/src/Dashboard.jsx` (line ~13):
```javascript
const interval = setInterval(fetchData, 30000); // 30 seconds
```

Change `30000` to your desired value (in milliseconds).

### Changing API Port

**Backend** (`backend/app.py`, last line):
```python
app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)
```

**Frontend** (`frontend/src/Dashboard.jsx`, line ~7):
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

---

## 🚀 Usage

### Basic Workflow

1. **Monitor Status** - View real-time device status on dashboard
2. **Search Devices** - Use search bar to find specific devices
3. **Filter by Type** - Filter by Router, Switch, Server, etc.
4. **View History** - Click "View History" to see latency trends
5. **Export Data** - Download reports in CSV or JSON format
6. **Toggle Theme** - Switch between dark and light modes

### Finding Network Device IPs

**Windows:**
```bash
ipconfig
# Look for "Default Gateway" and "IPv4 Address"
```

**Mac/Linux:**
```bash
ip addr show
# or
ifconfig
```

**Find all devices on network:**
```bash
# Windows
arp -a

# Mac/Linux
arp -an
```

### Testing Device Connectivity

Before adding devices, test if they respond to ping:
```bash
ping 192.168.1.1
ping 8.8.8.8
```

Good response:
```
Reply from 192.168.1.1: bytes=32 time=2ms TTL=64
```

---

## 📡 API Documentation

Base URL: `http://localhost:5000/api`

### Endpoints

#### Get Network Summary
```http
GET /api/summary
```

**Response:**
```json
{
  "total_devices": 8,
  "devices_up": 7,
  "devices_down": 1,
  "devices": [
    {
      "id": 1,
      "name": "Core-Router-01",
      "ip_address": "192.168.1.1",
      "device_type": "Router",
      "location": "Main Building",
      "status": "UP",
      "uptime_percent": 99.8,
      "avg_latency_ms": 1.2,
      "latest_latency_ms": 1.1
    }
  ]
}
```

#### Get Alert Summary
```http
GET /api/alerts
```

**Response:**
```json
{
  "CRITICAL": 2,
  "HIGH": 1,
  "MEDIUM": 0,
  "LOW": 3
}
```

#### Get Incidents
```http
GET /api/incidents?limit=50
```

**Parameters:**
- `limit` (optional): Number of incidents to return (default: 50)

**Response:**
```json
[
  {
    "id": 1,
    "severity": "CRITICAL",
    "description": "Core-Router-01 (192.168.1.1) is DOWN",
    "status": "OPEN",
    "created_at": "2024-02-02T10:30:00",
    "device_name": "Core-Router-01",
    "ip_address": "192.168.1.1"
  }
]
```

#### Get Device Latency History
```http
GET /api/device/{device_id}/latency?hours=24
```

**Parameters:**
- `hours` (optional): Hours to look back (default: 24)

**Response:**
```json
{
  "device_name": "Core-Router-01",
  "ip_address": "192.168.1.1",
  "data": [
    {
      "timestamp": "2024-02-02T10:00:00",
      "latency_ms": 1.2
    }
  ]
}
```

#### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-02-02T10:30:00"
}
```

---

## 📸 Screenshots

### Dashboard Overview
![Dashboard](https://via.placeholder.com/800x450/1e3a8a/ffffff?text=Dashboard+Overview)
*Real-time network monitoring dashboard with KPI cards and device status*

### Device Status Table
![Device Table](https://via.placeholder.com/800x300/1e3a8a/ffffff?text=Device+Status+Table)
*Comprehensive device listing with health scores and actions*

### Latency Trends
![Latency Chart](https://via.placeholder.com/800x300/1e3a8a/ffffff?text=Latency+Trend+Chart)
*Historical latency visualization with interactive charts*

### Dark Mode
![Dark Mode](https://via.placeholder.com/800x450/1f2937/ffffff?text=Dark+Mode+Dashboard)
*Professional dark theme for reduced eye strain*

---

## 📁 Project Structure
```
campus-network-monitor/
│
├── backend/                    # Backend Python application
│   ├── init_db.py             # Database initialization
│   ├── monitor.py             # Network monitoring agent
│   ├── app.py                 # Flask REST API server
│   ├── requirements.txt       # Python dependencies
│   └── network_monitor.db     # SQLite database (auto-generated)
│
├── frontend/                   # Frontend React application
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── Notifications.jsx
│   │   │   ├── SearchFilter.jsx
│   │   │   ├── ExportPanel.jsx
│   │   │   └── HealthScore.jsx
│   │   ├── Dashboard.jsx      # Main dashboard component
│   │   ├── App.jsx            # App root
│   │   ├── main.jsx           # Entry point
│   │   └── index.css          # Global styles
│   ├── public/                # Static assets
│   ├── index.html             # HTML template
│   ├── package.json           # Node dependencies
│   ├── vite.config.js         # Vite configuration
│   ├── tailwind.config.js     # Tailwind configuration
│   └── postcss.config.js      # PostCSS configuration
│
├── .gitignore                 # Git ignore rules
├── README.md                  # This file
└── LICENSE                    # MIT License
```

---

## 🗺️ Roadmap

### Version 2.0 (Current)
- [x] Real-time device monitoring
- [x] Interactive dashboard
- [x] Search and filter
- [x] Data export (CSV/JSON)
- [x] Dark/light themes
- [x] Toast notifications
- [x] Health scoring

### Version 3.0 (Planned)
- [x] SNMP support for detailed metrics
- [x] Network topology visualization
- [x] Email/SMS alerting
- [x] Multi-user authentication
- [x] Role-based access control
- [x] Historical trend analysis
- [x] Customizable thresholds
- [x] Webhook integrations

### Version 4.0 (Future)
- [x] Docker containerization
- [x] Kubernetes deployment
- [x] Cloud platform support (AWS/Azure)
- [x] Mobile app (iOS/Android)
- [x] AI-powered anomaly detection
- [x] Predictive analytics
- [x] Integration with third-party tools
- [x] Advanced reporting engine

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
```bash
   git checkout -b feature/AmazingFeature
```
3. **Commit your changes**
```bash
   git commit -m 'Add some AmazingFeature'
```
4. **Push to the branch**
```bash
   git push origin feature/AmazingFeature
```
5. **Open a Pull Request**

### Coding Standards

- **Python**: Follow PEP 8 style guide
- **JavaScript**: Use ESLint configuration
- **Commits**: Use conventional commit messages
- **Documentation**: Update README for new features

---

## 🐛 Bug Reports

Found a bug? Please open an issue with:
- Description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details (OS, Python version, Node version)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
```
MIT License

Copyright (c) 2024 [Kishore Anand]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

---

## 👤 Contact

**Your Name**
- GitHub: [Kishore-47](https://github.com/Kishore-47)
- Email: mannai.kishore7@gmail.com
- LinkedIn: [Kishore Anand M](www.linkedin.com/in/kishoreanand47)

**Project Link:** [https://github.com/Kishore-47/campus-network-monitor](https://github.com/Kishore-47/campus-network-monitor)

---

## 🙏 Acknowledgments

- [Flask](https://flask.palletsprojects.com/) - Backend framework
- [React](https://reactjs.org/) - Frontend library
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework
- [Recharts](https://recharts.org/) - Charting library
- [Lucide](https://lucide.dev/) - Icon library
- Inspired by enterprise tools like SolarWinds and Motadata

---

## ⭐ Star History

If you find this project useful, please consider giving it a star!

[![Star History Chart](https://api.star-history.com/svg?repos=yourusername/campus-network-monitor&type=Date)](https://star-history.com/#yourusername/campus-network-monitor&Date)

---

<div align="center">

**Made with ❤️ for network administrators everywhere**

[⬆ Back to Top](#-campus-network-monitoring--health-dashboard)

</div>
