import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';

const DeviceDetailsScreen = ({ route }) => {
  const { deviceId } = route.params;
  const { state } = useContext(AuthContext);
  const [device, setDevice] = useState(null);
  const [latency, setLatency] = useState([]);

  useEffect(() => {
    fetchDetails();
    fetchLatency();
  }, []);

  const fetchDetails = async () => {
    // reuse summary call
    const res = await fetch(`http://localhost:5000/api/summary`, {
      headers: { Authorization: `Bearer ${state.token}` }
    });
    const data = await res.json();
    const d = data.devices.find(d => d.id === deviceId);
    setDevice(d);
  };

  const fetchLatency = async () => {
    const res = await fetch(`http://localhost:5000/api/device/${deviceId}/latency?hours=24`, {
      headers: { Authorization: `Bearer ${state.token}` }
    });
    const json = await res.json();
    setLatency(json.data);
  };

  if (!device) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{device.name}</Text>
      <Text style={styles.subtitle}>{device.ip_address}</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Status:</Text>
        <Text style={styles.value}>{device.status}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Type:</Text>
        <Text style={styles.value}>{device.device_type}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Uptime:</Text>
        <Text style={styles.value}>{device.uptime_percent}%</Text>
      </View>
      {/* Additional details, charts, etc. */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#0f172a', padding: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  text: { color: '#fff' },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { color: '#94a3b8', marginBottom: 16 },
  row: { flexDirection: 'row', marginBottom: 8 },
  label: { color: '#94a3b8', width: 100 },
  value: { color: '#fff' },
});

export default DeviceDetailsScreen;
