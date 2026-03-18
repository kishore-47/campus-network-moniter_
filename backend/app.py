from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity, get_jwt
import sqlite3
from datetime import datetime, timedelta
import threading
from monitor import NetworkMonitor
import os
from dotenv import load_dotenv

# Prometheus metrics
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

# Setup basic logging
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# analytics module for anomaly detection / predictions (moved to try-except below)

# Import V3.0 modules
try:
    from auth import auth_bp, init_users_table
    AUTH_AVAILABLE = True
except ImportError:
    AUTH_AVAILABLE = False
    print("⚠️  Auth module not available - authentication disabled")

try:
    from snmp_monitor import SNMPMonitor
    SNMP_AVAILABLE = True
except ImportError:
    SNMP_AVAILABLE = False
    print("⚠️  SNMP module not available")

try:
    from alerting import AlertingSystem
    ALERTING_AVAILABLE = True
except ImportError:
    ALERTING_AVAILABLE = False
    print("⚠️  Alerting module not available")

try:
    from thresholds import ThresholdManager
    THRESHOLDS_AVAILABLE = True
except ImportError:
    THRESHOLDS_AVAILABLE = False
    print("⚠️  Thresholds module not available")

try:
    from topology import NetworkTopology
    TOPOLOGY_AVAILABLE = True
except ImportError:
    TOPOLOGY_AVAILABLE = False
    print("⚠️  Topology module not available")

try:
    from analytics import AnalyticsEngine
    ANALYTICS_AVAILABLE = True
except ImportError:
    ANALYTICS_AVAILABLE = False
    print("⚠️  Analytics module not available")

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

DB_NAME = 'network_monitor.db'


