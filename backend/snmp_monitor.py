from pysnmp.hlapi import *
import sqlite3

class SNMPMonitor:
    """SNMP monitoring for advanced metrics"""
    
    def __init__(self, db_name='network_monitor.db'):
        self.db_name = db_name
    
    def get_connection(self):
        return sqlite3.connect(self.db_name)
    
    def get_snmp_value(self, ip_address, community, oid):
        """Get SNMP value from device"""
        try:
            iterator = getCmd(
                SnmpEngine(),
                CommunityData(community),
                UdpTransportTarget((ip_address, 161), timeout=2, retries=1),
                ContextData(),
                ObjectType(ObjectIdentity(oid))
            )
            
            errorIndication, errorStatus, errorIndex, varBinds = next(iterator)
            
            if errorIndication or errorStatus:
                return None
            
            for varBind in varBinds:
                return str(varBind[1])
            
        except Exception as e:
            print(f"SNMP Error for {ip_address}: {e}")
            return None
    
    def get_cpu_usage(self, ip_address, community='public'):
        """Get CPU usage percentage"""
        # Cisco OID for CPU usage
        oid = '1.3.6.1.4.1.9.2.1.56.0'
        return self.get_snmp_value(ip_address, community, oid)
    
    def get_memory_usage(self, ip_address, community='public'):
        """Get memory usage"""
        # Cisco OID for memory
        used_oid = '1.3.6.1.4.1.9.9.48.1.1.1.5.1'
        free_oid = '1.3.6.1.4.1.9.9.48.1.1.1.6.1'
        
        used = self.get_snmp_value(ip_address, community, used_oid)
        free = self.get_snmp_value(ip_address, community, free_oid)
        
        if used and free:
            used = float(used)
            free = float(free)
            total = used + free
            usage_percent = (used / total) * 100 if total > 0 else 0
            return round(usage_percent, 2)
        
        return None
    
    def get_interface_traffic(self, ip_address, interface_index=1, community='public'):
        """Get interface traffic (in/out bytes)"""
        in_octets_oid = f'1.3.6.1.2.1.2.2.1.10.{interface_index}'
        out_octets_oid = f'1.3.6.1.2.1.2.2.1.16.{interface_index}'
        
        in_octets = self.get_snmp_value(ip_address, community, in_octets_oid)
        out_octets = self.get_snmp_value(ip_address, community, out_octets_oid)
        
        return {
            'in_bytes': int(in_octets) if in_octets else 0,
            'out_bytes': int(out_octets) if out_octets else 0
        }
    
    def log_snmp_metrics(self, device_id, cpu, memory, traffic):
        """Log SNMP metrics to database"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS snmp_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id INTEGER NOT NULL,
                cpu_usage REAL,
                memory_usage REAL,
                traffic_in BIGINT,
                traffic_out BIGINT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (device_id) REFERENCES devices(id)
            )
        ''')
        
        cursor.execute('''
            INSERT INTO snmp_metrics (device_id, cpu_usage, memory_usage, traffic_in, traffic_out)
            VALUES (?, ?, ?, ?, ?)
        ''', (device_id, cpu, memory, traffic['in_bytes'], traffic['out_bytes']))
        
        conn.commit()
        conn.close()
    
    def monitor_all_snmp_devices(self):
        """Monitor all devices that support SNMP"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Get devices that are routers or switches (typically support SNMP)
        cursor.execute('''
            SELECT id, ip_address FROM devices 
            WHERE device_type IN ('Router', 'Switch')
        ''')
        devices = cursor.fetchall()
        conn.close()
        
        for device in devices:
            device_id, ip_address = device
            
            # Try to get SNMP metrics
            cpu = self.get_cpu_usage(ip_address)
            memory = self.get_memory_usage(ip_address)
            traffic = self.get_interface_traffic(ip_address)
            
            if cpu or memory or traffic:
                self.log_snmp_metrics(device_id, cpu, memory, traffic)
                print(f"✅ SNMP metrics logged for {ip_address}")