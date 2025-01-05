import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Platform, TouchableOpacity, Alert, ActivityIndicator, Image, StyleSheet } from 'react-native';
import MapView, { Marker, Callout, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { useMapContext } from '../../context/MapContext';
import { getNearbyStreets, getParkPoints, reportParkPoint } from '../../services/api';
import { ParkingStreet } from '../../types';

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

// Dialog bileşeni
const ParkDialog: React.FC<{
  point: ParkPoint;
  onClose: () => void;
  onParked: (pointId: string) => void;
  onWrongLocation: (pointId: string) => void;
}> = ({ point, onClose, onParked, onWrongLocation }) => {
  return (
    <View style={styles.callout}>
      <TouchableOpacity 
        style={styles.closeButton} 
        onPress={onClose}
      >
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>
      
      <View style={styles.calloutContent}>
        <Text style={styles.streetName}>{point.streetName || 'Bilinmeyen Sokak'}</Text>
        <Text style={styles.remainingTime}>
          Kalan Süre: {point.remainingTime || 'Belirsiz'} dakika
        </Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.successButton]} 
            onPress={() => onParked(point.id)}
          >
            <Text style={styles.buttonText}>Park Ettim</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.dangerButton]}
            onPress={() => onWrongLocation(point.id)}
          >
            <Text style={styles.buttonText}>Park Yeri Yanlış</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
    height: 'auto',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
  },
  callout: {
    width: '100%',
    alignItems: 'center',
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
  },
  button: {
    padding: 8,
    borderRadius: 4,
    minWidth: 80,
    marginHorizontal: 4,
  },
  successButton: {
    backgroundColor: '#4CAF50',
  },
  dangerButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 12,
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
    minWidth: 200,
  },
});

export const Map: React.FC<MapProps> = ({ mapRef, onRegionChange, onDeletePoint }) => {
  const { region, setRegion, parkPoints, setParkPoints: updateParkPoints, parkingStreets, setParkingStreets } = useMapContext();
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentRegion, setCurrentRegion] = useState(region);
  const markerRefs = useRef<{ [key: string]: any }>({});
  const [activeCallout, setActiveCallout] = useState<ParkPoint | null>(null);

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

  // Dialog'u kapat
  const closeDialog = () => {
    const pointId = selectedMarker;
    if (pointId && markerRefs.current[pointId]) {
      markerRefs.current[pointId]?.hideCallout();
    }
    setSelectedMarker(null);
  };

  // Park noktası raporlama işleyicisi
  const handleReportParkPoint = async (pointId: string, type: 'parked' | 'wrong_location') => {
    try {
      console.log('Rapor gönderiliyor:', pointId, type);
      closeDialog();
      await reportParkPoint(pointId, type);
      updateParkPoints(parkPoints.filter(p => p.id !== pointId));
      Alert.alert(
        'Teşekkürler',
        type === 'parked' 
          ? 'Park ettiğiniz bilgisi kaydedildi.' 
          : 'Geri bildiriminiz için teşekkürler.'
      );
    } catch (error) {
      console.error('Park noktası raporlanırken hata:', error);
      Alert.alert('Hata', 'İşlem sırasında bir hata oluştu');
    }
  };

  // Marker render fonksiyonu
  const renderMarker = (point: ParkPoint) => {
    return (
      <Marker
        key={point.id}
        coordinate={point.coordinate}
        onPress={() => {
          console.log('Marker tıklandı:', point);
          setSelectedMarker(point.id);
        }}
        ref={(ref) => {
          if (ref) {
            markerRefs.current[point.id] = ref;
          }
        }}
      >
        <View style={styles.markerContainer}>
          <Text style={{ fontSize: 30 }}>🅿️</Text>
        </View>
        <Callout
          style={styles.calloutContainer}
          onPress={() => console.log('Callout tıklandı')}
        >
          <View style={styles.callout}>
            <Text style={styles.streetName}>{point.streetName || 'Bilinmeyen Sokak'}</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.successButton]} 
                onPress={() => handleReportParkPoint(point.id, 'parked')}
              >
                <Text style={styles.buttonText}>Park Ettim</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.dangerButton]}
                onPress={() => handleReportParkPoint(point.id, 'wrong_location')}
              >
                <Text style={styles.buttonText}>Park Yeri Yanlış</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Callout>
      </Marker>
    );
  };

  // selectedMarker değiştiğinde dialog'u kontrol et
  useEffect(() => {
    if (selectedMarker) {
      console.log('Dialog açılıyor:', selectedMarker);
      const point = parkPoints.find(p => p.id === selectedMarker);
      if (point) {
        console.log('Seçilen nokta:', point);
      }
    } else {
      console.log('Dialog kapandı');
    }
  }, [selectedMarker, parkPoints]);

  return Platform.select({
    web: <div>Web platformu henüz desteklenmiyor</div>,
    default: (
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
          onPanDrag={closeDialog}
          maxZoomLevel={20}
          onPress={() => {
            if (selectedMarker) {
              console.log('Haritaya tıklandı, dialog kapatılıyor');
              setSelectedMarker(null);
            }
          }}
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
        </MapView>

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
      </>
    ),
  });
}; 