def ensure_database_schema():
    """Ensure required SQLite tables/columns exist for API queries."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # Core tables used by API endpoints
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS devices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            ip_address TEXT NOT NULL,
            device_type TEXT NOT NULL,
            location TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS device_status (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id INTEGER NOT NULL,
            status TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (device_id) REFERENCES devices(id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS telemetry (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id INTEGER NOT NULL,
            latency_ms REAL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (device_id) REFERENCES devices(id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS incidents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id INTEGER NOT NULL,
            severity TEXT NOT NULL,
            description TEXT NOT NULL,
            status TEXT DEFAULT 'OPEN',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            resolved_at TIMESTAMP,
            FOREIGN KEY (device_id) REFERENCES devices(id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS anomalies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id INTEGER NOT NULL,
            metric TEXT NOT NULL,
            value REAL NOT NULL,
            detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            description TEXT,
            FOREIGN KEY (device_id) REFERENCES devices(id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id INTEGER NOT NULL,
            metric TEXT NOT NULL,
            predicted_value REAL NOT NULL,
            prediction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            horizon_hours INTEGER,
            FOREIGN KEY (device_id) REFERENCES devices(id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS thresholds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id INTEGER,
            metric_type TEXT NOT NULL,
            warning_threshold REAL,
            critical_threshold REAL,
            operator TEXT DEFAULT 'greater_than',
            enabled BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (device_id) REFERENCES devices(id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS network_links (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_device_id INTEGER NOT NULL,
            target_device_id INTEGER NOT NULL,
            link_type TEXT DEFAULT 'physical',
            bandwidth TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (source_device_id) REFERENCES devices(id),
            FOREIGN KEY (target_device_id) REFERENCES devices(id)
        )
    ''')

    # Lightweight migration for older databases that may miss columns.
    def add_column_if_missing(table_name, column_def):
        column_name = column_def.split()[0]
        cursor.execute(f"PRAGMA table_info({table_name})")
        existing = {row[1] for row in cursor.fetchall()}
        if column_name not in existing:
            cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_def}")

    add_column_if_missing('devices', 'device_type TEXT DEFAULT "Unknown"')
    add_column_if_missing('devices', 'location TEXT')
    add_column_if_missing('devices', 'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
    add_column_if_missing('device_status', 'timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
    add_column_if_missing('telemetry', 'timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
    add_column_if_missing('incidents', 'status TEXT DEFAULT "OPEN"')
    add_column_if_missing('incidents', 'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
    add_column_if_missing('incidents', 'resolved_at TIMESTAMP')

    conn.commit()
    conn.close()


# Ensure schema exists even when deployment does not run init_db.py explicitly.
ensure_database_schema()

# JWT Configuration (V3.0)
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=8)

# Prometheus metrics
REQUEST_COUNT = Counter('app_request_count', 'Total HTTP requests', ['method', 'endpoint', 'http_status'])
REQUEST_LATENCY = Histogram('app_request_latency_seconds', 'Latency of HTTP requests', ['method', 'endpoint'])

@app.before_request
def before_request():
    request._start_time = datetime.now()

@app.after_request
def after_request(response):
    latency = (datetime.now() - request._start_time).total_seconds()
    REQUEST_LATENCY.labels(request.method, request.path).observe(latency)
    REQUEST_COUNT.labels(request.method, request.path, response.status_code).inc()
    return response

@app.route('/metrics')
def metrics():
    return generate_latest(), 200, {'Content-Type': CONTENT_TYPE_LATEST}

jwt = JWTManager(app)

# Register authentication blueprint if available
if AUTH_AVAILABLE:
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    init_users_table()

# Initialize V3.0 components with error handling
# Initialize as None first so endpoints don't get NameError if init fails
snmp_monitor = None
alerting = None
threshold_manager = None
topology_manager = None

if SNMP_AVAILABLE:
    try:
        snmp_monitor = SNMPMonitor(DB_NAME)
    except Exception as e:
        logger.warning(f"Failed to initialize SNMP monitor: {e}")
        SNMP_AVAILABLE = False

if ALERTING_AVAILABLE:
    try:
        alerting = AlertingSystem()
    except Exception as e:
        logger.warning(f"Failed to initialize alerting: {e}")
        ALERTING_AVAILABLE = False

if THRESHOLDS_AVAILABLE:
    try:
        threshold_manager = ThresholdManager(DB_NAME)
    except Exception as e:
        logger.warning(f"Failed to initialize threshold manager: {e}")
        THRESHOLDS_AVAILABLE = False

if TOPOLOGY_AVAILABLE:
    try:
        topology_manager = NetworkTopology(DB_NAME)
    except Exception as e:
        logger.warning(f"Failed to initialize topology manager: {e}")
        TOPOLOGY_AVAILABLE = False

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

# ============================================================================
# CORE API ENDPOINTS (V2.0 - No Auth Required)
# ============================================================================

@app.route('/api/summary', methods=['GET'])
def get_summary():
    """
    Get overall network summary
    Returns: Device counts, uptime percentages, average latency
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get all devices
        cursor.execute('SELECT COUNT(*) as total FROM devices')
        total_devices = cursor.fetchone()['total']

        # Get current status for each device (last status entry)
        cursor.execute('''
            SELECT d.id, d.name, d.ip_address, d.device_type, d.location,
                   (SELECT status FROM device_status
                    WHERE device_id = d.id
                    ORDER BY timestamp DESC LIMIT 1) as current_status,
                   (SELECT latency_ms FROM telemetry
                    WHERE device_id = d.id
                    ORDER BY timestamp DESC LIMIT 1) as latest_latency
            FROM devices d
        ''')
        devices = cursor.fetchall()

        devices_up = sum(1 for d in devices if d['current_status'] == 'UP')
        devices_down = total_devices - devices_up

        # Calculate uptime percentage for each device (last 24 hours)
        device_details = []
        for device in devices:
            device_id = device['id']

            # Get uptime percentage
            cursor.execute('''
                SELECT
                    SUM(CASE WHEN status = 'UP' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as uptime_percent
                FROM device_status
                WHERE device_id = ?
                AND timestamp > datetime('now', '-24 hours')
            ''', (device_id,))

            uptime_result = cursor.fetchone()
            uptime = uptime_result['uptime_percent'] if uptime_result['uptime_percent'] else 0

            # Get average latency (last 24 hours)
            cursor.execute('''
                SELECT AVG(latency_ms) as avg_latency
                FROM telemetry
                WHERE device_id = ?
                AND timestamp > datetime('now', '-24 hours')
            ''', (device_id,))

            latency_result = cursor.fetchone()
            avg_latency = latency_result['avg_latency'] if latency_result['avg_latency'] else None

            device_details.append({
                'id': device['id'],
                'name': device['name'],
                'ip_address': device['ip_address'],
                'device_type': device['device_type'],
                'location': device['location'],
                'status': device['current_status'] or 'UNKNOWN',
                'uptime_percent': round(uptime, 2),
                'avg_latency_ms': round(avg_latency, 2) if avg_latency else None,
                'latest_latency_ms': round(device['latest_latency'], 2) if device['latest_latency'] else None
            })

        return jsonify({
            'total_devices': total_devices,
            'devices_up': devices_up,
            'devices_down': devices_down,
            'devices': device_details
        })
    except Exception as e:
        logger.exception("/api/summary failed: %s", e)
        return jsonify({
            'total_devices': 0,
            'devices_up': 0,
            'devices_down': 0,
            'devices': [],
            'error': 'summary_unavailable'
        }), 200
    finally:
        if conn is not None:
            conn.close()

