import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';

const AlertsScreen = () => {
  const { state } = useContext(AuthContext);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    const res = await fetch('http://localhost:5000/api/incidents?limit=50', {
      headers: { Authorization: `Bearer ${state.token}` }
    });
    const data = await res.json();
    setAlerts(data);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.device}>{item.device_name}</Text>
            <Text style={styles.desc}>{item.description}</Text>
            <Text style={styles.severity}>{item.severity}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 12 },
  item: { backgroundColor: '#1e293b', padding: 12, borderRadius: 8, marginBottom: 8 },
  device: { color: '#fff', fontWeight: '600' },
  desc: { color: '#94a3b8', marginTop: 4 },
  severity: { color: '#f97316', marginTop: 4, fontWeight: 'bold' },
});

export default AlertsScreen;
