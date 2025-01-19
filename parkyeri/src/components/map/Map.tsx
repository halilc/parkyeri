import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Platform, TouchableOpacity, Alert, ActivityIndicator, Image, StyleSheet, Pressable, Modal } from 'react-native';
import MapView, { Marker, Callout, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { useMapContext } from '../../context/MapContext';
import { getNearbyStreets, getParkPoints, reportParkPoint, addUserParkPoint } from '../../services/api';
import { ParkingStreet } from '../../types';
import izmirParkingLots from '../../../assets/izmir.json';

interface MapProps {
  mapRef: React.RefObject<MapView>;
  onRegionChange: (region: Region) => void;
  onDeletePoint?: (id: string) => void;
}

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface ParkPoint {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  streetName: string;
  userId: string;
  duration?: number;
  remainingTime?: number;
  parkedCount: number;
  wrongLocationCount: number;
}

interface ParkingLot {
  name: string;
  lat: number;
  lng: number;
  isPaid: boolean;
  occupancy: {
    total: {
      free: number;
      occupied: number;
    };
  };
}

// Modal bileşeni
const ParkModal: React.FC<{
  visible: boolean;
  point: ParkPoint | null;
  onClose: () => void;
  onParked: (pointId: string) => void;
  onWrongLocation: (pointId: string) => void;
}> = ({ visible, point, onClose, onParked, onWrongLocation }) => {
  if (!point) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.modalContent}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          
          <Text style={styles.streetName}>{point.streetName || 'Bilinmeyen Sokak'}</Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.successButton]} 
              onPress={() => {
                console.log('Park Ettim butonuna tıklandı');
                onParked(point.id);
              }}
            >
              <Text style={styles.buttonText}>Park Ettim</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.dangerButton]}
              onPress={() => {
                console.log('Park Yeri Yanlış butonuna tıklandı');
                onWrongLocation(point.id);
              }}
            >
              <Text style={styles.buttonText}>Park Yeri Yanlış</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 16,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  calloutContainer: {
    width: 200,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  callout: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 5,
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
  },
  streetName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    color: '#333',
  },
  remainingTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
    gap: 8,
  },
  button: {
    flex: 1,
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successButton: {
    backgroundColor: '#4CAF50',
  },
  dangerButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  refreshButton: {
    position: 'absolute',
    bottom: 20,
    right: 80,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  refreshButtonDisabled: {
    opacity: 0.5,
  },
  refreshButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  locationButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  locationButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  calloutTouchable: {
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  menuButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuButtonText: {
    fontSize: 20,
  },
  menuModal: {
    position: 'absolute',
    top: 100,
    left: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  parkingLotMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 5,
    borderWidth: 2,
  },
  parkingLotMarkerText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  parkButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  parkButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userParkMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// İki nokta arasındaki mesafeyi hesaplayan fonksiyon (metre cinsinden)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Dünya'nın yarıçapı (metre cinsinden)
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // metre cinsinden mesafe
};

export const Map: React.FC<MapProps> = ({ mapRef, onRegionChange, onDeletePoint }) => {
  const { region, setRegion, parkPoints, setParkPoints: updateParkPoints, parkingStreets, setParkingStreets, user, setUser } = useMapContext();
  const [selectedPoint, setSelectedPoint] = useState<ParkPoint | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentRegion, setCurrentRegion] = useState(region);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const markerRefs = useRef<{ [key: string]: any }>({});

  // Sokak verilerini yenile
  const handleRefreshStreets = async () => {
    try {
      setIsLoading(true);
      console.log('Yeni sokak verileri alınıyor:', currentRegion);
      
      // Yeni sokakları al
      const streets = await getNearbyStreets({
        latitude: currentRegion.latitude,
        longitude: currentRegion.longitude,
      });
      console.log(`${streets.length} sokak bulundu`);
      setParkingStreets(streets);

      // Park noktalarını yenile
      const points = await getParkPoints({
        latitude: currentRegion.latitude,
        longitude: currentRegion.longitude,
      });
      console.log('Alınan park noktaları:', points);
      if (points.length > 0) {
        console.log('Örnek park noktası:', {
          id: points[0].id,
          coordinate: points[0].coordinate,
          streetName: points[0].streetName
        });
      }
      
      // Verileri güncelle
      updateParkPoints(points);

      // Region'u güncelle
      setRegion(currentRegion);

      console.log(`${streets.length} sokak ve ${points.length} park noktası yüklendi`);
    } catch (error) {
      console.error('Veriler yenilenirken hata:', error);
      Alert.alert('Hata', 'Veriler yenilenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // Mevcut konuma git
  const goToCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Hata', 'Konum izni gerekli');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: currentRegion.latitudeDelta,
        longitudeDelta: currentRegion.longitudeDelta,
      };

      // Sadece konuma git, sokakları yenileme
      mapRef.current?.animateToRegion(newRegion, 1000);
      setCurrentRegion(newRegion);
      setRegion(newRegion);

    } catch (error) {
      console.error('Konum alınırken hata:', error);
      Alert.alert('Hata', 'Konum alınamadı');
    }
  };

  // İlk açılışta konuma git
  useEffect(() => {
    const initializeMap = async () => {
      try {
        setIsLoading(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Hata', 'Konum izni gerekli');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const newRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        };

        // Önce haritayı taşı
        mapRef.current?.animateToRegion(newRegion, 1000);
        setCurrentRegion(newRegion);
        setRegion(newRegion);

        // Sonra verileri al
        const streets = await getNearbyStreets({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        const points = await getParkPoints({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        console.log('İlk yüklemede alınan park noktaları:', points);

        // Verileri güncelle
        setParkingStreets(streets);
        updateParkPoints(points);

        console.log(`İlk yükleme: ${streets.length} sokak ve ${points.length} park noktası yüklendi`);
      } catch (error) {
        console.error('Harita başlatılırken hata:', error);
        Alert.alert('Hata', 'Konum bilgisi alınamadı');
      } finally {
        setIsLoading(false);
      }
    };

    initializeMap();
  }, []);

  // Debug için parkPoints değişikliklerini izle
  useEffect(() => {
    console.log('Park noktaları güncellendi:', parkPoints);
    if (parkPoints && parkPoints.length > 0) {
      console.log('İlk park noktası:', parkPoints[0]);
      console.log('Park noktası koordinatları:', {
        latitude: parkPoints[0].coordinate.latitude,
        longitude: parkPoints[0].coordinate.longitude,
        streetName: parkPoints[0].streetName
      });
    }
  }, [parkPoints]);

  // Park olasılığına göre renk döndüren yardımcı fonksiyon
  const getProbabilityColor = (probability: number): string => {
    if (probability < 0.3) return '#ff4444'; // Kırmızı - Ana yollar ve işlek caddeler
    if (probability < 0.7) return '#ffbb33'; // Turuncu - Orta büyüklükteki sokaklar
    return '#00C851'; // Yeşil - Ara sokaklar ve sakin bölgeler
  };

  // Sokağın büyüklüğüne göre çizgi kalınlığını belirle
  const getStrokeWidth = (probability: number): number => {
    if (probability < 0.3) return 2; // Ana yollar için daha kalın
    if (probability < 0.7) return 1.5; // Orta büyüklükteki sokaklar için orta kalınlık
    return 1; // Ara sokaklar için ince çizgi
  };

  // Park noktası raporlama işleyicisi
  const handleReportParkPoint = async (pointId: string, type: 'parked' | 'wrong_location') => {
    try {
      console.log('Rapor gönderiliyor:', { pointId, type });
      const updatedPoints = await reportParkPoint(pointId, type);
      
      // Modal'ı kapat
      setSelectedPoint(null);
      
      // Kullanıcıya bilgi ver
      Alert.alert(
        'Teşekkürler',
        type === 'parked' 
          ? 'Park ettiğiniz bilgisi kaydedildi.' 
          : 'Geri bildiriminiz için teşekkürler.'
      );

      // Park noktalarını güncelle
      updateParkPoints(updatedPoints);
    } catch (error) {
      console.error('Park noktası raporlanırken hata:', error);
      Alert.alert('Hata', 'İşlem sırasında bir hata oluştu');
    }
  };

  // Kullanıcının park ettiği yerleri işaretleme
  const handleUserParking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Hata', 'Konum izni gerekli');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      await addUserParkPoint(user?.id || 'default', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      Alert.alert('Başarılı', 'Park yeriniz kaydedildi');
      
      // Park noktalarını güncelle
      const points = await getParkPoints({
        latitude: currentRegion.latitude,
        longitude: currentRegion.longitude,
      });
      updateParkPoints(points);
    } catch (error) {
      console.error('Park yeri kaydedilirken hata:', error);
      Alert.alert('Hata', 'Park yeri kaydedilemedi');
    }
  };

  // Marker render fonksiyonu
  const renderMarker = (point: ParkPoint) => {
    const isUserParked = point.userId !== 'system';
    
    return (
      <Marker
        key={point.id}
        coordinate={point.coordinate}
        onPress={async () => {
          console.log('Marker tıklandı:', point);
          if (!isUserParked) {
            try {
              // Kullanıcının mevcut konumunu al
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Hata', 'Konum izni gerekli');
                return;
              }

              const location = await Location.getCurrentPositionAsync({});
              const distance = calculateDistance(
                location.coords.latitude,
                location.coords.longitude,
                point.coordinate.latitude,
                point.coordinate.longitude
              );

              console.log('Park noktasına uzaklık:', distance, 'metre');

              if (distance <= 50) {
                setSelectedPoint(point);
              } else {
                Alert.alert('Hata', 'Park noktası konum dışında. Park noktasına 50 metre yakın olmalısınız.');
              }
            } catch (error) {
              console.error('Konum alınırken hata:', error);
              Alert.alert('Hata', 'Konum bilgisi alınamadı');
            }
          }
        }}
      >
        <View style={styles.markerContainer}>
          <Text style={{ fontSize: 30 }}>
            {isUserParked ? '🚗' : '🅿️'}
          </Text>
        </View>
      </Marker>
    );
  };

  // Otopark marker render fonksiyonu
  const renderParkingLotMarker = (parkingLot: ParkingLot) => {
    const totalSpots = parkingLot.occupancy.total.free + parkingLot.occupancy.total.occupied;
    const occupancyPercentage = Math.round((parkingLot.occupancy.total.occupied / totalSpots) * 100);
    
    return (
      <Marker
        key={`parking-lot-${parkingLot.lat}-${parkingLot.lng}`}
        coordinate={{
          latitude: parkingLot.lat,
          longitude: parkingLot.lng,
        }}
        onPress={() => {
          Alert.alert(
            parkingLot.name,
            `Durum: ${parkingLot.isPaid ? 'Ücretli' : 'Ücretsiz'}\n` +
            `Boş Park Yeri: ${parkingLot.occupancy.total.free}\n` +
            `Dolu Park Yeri: ${parkingLot.occupancy.total.occupied}\n` +
            `Doluluk Oranı: %${occupancyPercentage}`
          );
        }}
      >
        <View style={[
          styles.markerContainer,
          { 
            backgroundColor: parkingLot.occupancy.total.free > 0 ? 'white' : '#f0f0f0',
            borderRadius: 20,
            padding: 5,
          }
        ]}>
          <Text style={{ fontSize: 30 }}>
            {parkingLot.isPaid ? '🅿️💰' : '🅿️✅'}
          </Text>
        </View>
      </Marker>
    );
  };

  return (
    <>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onRegionChangeComplete={(newRegion) => {
          const initialZoomLevel = 0.02;
          const maxLatDelta = Math.max(initialZoomLevel, currentRegion.latitudeDelta);
          
          if (newRegion.latitudeDelta > maxLatDelta) {
            const limitedRegion = {
              ...newRegion,
              latitudeDelta: maxLatDelta,
              longitudeDelta: maxLatDelta * (newRegion.longitudeDelta / newRegion.latitudeDelta),
            };
            setCurrentRegion(limitedRegion);
            onRegionChange(limitedRegion);
          } else {
            setCurrentRegion(newRegion);
            onRegionChange(newRegion);
          }
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        mapType="standard"
        rotateEnabled={false}
        zoomEnabled={true}
        pitchEnabled={false}
        scrollEnabled={true}
        maxZoomLevel={20}
      >
        {parkingStreets.map((street: ParkingStreet) => (
          <Polyline
            key={street.id}
            coordinates={street.coordinates}
            strokeColor={getProbabilityColor(street.parkingProbability)}
            strokeWidth={getStrokeWidth(street.parkingProbability)}
            lineDashPattern={[3, 3]}
            zIndex={1}
            tappable={true}
            onPress={() => {
              const probability = Math.round(street.parkingProbability * 100);
              Alert.alert(
                'Park Olasılığı',
                `Bu yolda park yeri bulma olasılığı: %${probability}\n\n` +
                (probability < 30 ? 'Ana yol veya işlek cadde' :
                 probability < 70 ? 'Orta büyüklükte sokak' :
                 'Ara sokak veya sakin bölge')
              );
            }}
          />
        ))}

        {parkPoints?.map(renderMarker)}
        
        {/* İzmir otopark noktaları */}
        {izmirParkingLots.map(renderParkingLotMarker)}
      </MapView>

      <ParkModal
        visible={!!selectedPoint}
        point={selectedPoint}
        onClose={() => setSelectedPoint(null)}
        onParked={(pointId) => handleReportParkPoint(pointId, 'parked')}
        onWrongLocation={(pointId) => handleReportParkPoint(pointId, 'wrong_location')}
      />

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.refreshButton, isLoading && styles.refreshButtonDisabled]}
        onPress={handleRefreshStreets}
        disabled={isLoading}
      >
        <Text style={styles.refreshButtonText}>Sokakları Yenile</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.locationButton}
        onPress={goToCurrentLocation}
      >
        <Text style={styles.locationButtonText}>📍</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setIsMenuOpen(!isMenuOpen)}
      >
        <Text style={styles.menuButtonText}>☰</Text>
      </TouchableOpacity>

      {isMenuOpen && (
        <View style={styles.menuModal}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              Alert.alert('Profil', `Kullanıcı: ${user?.name}`);
              setIsMenuOpen(false);
            }}
          >
            <Text style={styles.menuItemText}>Profil</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              Alert.alert('Ayarlar', 'Ayarlar ekranı yakında eklenecek');
              setIsMenuOpen(false);
            }}
          >
            <Text style={styles.menuItemText}>Ayarlar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              setUser(null);
              setIsMenuOpen(false);
            }}
          >
            <Text style={styles.menuItemText}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.parkButton}
        onPress={handleUserParking}
      >
        <Text style={styles.parkButtonText}>Park Ettim</Text>
      </TouchableOpacity>
    </>
  );
}; 