@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    """
    Get alert summary by severity
    Returns: Count of incidents by severity level
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('''
            SELECT severity, COUNT(*) as count
            FROM incidents
            WHERE status = 'OPEN'
            GROUP BY severity
        ''')

        alerts = cursor.fetchall()

        alert_summary = {
            'CRITICAL': 0,
            'HIGH': 0,
            'MEDIUM': 0,
            'LOW': 0
        }

        for alert in alerts:
            alert_summary[alert['severity']] = alert['count']

        return jsonify(alert_summary)
    except Exception as e:
        logger.exception("/api/alerts failed: %s", e)
        return jsonify({
            'CRITICAL': 0,
            'HIGH': 0,
            'MEDIUM': 0,
            'LOW': 0,
            'error': 'alerts_unavailable'
        }), 200
    finally:
        if conn is not None:
            conn.close()

@app.route('/api/incidents', methods=['GET'])
def get_incidents():
    """
    Get all recent incidents
    Returns: List of incidents with device details
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    limit = request.args.get('limit', 50, type=int)
    
    cursor.execute('''
        SELECT i.id, i.severity, i.description, i.status, 
               i.created_at, i.resolved_at,
               d.name as device_name, d.ip_address
        FROM incidents i
        JOIN devices d ON i.device_id = d.id
        ORDER BY i.created_at DESC
        LIMIT ?
    ''', (limit,))
    
    incidents = cursor.fetchall()
    conn.close()
    
    return jsonify([dict(incident) for incident in incidents])

@app.route('/api/device/<int:device_id>/latency', methods=['GET'])
def get_device_latency(device_id):
    """
    Get latency history for a specific device
    Args:
        device_id: Device ID
    Query params:
        hours: Number of hours to look back (default: 24)
    """
    hours = request.args.get('hours', 24, type=int)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get device info
    cursor.execute('SELECT name, ip_address FROM devices WHERE id = ?', (device_id,))
    device = cursor.fetchone()
    
    if not device:
        return jsonify({'error': 'Device not found'}), 404
    
    # Get latency data
    cursor.execute('''
        SELECT latency_ms, timestamp
        FROM telemetry
        WHERE device_id = ?
        AND timestamp > datetime('now', '-' || ? || ' hours')
        ORDER BY timestamp ASC
    ''', (device_id, hours))
    
    telemetry = cursor.fetchall()
    conn.close()
    
    return jsonify({
        'device_name': device['name'],
        'ip_address': device['ip_address'],
        'data': [
            {
                'timestamp': entry['timestamp'],
                'latency_ms': entry['latency_ms']
            }
            for entry in telemetry
        ]
    })

