import sqlite3
import threading
import time
from datetime import datetime, timedelta

DB_NAME = 'network_monitor.db'

class AnalyticsEngine:
    def __init__(self, db_name=DB_NAME):
        self.db_name = db_name

    def get_db_connection(self):
        conn = sqlite3.connect(self.db_name)
        conn.row_factory = sqlite3.Row
        return conn

    def detect_anomalies(self):
        """Scan recent telemetry and log anomalies."""
        conn = self.get_db_connection()
        cursor = conn.cursor()

        # look at last 50 data points per device
        cursor.execute('SELECT id FROM devices')
        devices = [row['id'] for row in cursor.fetchall()]

        for device_id in devices:
            cursor.execute('''
                SELECT latency_ms, timestamp FROM telemetry
                WHERE device_id = ?
                ORDER BY timestamp DESC
                LIMIT 50
            ''', (device_id,))
            rows = cursor.fetchall()
            if len(rows) < 10:
                continue

            values = [r['latency_ms'] for r in rows if r['latency_ms'] is not None]
            if not values:
                continue

            mean = sum(values) / len(values)
            variance = sum((v - mean) ** 2 for v in values) / len(values)
            std = variance ** 0.5

            latest = values[0]
            threshold = mean + 3 * std
            if latest > threshold:
                # record anomaly if not already logged in last hour
                cursor.execute('''
                    SELECT COUNT(*) as cnt FROM anomalies
                    WHERE device_id = ? AND metric = 'latency'
                      AND detected_at > datetime('now', '-1 hour')
                ''', (device_id,))
                already = cursor.fetchone()['cnt']
                if already == 0:
                    description = f"Latency spike: {latest} ms (mean={mean:.2f}, std={std:.2f})"
                    cursor.execute('''
                        INSERT INTO anomalies (device_id, metric, value, description)
                        VALUES (?, 'latency', ?, ?)
                    ''', (device_id, latest, description))
                    conn.commit()
        conn.close()

    def predict_latency(self, horizon_hours=1):
        """Simple linear regression on latency over past day to predict future value."""
        conn = self.get_db_connection()
        cursor = conn.cursor()

        cursor.execute('SELECT id FROM devices')
        devices = [row['id'] for row in cursor.fetchall()]

        for device_id in devices:
            # get last 24h of data
            cursor.execute('''
                SELECT latency_ms, strftime('%s', timestamp) as ts
                FROM telemetry
                WHERE device_id = ?
                AND timestamp > datetime('now', '-24 hours')
                ORDER BY ts
            ''', (device_id,))
            rows = cursor.fetchall()
            if len(rows) < 5:
                continue

            xs = [int(row['ts']) for row in rows]
            ys = [row['latency_ms'] for row in rows]

            # perform simple linear regression y = a*x + b
            n = len(xs)
            sum_x = sum(xs)
            sum_y = sum(ys)
            sum_xx = sum(x * x for x in xs)
            sum_xy = sum(x * y for x, y in zip(xs, ys))
            denom = n * sum_xx - sum_x * sum_x
            if denom == 0:
                continue
            a = (n * sum_xy - sum_x * sum_y) / denom
            b = (sum_y - a * sum_x) / n

            future_ts = xs[-1] + horizon_hours * 3600
            predicted = a * future_ts + b

            cursor.execute('''
                INSERT INTO predictions (device_id, metric, predicted_value, horizon_hours)
                VALUES (?, 'latency', ?, ?)
            ''', (device_id, predicted, horizon_hours))
            conn.commit()
        conn.close()

    def sync(self):
        """Run detection and prediction periodically."""
        while True:
            try:
                self.detect_anomalies()
                self.predict_latency(horizon_hours=1)
            except Exception as e:
                print(f"Analytics error: {e}")
            time.sleep(300)  # every 5 minutes


if __name__ == '__main__':
    engine = AnalyticsEngine()
    engine.sync()
