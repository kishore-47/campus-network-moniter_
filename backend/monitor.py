import sqlite3
import platform
import subprocess
import re
import time
from datetime import datetime
import threading

class NetworkMonitor:
    def __init__(self, db_name='network_monitor.db', interval=30):
        """
        Initialize Network Monitor
        
        Args:
            db_name: SQLite database file name
            interval: Monitoring interval in seconds
        """
        self.db_name = db_name
        self.interval = interval
        self.running = False
        self.device_states = {}  # Track last known state
        
    def get_connection(self):
        """Get database connection"""
        return sqlite3.connect(self.db_name)
    
    def ping_device(self, ip_address):
        """
        Ping a device and return status and latency
        
        Args:
            ip_address: IP address to ping
            
        Returns:
            tuple: (is_up: bool, latency_ms: float or None)
        """
        is_windows = platform.system().lower() == 'windows'
        if is_windows:
            # Windows uses -n for count and -w for timeout in milliseconds
            command = ['ping', '-n', '1', '-w', '2000', ip_address]
        else:
            # Unix uses -c for count and -W for timeout in seconds
            command = ['ping', '-c', '1', '-W', '2', ip_address]
        
        try:
            output = subprocess.check_output(command, stderr=subprocess.STDOUT, universal_newlines=True, timeout=5)
            
            # Parse latency from ping output
            if is_windows:
                match = re.search(r'Average = (\d+)ms', output)
                if match:
                    latency = float(match.group(1))
                else:
                    match = re.search(r'time[=<](\d+)ms', output)
                    latency = float(match.group(1)) if match else None
            else:
                match = re.search(r'time=(\d+\.?\d*)\s*ms', output)
                latency = float(match.group(1)) if match else None
            
            return (True, latency)
            
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
            return (False, None)
        except Exception as e:
            print(f"Error pinging {ip_address}: {e}")
            return (False, None)
    
    def log_status(self, device_id, status):
        """Log device status to database"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO device_status (device_id, status)
            VALUES (?, ?)
        ''', (device_id, status))
        conn.commit()
        conn.close()
    
    def log_telemetry(self, device_id, latency_ms):
        """Log telemetry data to database"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO telemetry (device_id, latency_ms)
            VALUES (?, ?)
        ''', (device_id, latency_ms))
        conn.commit()
        conn.close()
    
    def create_incident(self, device_id, device_name, severity, description):
        """Create an incident when device goes down"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO incidents (device_id, severity, description, status)
            VALUES (?, ?, ?, 'OPEN')
        ''', (device_id, severity, description))
        conn.commit()
        conn.close()
        print(f"🚨 INCIDENT: {severity} - {description}")
    
    def monitor_devices(self):
        """Main monitoring loop"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT id, name, ip_address, device_type FROM devices')
        devices = cursor.fetchall()
        conn.close()
        
        for device in devices:
            device_id, name, ip_address, device_type = device
            
            # Ping the device
            is_up, latency = self.ping_device(ip_address)
            
            status = 'UP' if is_up else 'DOWN'
            
            # Log status
            self.log_status(device_id, status)
            
            # Log latency if device is up
            if is_up and latency is not None:
                self.log_telemetry(device_id, latency)
            
            # Detect state changes and create incidents
            last_state = self.device_states.get(device_id)
            
            if last_state == 'UP' and status == 'DOWN':
                # Device went down
                severity = 'CRITICAL' if device_type in ['Router', 'Firewall'] else 'HIGH'
                description = f"{name} ({ip_address}) is DOWN"
                self.create_incident(device_id, name, severity, description)
            
            elif last_state == 'DOWN' and status == 'UP':
                # Device recovered
                print(f"✅ RECOVERED: {name} is back UP")
            
            # Update state
            self.device_states[device_id] = status
            
            # Print status
            status_icon = '🟢' if is_up else '🔴'
            latency_str = f"{latency:.2f}ms" if latency else "N/A"
            print(f"{status_icon} {name:20} {ip_address:15} {status:5} {latency_str}")
    
    def start(self):
        """Start monitoring in background thread"""
        self.running = True
        
        def monitor_loop():
            while self.running:
                print(f"\n{'='*60}")
                print(f"🔍 Network Monitoring Cycle - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                print(f"{'='*60}")
                
                self.monitor_devices()
                
                print(f"\n⏳ Waiting {self.interval} seconds until next check...\n")
                time.sleep(self.interval)
        
        self.monitor_thread = threading.Thread(target=monitor_loop, daemon=True)
        self.monitor_thread.start()
        print(f"✅ Network monitor started (interval: {self.interval}s)")
    
    def stop(self):
        """Stop monitoring"""
        self.running = False
        print("⏹️  Network monitor stopped")

def main():
    """Run the monitor as a standalone service"""
    monitor = NetworkMonitor(interval=30)
    
    print("🚀 Starting Campus Network Monitor...")
    print("📡 Press Ctrl+C to stop\n")
    
    try:
        monitor.start()
        # Keep main thread alive
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n🛑 Stopping monitor...")
        monitor.stop()
        print("✅ Monitor stopped successfully")

if __name__ == '__main__':
    main()