@app.route('/api/device/<int:device_id>/uptime', methods=['GET'])
def get_device_uptime(device_id):
    """
    Get uptime history for a specific device
    """
    hours = request.args.get('hours', 24, type=int)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT status, timestamp
        FROM device_status
        WHERE device_id = ?
        AND timestamp > datetime('now', '-' || ? || ' hours')
        ORDER BY timestamp ASC
    ''', (device_id, hours))
    
    status_history = cursor.fetchall()
    conn.close()
    
    return jsonify([dict(entry) for entry in status_history])

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '3.0',
        'features': {
            'authentication': AUTH_AVAILABLE,
            'snmp': SNMP_AVAILABLE,
            'alerting': ALERTING_AVAILABLE,
            'thresholds': THRESHOLDS_AVAILABLE,
            'topology': TOPOLOGY_AVAILABLE
        }
    })

# ============================================================================
# V3.0 ADVANCED ENDPOINTS (Auth Required)
# ============================================================================

# Helper function to check if auth is required
def auth_required():
    """Decorator to check if auth is available and required"""
    if AUTH_AVAILABLE:
        return jwt_required()
    else:
        # No-op decorator if auth not available
        def decorator(f):
            return f
        return decorator

@app.route('/api/devices', methods=['GET'])
@auth_required()
def get_all_devices():
    """Get all devices (detailed)"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM devices')
    devices = cursor.fetchall()
    conn.close()
    
    return jsonify([dict(device) for device in devices])

@app.route('/api/devices', methods=['POST'])
@auth_required()
def add_device():
    """Add new device (admin/operator only)"""
    if AUTH_AVAILABLE:
        claims = get_jwt()
        if claims.get('role') not in ['admin', 'operator']:
            return jsonify({'error': 'Insufficient permissions'}), 403
    
    data = request.get_json()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO devices (name, ip_address, device_type, location)
            VALUES (?, ?, ?, ?)
        ''', (data['name'], data['ip_address'], data['device_type'], data.get('location', '')))
        
        conn.commit()
        device_id = cursor.lastrowid
        conn.close()
        
        return jsonify({'message': 'Device added', 'id': device_id}), 201
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 400

@app.route('/api/devices/<int:device_id>', methods=['DELETE'])
@auth_required()
def delete_device(device_id):
    """Delete device (admin only)"""
    if AUTH_AVAILABLE:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM devices WHERE id = ?', (device_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Device deleted'})

