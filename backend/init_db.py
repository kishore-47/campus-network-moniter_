import sqlite3
from datetime import datetime

def init_database():
    """Initialize the SQLite database with required tables"""
    conn = sqlite3.connect('network_monitor.db')
    cursor = conn.cursor()
    
    # Table 1: Devices
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
    
    # Table 2: Device Status (UP/DOWN history)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS device_status (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id INTEGER NOT NULL,
            status TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (device_id) REFERENCES devices(id)
        )
    ''')
    
    # Table 3: Telemetry (Latency measurements)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS telemetry (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id INTEGER NOT NULL,
            latency_ms REAL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (device_id) REFERENCES devices(id)
        )
    ''')
    
    # Table 4: Incidents (Alerts/Failures)
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
    
    # Table 5: Anomalies (detected by AI module)
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
    
    # Table 6: Predictions (future metrics)
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
    
    # ============================================================
    # GUARANTEED WORKING DEVICES
    # These IPs are guaranteed to work if you have internet
    # ============================================================
    
    devices = [
        # Your localhost - ALWAYS works
        ('My-Computer', '194.168.13.192', 'Computer', 'Local'),
        
        # Public DNS servers - ALWAYS work if you have internet
        ('Google-DNS', '8.8.8.8', 'Server', 'External'),
        ('Cloudflare-DNS', '1.1.1.1', 'Server', 'External'),
        ('OpenDNS', '208.67.222.222', 'Server', 'External'),
        ('Quad9-DNS', '9.9.9.9', 'Server', 'External'),
    ]
    
    # Clear existing data to start fresh
    cursor.execute('DELETE FROM incidents')
    cursor.execute('DELETE FROM telemetry')
    cursor.execute('DELETE FROM device_status')
    cursor.execute('DELETE FROM devices')
    conn.commit()
    
    # Insert devices
    cursor.executemany('''
        INSERT INTO devices (name, ip_address, device_type, location)
        VALUES (?, ?, ?, ?)
    ''', devices)
    
    conn.commit()
    conn.close()
    
    print("=" * 60)
    print("✅ DATABASE INITIALIZED SUCCESSFULLY!")
    print("=" * 60)
    print(f"📊 {len(devices)} devices configured")
    print("\n📋 Device List:")
    for device in devices:
        print(f"  {device[0]:20} {device[1]:15} {device[2]:10}")
    print("=" * 60)
    print("\n🚀 Next: Run 'python app.py' to start monitoring")
    print("=" * 60)

if __name__ == '__main__':
    init_database()