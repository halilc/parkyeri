import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Button, Modal, TextInput, Alert, Keyboard, TouchableOpacity, Platform, Image } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ParkPoint, getParkPoints, addParkPoint, deleteParkPoint } from './src/services/api';
import LoginScreen from './src/screens/LoginScreen';

const CarMarker = ({ remainingTime }: { remainingTime?: number }) => {
  return (
    <View style={styles.carMarkerContainer}>
      <Text style={[styles.carEmoji, { color: remainingTime && remainingTime <= 5 ? '#ff4444' : '#4CAF50' }]}>
        🚗
      </Text>
    </View>
  );
};

const CalloutContent = ({ point, onDelete }: { point: ParkPoint; onDelete: () => void }) => {
  return (
    <View style={styles.callout}>
      <Text style={styles.calloutTitle}>Park Yeri</Text>
      <Text style={styles.calloutText}>
        Kalan Süre: {point.remainingTime} dakika
      </Text>
      {Platform.select({
        ios: (
          <Button
            title="Sil"
            onPress={onDelete}
            color="#ff4444"
          />
        ),
        android: (
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={onDelete}
          >
            <Text style={styles.deleteButtonText}>Sil</Text>
          </TouchableOpacity>
        ),
      })}
    </View>
  );
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedParkPoint, setSelectedParkPoint] = useState<ParkPoint | null>(null);
  const [duration, setDuration] = useState('');
  const [parkPoints, setParkPoints] = useState<ParkPoint[]>([]);
  const [mapRef, setMapRef] = useState<MapView | null>(null);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Login status check error:', error);
    }
  };

  const handleLogin = (userData: any) => {
    setUser(userData);
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      (async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Hata', 'Konum izni gerekli');
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);
        
        await updateParkPoints();
      })();

      const interval = setInterval(updateParkPoints, 10000);

      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const updateParkPoints = async () => {
    try {
      const points = await getParkPoints();
      setParkPoints(points);
    } catch (error) {
      console.error('Park noktaları güncellenirken hata:', error);
    }
  };

  const handleAddParkPoint = async () => {
    if (!location || !duration || !user) return;

    try {
      const newParkPoint = await addParkPoint({
        coordinate: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        duration: parseInt(duration),
        userId: user.id,
      });
      setParkPoints([...parkPoints, newParkPoint]);
      setModalVisible(false);
      setDuration('');
      Keyboard.dismiss();
    } catch (error) {
      Alert.alert('Hata', 'Park noktası eklenirken bir hata oluştu');
    }
  };

  const handleDeleteParkPoint = async () => {
    if (!selectedParkPoint || !user) return;

    try {
      await deleteParkPoint(selectedParkPoint.id, user.id);
      setParkPoints(parkPoints.filter(point => point.id !== selectedParkPoint.id));
      setDeleteModalVisible(false);
      setSelectedParkPoint(null);
    } catch (error) {
      Alert.alert('Hata', 'Park noktası silinirken bir hata oluştu');
    }
  };

  const goToCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      mapRef?.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    } catch (error) {
      Alert.alert('Hata', 'Konum alınamadı');
    }
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (!location) {
    return <View style={styles.container}><Text>Konum yükleniyor...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={(ref) => setMapRef(ref)}
        style={styles.map}
        showsUserLocation={true}
        showsMyLocationButton={false}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {parkPoints.map((point) => (
          <Marker
            key={point.id}
            coordinate={point.coordinate}
            tracksViewChanges={false}
          >
            <CarMarker remainingTime={point.remainingTime} />
            <Callout
              onPress={() => {
                if (point.userId === user.id) {
                  setSelectedParkPoint(point);
                  setDeleteModalVisible(true);
                }
              }}
            >
              <CalloutContent 
                point={point}
                onDelete={() => {
                  if (point.userId === user.id) {
                    setSelectedParkPoint(point);
                    setDeleteModalVisible(true);
                  }
                }}
              />
            </Callout>
          </Marker>
        ))}
      </MapView>

      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
      </TouchableOpacity>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.locationButton} onPress={goToCurrentLocation}>
          <Text style={styles.locationButtonText}>📍</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>Park Et</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          Keyboard.dismiss();
        }}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => {
            Keyboard.dismiss();
          }}
        >
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Park Süresini Girin (dakika)</Text>
            <TextInput
              style={styles.input}
              onChangeText={setDuration}
              value={duration}
              keyboardType="numeric"
              placeholder="Örn: 60"
              onSubmitEditing={Keyboard.dismiss}
            />
            <View style={styles.modalButtons}>
              <Button 
                title="İptal" 
                onPress={() => {
                  setModalVisible(false);
                  Keyboard.dismiss();
                }} 
              />
              <Button title="Kaydet" onPress={handleAddParkPoint} />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => {
          setDeleteModalVisible(false);
          setSelectedParkPoint(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalView, styles.deleteModalView]}>
            <Text style={styles.modalText}>Park noktasını silmek istediğinize emin misiniz?</Text>
            <View style={styles.modalButtons}>
              <Button 
                title="İptal" 
                onPress={() => {
                  setDeleteModalVisible(false);
                  setSelectedParkPoint(null);
                }}
              />
              <Button 
                title="Sil" 
                color="red"
                onPress={handleDeleteParkPoint} 
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
  },
  locationButton: {
    backgroundColor: 'white',
    borderRadius: 30,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationButtonText: {
    fontSize: 24,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  deleteModalView: {
    padding: 20,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    height: 40,
    width: '80%',
    marginBottom: 20,
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  callout: {
    padding: 15,
    minWidth: 150,
    backgroundColor: 'white',
    borderRadius: 6,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  calloutText: {
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 4,
    width: '100%',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  carMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  carEmoji: {
    fontSize: 30,
  },
  logoutButton: {
    position: 'absolute',
    top: 40,
    right: 16,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutButtonText: {
    color: '#ff4444',
    fontWeight: 'bold',
  },
});
