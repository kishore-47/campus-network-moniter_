import sqlite3
import json

class ThresholdManager:
    """Manage alerting thresholds"""
    
    def __init__(self, db_name='network_monitor.db'):
        self.db_name = db_name
        self.init_thresholds_table()
    
    def get_connection(self):
        conn = sqlite3.connect(self.db_name)
        conn.row_factory = sqlite3.Row
        return conn
    
    def init_thresholds_table(self):
        """Initialize thresholds configuration table"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
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
        
        # Default thresholds for all devices (device_id NULL means global)
        default_thresholds = [
            (None, 'latency', 100, 200, 'greater_than', 1),
            (None, 'packet_loss', 5, 10, 'greater_than', 1),
            (None, 'cpu_usage', 80, 95, 'greater_than', 1),
            (None, 'memory_usage', 85, 95, 'greater_than', 1),
            (None, 'uptime', 95, 90, 'less_than', 1),
        ]
        
        cursor.executemany('''
            INSERT OR IGNORE INTO thresholds (device_id, metric_type, warning_threshold, critical_threshold, operator, enabled)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', default_thresholds)
        
        conn.commit()
        conn.close()
    
    def check_threshold(self, device_id, metric_type, value):
        """Check if value exceeds threshold"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Get device-specific threshold first, fall back to global
        cursor.execute('''
            SELECT * FROM thresholds
            WHERE (device_id = ? OR device_id IS NULL)
            AND metric_type = ?
            AND enabled = 1
            ORDER BY device_id DESC
            LIMIT 1
        ''', (device_id, metric_type))
        
        threshold = cursor.fetchone()
        conn.close()
        
        if not threshold:
            return None
        
        operator = threshold['operator']
        warning = threshold['warning_threshold']
        critical = threshold['critical_threshold']
        
        if operator == 'greater_than':
            if value >= critical:
                return 'CRITICAL'
            elif value >= warning:
                return 'WARNING'
        elif operator == 'less_than':
            if value <= critical:
                return 'CRITICAL'
            elif value <= warning:
                return 'WARNING'
        
        return 'OK'
    
    def get_all_thresholds(self, device_id=None):
        """Get all thresholds for a device or globally"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        if device_id:
            cursor.execute('SELECT * FROM thresholds WHERE device_id = ? OR device_id IS NULL', (device_id,))
        else:
            cursor.execute('SELECT * FROM thresholds WHERE device_id IS NULL')
        
        thresholds = cursor.fetchall()
        conn.close()
        
        return [dict(t) for t in thresholds]
    
    def update_threshold(self, threshold_id, warning, critical):
        """Update threshold values"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE thresholds
            SET warning_threshold = ?, critical_threshold = ?
            WHERE id = ?
        ''', (warning, critical, threshold_id))
        
        conn.commit()
        conn.close()