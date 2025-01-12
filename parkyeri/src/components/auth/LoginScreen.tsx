import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useMapContext } from '../../context/MapContext';

export const LoginScreen = () => {
  const { setUser } = useMapContext();

  const handleLogin = (userId: string, userName: string) => {
    setUser({
      id: userId,
      name: userName,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Park Yeri</Text>
      <Text style={styles.subtitle}>Test Kullanıcıları</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => handleLogin('user1', 'Test Kullanıcı 1')}
        >
          <Text style={styles.buttonText}>Kullanıcı 1</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button}
          onPress={() => handleLogin('user2', 'Test Kullanıcı 2')}
        >
          <Text style={styles.buttonText}>Kullanıcı 2</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
    color: '#666',
  },
  buttonContainer: {
    width: '80%',
    gap: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 