# SNMP Endpoints
if SNMP_AVAILABLE:
    @app.route('/api/snmp/metrics/<int:device_id>', methods=['GET'])
    @auth_required()
    def get_snmp_metrics(device_id):
        """Get SNMP metrics for device"""
        hours = request.args.get('hours', 24, type=int)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM snmp_metrics
            WHERE device_id = ?
            AND timestamp > datetime('now', '-' || ? || ' hours')
            ORDER BY timestamp DESC
        ''', (device_id, hours))
        
        metrics = cursor.fetchall()
        conn.close()
        
        return jsonify([dict(m) for m in metrics])
    
    @app.route('/api/snmp/monitor/<int:device_id>', methods=['POST'])
    @auth_required()
    def trigger_snmp_monitor(device_id):
        """Trigger SNMP monitoring for specific device"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT ip_address FROM devices WHERE id = ?', (device_id,))
        device = cursor.fetchone()
        conn.close()
        
        if not device:
            return jsonify({'error': 'Device not found'}), 404
        
        ip_address = device['ip_address']
        
        # Get SNMP metrics
        cpu = snmp_monitor.get_cpu_usage(ip_address)
        memory = snmp_monitor.get_memory_usage(ip_address)
        traffic = snmp_monitor.get_interface_traffic(ip_address)
        
        if cpu or memory or traffic:
            snmp_monitor.log_snmp_metrics(device_id, cpu, memory, traffic)
            return jsonify({
                'message': 'SNMP metrics collected',
                'cpu': cpu,
                'memory': memory,
                'traffic': traffic
            })
        else:
            return jsonify({'error': 'Failed to collect SNMP metrics'}), 500

# Threshold Endpoints
if THRESHOLDS_AVAILABLE:
    @app.route('/api/thresholds', methods=['GET'])
    @auth_required()
    def get_thresholds():
        """Get all thresholds"""
        if not threshold_manager:
            return jsonify({'error': 'Threshold manager not available'}), 503
        try:
            device_id = request.args.get('device_id', type=int)
            thresholds = threshold_manager.get_all_thresholds(device_id)
            return jsonify(thresholds)
        except Exception as e:
            logger.exception("Error in get_thresholds: %s", e)
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/thresholds/<int:threshold_id>', methods=['PUT'])
    @auth_required()
    def update_threshold(threshold_id):
        """Update threshold values (admin/operator only)"""
        if not threshold_manager:
            return jsonify({'error': 'Threshold manager not available'}), 503
        try:
            if AUTH_AVAILABLE:
                claims = get_jwt()
                if claims.get('role') not in ['admin', 'operator']:
                    return jsonify({'error': 'Insufficient permissions'}), 403
            
            data = request.get_json()
            threshold_manager.update_threshold(
                threshold_id,
                data.get('warning'),
                data.get('critical')
            )
            return jsonify({'message': 'Threshold updated'})
        except Exception as e:
            logger.exception("Error in update_threshold: %s", e)
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/thresholds', methods=['POST'])
    @auth_required()
    def create_threshold():
        """Create new threshold (admin/operator only)"""
        if not threshold_manager:
            return jsonify({'error': 'Threshold manager not available'}), 503
        try:
            if AUTH_AVAILABLE:
                claims = get_jwt()
                if claims.get('role') not in ['admin', 'operator']:
                    return jsonify({'error': 'Insufficient permissions'}), 403
            
            data = request.get_json()
            
            conn = get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO thresholds (device_id, metric_type, warning_threshold, critical_threshold, operator, enabled)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (data.get('device_id'), data['metric_type'], data['warning'], data['critical'], 
                  data.get('operator', 'greater_than'), data.get('enabled', 1)))
            
            conn.commit()
            threshold_id = cursor.lastrowid
            conn.close()
            
            return jsonify({'message': 'Threshold created', 'id': threshold_id}), 201
        except Exception as e:
            logger.exception("Error in create_threshold: %s", e)
            return jsonify({'error': str(e)}), 500

# Topology Endpoints
if TOPOLOGY_AVAILABLE:
    @app.route('/api/topology', methods=['GET'])
    @auth_required()
    def get_topology():
        """Get network topology"""
        if not topology_manager:
            return jsonify({'error': 'Topology manager not available'}), 503
        try:
            topology = topology_manager.get_topology()
            return jsonify(topology)
        except Exception as e:
            logger.exception("Error in get_topology: %s", e)
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/topology/link', methods=['POST'])
    @auth_required()
    def add_topology_link():
        """Add network link (admin/operator only)"""
        if not topology_manager:
            return jsonify({'error': 'Topology manager not available'}), 503
        try:
            if AUTH_AVAILABLE:
                claims = get_jwt()
                if claims.get('role') not in ['admin', 'operator']:
                    return jsonify({'error': 'Insufficient permissions'}), 403
            
            data = request.get_json()
            topology_manager.add_link(
                data['source_id'],
                data['target_id'],
                data.get('link_type', 'physical'),
                data.get('bandwidth')
            )
            return jsonify({'message': 'Link added'})
        except Exception as e:
            logger.exception("Error in add_topology_link: %s", e)
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/topology/link/<int:link_id>', methods=['DELETE'])
    @auth_required()
    def delete_topology_link(link_id):
        """Delete network link (admin only)"""
        if not topology_manager:
            return jsonify({'error': 'Topology manager not available'}), 503
        try:
            if AUTH_AVAILABLE:
                claims = get_jwt()
                if claims.get('role') != 'admin':
                    return jsonify({'error': 'Admin access required'}), 403
            
            conn = get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute('DELETE FROM network_links WHERE id = ?', (link_id,))
            conn.commit()
            conn.close()
            
            return jsonify({'message': 'Link deleted'})
        except Exception as e:
            logger.exception("Error in delete_topology_link: %s", e)
            return jsonify({'error': str(e)}), 500

# Alerting Endpoints
if ALERTING_AVAILABLE:
    @app.route('/api/alerts/send', methods=['POST'])
    @auth_required()
    def send_alert():
        """Send manual alert (admin/operator only)"""
        if AUTH_AVAILABLE:
            claims = get_jwt()
            if claims.get('role') not in ['admin', 'operator']:
                return jsonify({'error': 'Insufficient permissions'}), 403
        
        data = request.get_json()
        
        results = alerting.send_alert(
            data['device_name'],
            data['severity'],
            data['description'],
            data.get('channels', ['slack'])
        )
        
        return jsonify({
            'message': 'Alerts sent',
            'results': results
        })
    
    @app.route('/api/alerts/config', methods=['GET'])
    @auth_required()
    def get_alert_config():
        """Get alert configuration"""
        config = {
            'email_enabled': bool(alerting.sendgrid_api_key),
            'sms_enabled': bool(alerting.twilio_account_sid),
            'slack_enabled': bool(alerting.slack_webhook),
            'discord_enabled': bool(alerting.discord_webhook),
            'teams_enabled': bool(alerting.teams_webhook),
            'pagerduty_enabled': bool(getattr(alerting, 'pagerduty_routing_key', None))
        }
        return jsonify(config)

# Analytics Endpoints
@app.route('/api/analytics/anomalies', methods=['GET'])
@auth_required()
def get_anomalies():
    """Return recent detected anomalies"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT a.*, d.name as device_name
        FROM anomalies a
        JOIN devices d ON a.device_id = d.id
        ORDER BY detected_at DESC
        LIMIT 100
    ''')
    rows = cursor.fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route('/api/analytics/predictions', methods=['GET'])
