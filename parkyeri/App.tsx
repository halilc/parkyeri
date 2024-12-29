import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Platform, Text, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import MapView, { Marker, Callout, Region, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { ParkPoint, getParkPoints, addParkPoint, deleteParkPoint, ParkingStreet, getParkingStreets } from './src/services/api';
import LoginScreen from './src/screens/LoginScreen';

interface WebMapProps {
  children?: React.ReactNode;
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta?: number;
    longitudeDelta?: number;
  };
  style?: any;
}

declare global {
  interface Window {
    google: any;
  }
}

// Web için Google Maps komponenti
const WebMap = ({ children, region, style }: WebMapProps) => {
  useEffect(() => {
    // Google Maps script'ini yükle
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      const map = new window.google.maps.Map(document.getElementById('map'), {
        center: { lat: region.latitude, lng: region.longitude },
        zoom: 15,
      });
    };
  }, [region]);

  return <div id="map" style={{ width: '100%', height: '100%', ...style }} />;
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [parkPoints, setParkPoints] = useState<ParkPoint[]>([]);
  const [mapRef, setMapRef] = useState<MapView | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [duration, setDuration] = useState('');
  const [parkingStreets, setParkingStreets] = useState<ParkingStreet[]>([]);

  // Region değişikliğini handle et - sadece region state'ini güncelle
  const handleRegionChange = (newRegion: Region) => {
    setRegion(newRegion);
  };

  useEffect(() => {
    if (user) {
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
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        setRegion(newRegion);
        mapRef?.animateToRegion(newRegion, 1000);
        
        // Sadece ilk girişte park noktalarını ve sokakları getir
        try {
          const [points, streets] = await Promise.all([
            getParkPoints(),
            getParkingStreets({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            })
          ]);
          setParkPoints(points);
          setParkingStreets(streets);
          console.log('İlk veri yüklendi:', streets.length, 'sokak bulundu');
        } catch (error) {
          console.error('Veri alınırken hata:', error);
        }
      })();
    }
  }, [user]);

  const handleLogin = (userData: any) => {
    setUser(userData);
  };

  const handleDelete = async (pointId: string) => {
    try {
      await deleteParkPoint(pointId, user?.id);
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
      mapRef?.animateToRegion(newRegion, 1000);
    } catch (error) {
      Alert.alert('Hata', 'Konum alınamadı');
    }
  };

  const handleAddParkPoint = async () => {
    if (!duration) {
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

  // Park olasılığına göre renk döndüren yardımcı fonksiyon
  const getProbabilityColor = (probability: number): string => {
    if (probability < 0.3) return '#ff4444'; // Kırmızı - düşük olasılık
    if (probability < 0.7) return '#ffbb33'; // Turuncu - orta olasılık
    return '#00C851'; // Yeşil - yüksek olasılık
  };

  return (
    <View style={styles.container}>
      {!user ? (
        <LoginScreen onLogin={handleLogin} />
      ) : (
        <>
          {Platform.select({
            web: (
              <WebMap
                region={region}
                style={styles.map}
              >
                {parkPoints.map((point) => (
                  <div
                    key={point.id}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    🚗
                  </div>
                ))}
              </WebMap>
            ),
            default: (
              <MapView
                ref={(ref) => setMapRef(ref)}
                style={styles.map}
                region={region}
                onRegionChangeComplete={handleRegionChange}
                showsUserLocation={true}
                showsMyLocationButton={false}
              >
                {parkPoints.map((point) => (
                  <Marker
                    key={point.id}
                    coordinate={point.coordinate}
                    title={`${point.remainingTime} dakika kaldı`}
                  >
                    <View>
                      <Text style={{ fontSize: 24 }}>🚗</Text>
                    </View>
                    <Callout>
                      <View style={styles.callout}>
                        <Text>Kalan Süre: {point.remainingTime} dakika</Text>
                        {point.userId === user?.id && (
                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDelete(point.id)}
                          >
                            <Text style={styles.deleteButtonText}>Sil</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </Callout>
                  </Marker>
                ))}

                {parkingStreets.map((street) => {
                  console.log('Çizilecek sokak:', street.id, street.coordinates);
                  return (
                    <Polyline
                      key={street.id}
                      coordinates={street.coordinates}
                      strokeColor={getProbabilityColor(street.parkingProbability)}
                      strokeWidth={8}
                      lineDashPattern={[10, 5]}
                      zIndex={1}
                      tappable={true}
                      onPress={() => console.log('Sokağa tıklandı:', street.id)}
                    />
                  );
                })}
              </MapView>
            ),
          })}

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#ff4444' }]} />
              <Text style={styles.legendText}>Düşük</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#ffbb33' }]} />
              <Text style={styles.legendText}>Orta</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#00C851' }]} />
              <Text style={styles.legendText}>Yüksek</Text>
            </View>
          </View>

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

          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalView}>
                <Text style={styles.modalTitle}>Park Süresini Girin</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Dakika (örn: 60)"
                  keyboardType="numeric"
                  value={duration}
                  onChangeText={setDuration}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      setModalVisible(false);
                      setDuration('');
                    }}
                  >
                    <Text style={styles.modalButtonText}>İptal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={handleAddParkPoint}
                  >
                    <Text style={styles.modalButtonText}>Kaydet</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
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
  callout: {
    padding: 15,
    minWidth: 150,
    backgroundColor: 'white',
    borderRadius: 6,
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
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  modalButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  legend: {
    position: 'absolute',
    top: 50,
    left: 16,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendColor: {
    width: 16,
    height: 4,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
});
