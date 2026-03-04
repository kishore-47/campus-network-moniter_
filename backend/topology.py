import sqlite3
import json

class NetworkTopology:
    """Generate network topology data"""
    
    def __init__(self, db_name='network_monitor.db'):
        self.db_name = db_name
        self.init_topology_table()
    
    def get_connection(self):
        conn = sqlite3.connect(self.db_name)
        conn.row_factory = sqlite3.Row
        return conn
    
    def init_topology_table(self):
        """Initialize network links table"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
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
        
        conn.commit()
        conn.close()
    
    def add_link(self, source_id, target_id, link_type='physical', bandwidth=None):
        """Add network link between devices"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO network_links (source_device_id, target_device_id, link_type, bandwidth)
            VALUES (?, ?, ?, ?)
        ''', (source_id, target_id, link_type, bandwidth))
        
        conn.commit()
        conn.close()
    
    def get_topology(self):
        """Get network topology in graph format"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Get all devices
        cursor.execute('SELECT id, name, ip_address, device_type, location FROM devices')
        devices = cursor.fetchall()
        
        # Get all links
        cursor.execute('''
            SELECT nl.*, 
                   d1.name as source_name, 
                   d2.name as target_name
            FROM network_links nl
            JOIN devices d1 ON nl.source_device_id = d1.id
            JOIN devices d2 ON nl.target_device_id = d2.id
        ''')
        links = cursor.fetchall()
        
        conn.close()
        
        # Format for visualization
        nodes = []
        for device in devices:
            nodes.append({
                'id': device['id'],
                'label': device['name'],
                'type': device['device_type'],
                'ip': device['ip_address'],
                'location': device['location']
            })
        
        edges = []
        for link in links:
            edges.append({
                'source': link['source_device_id'],
                'target': link['target_device_id'],
                'type': link['link_type'],
                'bandwidth': link['bandwidth']
            })
        
        return {
            'nodes': nodes,
            'edges': edges
        }