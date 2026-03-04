import React, { useState, useContext, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet, TouchableOpacity } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';

const DashboardScreen = ({ navigation }) => {
  const { state } = useContext(AuthContext);
  const [summary, setSummary] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/summary', {
        headers: { Authorization: `Bearer ${state.token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={summary?.devices || []}
        ListHeaderComponent={() => (
          <View>
            {/* KPI Cards */}
            <View style={styles.cardsContainer}>
              <View style={[styles.card, styles.blueCard]}>
                <Text style={styles.cardLabel}>Total Devices</Text>
                <Text style={styles.cardValue}>{summary?.total_devices || 0}</Text>
              </View>
              <View style={[styles.card, styles.greenCard]}>
                <Text style={styles.cardLabel}>Devices UP</Text>
                <Text style={styles.cardValue}>{summary?.devices_up || 0}</Text>
              </View>
            </View>

            <View style={styles.cardsContainer}>
              <View style={[styles.card, styles.redCard]}>
                <Text style={styles.cardLabel}>Devices DOWN</Text>
                <Text style={styles.cardValue}>{summary?.devices_down || 0}</Text>
              </View>
              <View style={[styles.card, styles.purpleCard]}>
                <Text style={styles.cardLabel}>Avg Uptime</Text>
                <Text style={styles.cardValue}>
                  {summary?.devices.reduce((a, d) => a + d.uptime_percent, 0) / (summary?.devices.length || 1).toFixed(1)}%
                </Text>
              </View>
            </View>

            {/* Device List */}
            <Text style={styles.sectionTitle}>Devices</Text>
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('DeviceDetails', { deviceId: item.id, deviceName: item.name })}
            style={styles.deviceItem}
          >
            <View style={styles.deviceHeader}>
              <Text style={styles.deviceName}>{item.name}</Text>
              <View style={[styles.statusBadge, item.status === 'UP' ? styles.statusUp : styles.statusDown]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.deviceIP}>{item.ip_address}</Text>
            <View style={styles.deviceRow}>
              <Text style={styles.deviceType}>{item.device_type}</Text>
              <Text style={styles.deviceUptime}>{item.uptime_percent.toFixed(2)}%</Text>
            </View>
          </TouchableOpacity>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  blueCard: { backgroundColor: '#1e40af' },
  greenCard: { backgroundColor: '#166534' },
  redCard: { backgroundColor: '#7f1d1d' },
  purpleCard: { backgroundColor: '#5b21b6' },
  cardLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    marginBottom: 8,
  },
  cardValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  deviceItem: {
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deviceName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusUp: { backgroundColor: '#10b981' },
  statusDown: { backgroundColor: '#ef4444' },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deviceIP: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 8,
  },
  deviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deviceType: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  deviceUptime: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default DashboardScreen;
