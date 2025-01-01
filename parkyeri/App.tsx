import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Alert } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { getParkPoints, addParkPoint, deleteParkPoint, getParkingStreets } from './src/services/api';
import LoginScreen from './src/screens/LoginScreen';
import { Map } from './src/components/map/Map';
import { ParkModal } from './src/components/modals/ParkModal';
import { MapProvider, useMapContext } from './src/context/MapContext';

const AppContent = () => {
  const mapRef = useRef<MapView | null>(null);
  const {
    user,
    setUser,
    region,
    setRegion,
    parkPoints,
    setParkPoints,
    setParkingStreets,
  } = useMapContext();
  const [modalVisible, setModalVisible] = React.useState(false);
  const [duration, setDuration] = React.useState('');

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Hata', 'Konum izni gerekli');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
      
      try {
        const streets = await getParkingStreets({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        console.log('Sokak verileri alındı:', streets.length);
        setParkingStreets(streets);

        const points = await getParkPoints();
        setParkPoints(points);
      } catch (error) {
        console.error('Veri alınırken hata:', error);
        Alert.alert('Hata', 'Sokak verileri alınırken bir hata oluştu');
      }
    })();
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
  };

  const handleDelete = async (pointId: string) => {
    if (!user?.id) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
      return;
    }

    try {
      await deleteParkPoint(pointId, user.id);
      setParkPoints(parkPoints.filter(p => p.id !== pointId));
    } catch (error) {
      console.error('Park noktası silinirken hata:', error);
    }
  };

  const goToCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      mapRef.current?.animateToRegion(newRegion, 1000);
    } catch (error) {
      Alert.alert('Hata', 'Konum alınamadı');
    }
  };

  const handleAddParkPoint = async () => {
    if (!duration || !user?.id) {
      Alert.alert('Hata', 'Lütfen park süresini girin');
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({});
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
    } catch (error) {
      Alert.alert('Hata', 'Park noktası eklenirken bir hata oluştu');
    }
  };

  const handleRegionChange = async (newRegion: Region) => {
    setRegion(newRegion);
    
    try {
      const streets = await getParkingStreets({
        latitude: newRegion.latitude,
        longitude: newRegion.longitude,
      });
      setParkingStreets(streets);
    } catch (error) {
      console.error('Sokak verileri güncellenirken hata:', error);
    }
  };

  return (
    <View style={styles.container}>
      {!user ? (
        <LoginScreen onLogin={handleLogin} />
      ) : (
        <>
          <Map
            mapRef={mapRef}
            onRegionChange={handleRegionChange}
            onDeletePoint={handleDelete}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.addButtonText}>Park Et</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.locationButton}
              onPress={goToCurrentLocation}
            >
              <Text style={styles.locationButtonText}>📍</Text>
            </TouchableOpacity>
          </View>

          <ParkModal
            visible={modalVisible}
            duration={duration}
            onChangeDuration={setDuration}
            onClose={() => {
              setModalVisible(false);
              setDuration('');
            }}
            onSave={handleAddParkPoint}
          />
        </>
      )}
    </View>
  );
};

export default function App() {
  return (
    <MapProvider>
      <AppContent />
    </MapProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    alignItems: 'flex-end',
    gap: 10,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    width: 120,
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
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
});
