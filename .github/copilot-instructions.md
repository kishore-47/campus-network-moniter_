# Campus Network Monitor - AI Coding Guidelines

## Project Architecture

This is a full-stack network monitoring application with:
- **Backend**: Flask REST API + SQLite database + background monitoring service
- **Frontend**: React dashboard with real-time updates and data visualization
- **Communication**: HTTP REST API between frontend (port 3000) and backend (port 5000)

### Key Components

**Backend (`backend/`)**
- `app.py`: Main Flask application with REST endpoints
- `monitor.py`: NetworkMonitor class handling device pinging and incident creation
- `init_db.py`: Database initialization script with sample devices
- `requirements.txt`: Python dependencies (Flask, Flask-CORS)

**Frontend (`frontend/`)**
- `src/Dashboard.jsx`: Main dashboard component with real-time data fetching
- `src/components/`: Reusable UI components (ExportPanel, HealthScore, Notifications, SearchFilter)
- `package.json`: Node dependencies (React, Recharts, Tailwind, Lucide icons)

**Database Schema (`network_monitor.db`)**
- `devices`: Device inventory (name, IP, type, location)
- `device_status`: UP/DOWN status history with timestamps
- `telemetry`: Latency measurements over time
- `incidents`: Alert/incident tracking with severity levels

## Development Workflow

### Getting Started
1. **Initialize database**: `cd backend && python init_db.py`
2. **Start backend**: `cd backend && python app.py` (starts API + monitoring on port 5000)
3. **Start frontend**: `cd frontend && npm run dev` (starts on port 3000)

### Key Workflows
- **Real-time monitoring**: Background thread pings devices every 30 seconds
- **Data fetching**: Frontend polls `/api/summary` and `/api/alerts` every 30 seconds
- **Incident creation**: Automatic alerts when devices go DOWN (CRITICAL for routers/firewalls, HIGH for others)
- **Export functionality**: CSV/PDF generation using jsPDF and client-side data

## Project-Specific Patterns

### Backend Patterns
- **Database connections**: Use `get_db_connection()` helper for SQLite Row factory
- **API responses**: Always return JSON with consistent structure
- **Monitoring logic**: Check `device_states` dict for state changes to avoid duplicate incidents
- **Ping implementation**: Platform-specific ping commands (Windows `-n`, Unix `-c`)
- **Threading**: Use daemon threads for background monitoring

### Frontend Patterns
- **State management**: React hooks (`useState`, `useEffect`) for component state
- **Data fetching**: `fetch()` API with error handling and loading states
- **Real-time updates**: Compare previous vs current data for notifications
- **Styling**: Tailwind CSS with custom animations and dark mode support
- **Charts**: Recharts library for pie/bar/area charts with responsive containers
- **Notifications**: react-hot-toast with custom styling and sound alerts

### Database Patterns
- **Status tracking**: Log every ping result to `device_status` table
- **Uptime calculation**: Query last 24 hours of status data for percentages
- **Latency aggregation**: Store individual measurements, calculate averages on demand
- **Incident severity**: CRITICAL (routers/firewalls), HIGH (others) when devices go down

## Integration Points

### API Endpoints
- `GET /api/summary`: Device counts, uptime stats, detailed device list
- `GET /api/alerts`: Alert counts by severity (CRITICAL/HIGH/MEDIUM/LOW)
- `GET /api/incidents`: Recent incidents with device details
- `GET /api/device/<id>/latency`: Latency history for specific device
- `GET /api/device/<id>/uptime`: Uptime history for specific device
- `GET /api/health`: Health check endpoint

### Data Flow
1. Monitor pings devices → logs to database
2. Frontend fetches summary/alerts → displays real-time data
3. State changes trigger notifications → user alerts
4. User can export data → CSV/PDF generation

## Common Tasks

### Adding New Devices
- Add to `init_db.py` devices list with (name, ip, type, location)
- Types: 'Router', 'Switch', 'Server', 'Firewall', 'Computer'

### Modifying Monitoring
- Change interval in `NetworkMonitor.__init__()` (default 30s)
- Adjust ping timeout in `ping_device()` method
- Modify incident severity logic in `monitor_devices()`

### Adding Frontend Features
- Add new API calls in `Dashboard.jsx` `fetchData()` or `useEffect`
- Create new components in `src/components/`
- Use existing patterns: dark mode support, animations, responsive design

### Database Changes
- Add new tables in `init_db.py` `init_database()`
- Update API endpoints in `app.py` for new data
- Ensure foreign key relationships for device-related data

## Code Quality Notes

- **Error handling**: Always catch exceptions in API calls and ping operations
- **Performance**: Use database indexes for timestamp queries
- **UI consistency**: Match existing dark/light mode and animation patterns
- **Testing**: Use `test_ping.py` to verify ping functionality before deployment
- **Dependencies**: Keep requirements.txt and package.json updated

## Deployment Considerations

- **Ports**: Backend (5000), Frontend (3000) - ensure no conflicts
- **Database**: SQLite file (`network_monitor.db`) created automatically
- **CORS**: Enabled for React development server
- **Background monitoring**: Starts automatically when backend launches