@auth_required()
def get_predictions():
    """Return recent predictions"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT p.*, d.name as device_name
        FROM predictions p
        JOIN devices d ON p.device_id = d.id
        ORDER BY prediction_time DESC
        LIMIT 100
    ''')
    rows = cursor.fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route('/api/analytics/trends', methods=['GET'])
@auth_required()
def get_trends():
    """Get historical trend analysis"""
    days = request.args.get('days', 7, type=int)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Daily uptime trend
    cursor.execute('''
        SELECT 
            DATE(timestamp) as date,
            SUM(CASE WHEN status = 'UP' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as uptime_percent
        FROM device_status
        WHERE timestamp > datetime('now', '-' || ? || ' days')
        GROUP BY DATE(timestamp)
        ORDER BY date
    ''', (days,))
    
    uptime_trend = [dict(row) for row in cursor.fetchall()]
    
    # Average latency trend
    cursor.execute('''
        SELECT 
            DATE(timestamp) as date,
            AVG(latency_ms) as avg_latency
        FROM telemetry
        WHERE timestamp > datetime('now', '-' || ? || ' days')
        GROUP BY DATE(timestamp)
        ORDER BY date
    ''', (days,))
    
    latency_trend = [dict(row) for row in cursor.fetchall()]
    
    # Incident trend
    cursor.execute('''
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as incident_count,
            severity
        FROM incidents
        WHERE created_at > datetime('now', '-' || ? || ' days')
        GROUP BY DATE(created_at), severity
        ORDER BY date
    ''', (days,))
    
    incident_trend = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    return jsonify({
        'uptime_trend': uptime_trend,
        'latency_trend': latency_trend,
        'incident_trend': incident_trend
    })

@app.route('/api/analytics/reports', methods=['GET'])
@auth_required()
def get_reports():
    """Generate analytics reports"""
    report_type = request.args.get('type', 'summary')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if report_type == 'summary':
        # Overall network health summary
        cursor.execute('''
            SELECT 
                COUNT(*) as total_devices,
                SUM(CASE WHEN (SELECT status FROM device_status WHERE device_id = d.id ORDER BY timestamp DESC LIMIT 1) = 'UP' THEN 1 ELSE 0 END) as devices_up,
                AVG((SELECT SUM(CASE WHEN status = 'UP' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) FROM device_status WHERE device_id = d.id AND timestamp > datetime('now', '-7 days'))) as avg_uptime,
                (SELECT COUNT(*) FROM incidents WHERE status = 'OPEN') as open_incidents
            FROM devices d
        ''')
        
        summary = dict(cursor.fetchone())
    
    elif report_type == 'device_performance':
        # Per-device performance metrics
        cursor.execute('''
            SELECT 
                d.name,
                d.device_type,
                (SELECT SUM(CASE WHEN status = 'UP' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) FROM device_status WHERE device_id = d.id AND timestamp > datetime('now', '-7 days')) as uptime_7d,
                (SELECT AVG(latency_ms) FROM telemetry WHERE device_id = d.id AND timestamp > datetime('now', '-7 days')) as avg_latency_7d,
                (SELECT COUNT(*) FROM incidents WHERE device_id = d.id AND created_at > datetime('now', '-7 days')) as incidents_7d
            FROM devices d
        ''')
        
        summary = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    return jsonify(summary)

@app.route('/api/analytics/export', methods=['GET'])
@auth_required()
def export_report():
    """Export analytics report as CSV"""
    report_type = request.args.get('type', 'device_performance')
    conn = get_db_connection()
    cursor = conn.cursor()
    csv_lines = []

    if report_type == 'device_performance':
        cursor.execute('''
            SELECT 
                d.name,
                d.device_type,
                (SELECT SUM(CASE WHEN status = 'UP' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) FROM device_status WHERE device_id = d.id AND timestamp > datetime('now', '-7 days')) as uptime_7d,
                (SELECT AVG(latency_ms) FROM telemetry WHERE device_id = d.id AND timestamp > datetime('now', '-7 days')) as avg_latency_7d,
                (SELECT COUNT(*) FROM incidents WHERE device_id = d.id AND created_at > datetime('now', '-7 days')) as incidents_7d
            FROM devices d
        ''')
        rows = cursor.fetchall()
        csv_lines.append('name,device_type,uptime_7d,avg_latency_7d,incidents_7d')
        for r in rows:
            csv_lines.append(f"{r['name']},{r['device_type']},{r['uptime_7d']},{r['avg_latency_7d']},{r['incidents_7d']}")

    conn.close()
    csv_data = "\n".join(csv_lines)
    return (csv_data, 200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': f'attachment; filename="{report_type}.csv"'
    })

# ============================================================================
# MONITORING SERVICE
# ============================================================================

def start_monitor():
    """Start the monitoring service in background"""
    monitor = NetworkMonitor(db_name=DB_NAME, interval=30)
    monitor.start()
    print("✅ Background monitoring started")
    
    # Start SNMP monitoring if available
    if SNMP_AVAILABLE:
        def snmp_monitor_loop():
            import time
            while True:
                try:
                    snmp_monitor.monitor_all_snmp_devices()
                except Exception as e:
                    print(f"❌ SNMP monitoring error: {e}")
                time.sleep(300)  # Every 5 minutes
        
        threading.Thread(target=snmp_monitor_loop, daemon=True).start()
        print("✅ SNMP monitoring started")
    
    # Start analytics engine if available
    if ANALYTICS_AVAILABLE:
        def analytics_loop():
            try:
                from analytics import AnalyticsEngine
                engine = AnalyticsEngine(DB_NAME)
                engine.sync()
            except Exception as e:
                print(f"❌ Analytics engine error: {e}")
        threading.Thread(target=analytics_loop, daemon=True).start()
        print("✅ Analytics engine started")

# ============================================================================
# MAIN APPLICATION
# ============================================================================

if __name__ == '__main__':
    print("=" * 70)
    print("🚀 Starting Campus Network Monitor API v3.0")
    print("=" * 70)
    
    # Start background monitoring
    threading.Thread(target=start_monitor, daemon=True).start()
    
    # Print configuration
    print("\n📋 Configuration:")
    print(f"   Database: {DB_NAME}")
    print(f"   Authentication: {'✅ Enabled' if AUTH_AVAILABLE else '❌ Disabled'}")
    print(f"   SNMP Monitoring: {'✅ Enabled' if SNMP_AVAILABLE else '❌ Disabled'}")
    print(f"   Alerting System: {'✅ Enabled' if ALERTING_AVAILABLE else '❌ Disabled'}")
    print(f"   Thresholds: {'✅ Enabled' if THRESHOLDS_AVAILABLE else '❌ Disabled'}")
    print(f"   Topology: {'✅ Enabled' if TOPOLOGY_AVAILABLE else '❌ Disabled'}")
    print(f"   Analytics Engine: {'✅ Enabled' if ANALYTICS_AVAILABLE else '❌ Disabled'}")
    
    # Print endpoints
    print("\n🌐 API Server running on http://localhost:5000")
    print("📡 CORS enabled for frontend")
    print("\n📍 Available Endpoints:")
    print("\n   Core API (v2.0):")
    print("      GET  /api/health              - Health check")
    print("      GET  /api/summary             - Network summary")
    print("      GET  /api/alerts              - Alert summary")
    print("      GET  /api/incidents           - Incidents list")
    print("      GET  /api/device/<id>/latency - Device latency history")
    
    if AUTH_AVAILABLE:
        print("\n   Authentication (v3.0):")
        print("      POST /api/auth/login       - User login")
        print("      POST /api/auth/register    - Register user (admin)")
        print("      GET  /api/auth/me          - Current user info")
        print("      GET  /api/auth/users       - List users (admin)")
    
    print("\n   Device Management (v3.0):")
    print("      GET  /api/devices             - List all devices")
    print("      POST /api/devices             - Add device")
    print("      DEL  /api/devices/<id>        - Delete device (admin)")
    
    if SNMP_AVAILABLE:
        print("\n   SNMP Monitoring (v3.0):")
        print("      GET  /api/snmp/metrics/<id>   - SNMP metrics")
        print("      POST /api/snmp/monitor/<id>   - Trigger SNMP poll")
    
    if THRESHOLDS_AVAILABLE:
        print("\n   Thresholds (v3.0):")
        print("      GET  /api/thresholds          - List thresholds")
        print("      POST /api/thresholds          - Create threshold")
        print("      PUT  /api/thresholds/<id>     - Update threshold")
    
    if TOPOLOGY_AVAILABLE:
        print("\n   Network Topology (v3.0):")
        print("      GET  /api/topology            - Get topology")
        print("      POST /api/topology/link       - Add link")
        print("      DEL  /api/topology/link/<id>  - Delete link")
    
    if ALERTING_AVAILABLE:
        print("\n   Alerting (v3.0):")
        print("      POST /api/alerts/send         - Send alert")
        print("      GET  /api/alerts/config       - Alert config")
    
    print("\n   Analytics (v3.0):")
    print("      GET  /api/analytics/trends    - Historical trends")
    print("      GET  /api/analytics/reports   - Generate reports")
    
    print("\n" + "=" * 70)
    print("✅ Server ready! Press Ctrl+C to stop")
    print("=" * 70 + "\n")
    
    # Start Flask app
    app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)