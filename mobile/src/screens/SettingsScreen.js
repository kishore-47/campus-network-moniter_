import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';

const SettingsScreen = () => {
  const { signOut, state } = useContext(AuthContext);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Logged in as:</Text>
      <Text style={styles.value}>{state.user?.username}</Text>
      <TouchableOpacity style={styles.button} onPress={() => signOut()}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 20 },
  label: { color: '#94a3b8', marginBottom: 4 },
  value: { color: '#fff', fontSize: 18, marginBottom: 20 },
  button: { backgroundColor: '#ef4444', padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
});

export default SettingsScreen;
