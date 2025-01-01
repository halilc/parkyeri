import React, { useState, useRef } from 'react';
import { View, Text, Platform, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, Callout, Polyline } from 'react-native-maps';
import { useMapContext } from '../../context/MapContext';
import { styles } from './styles';
import { WebMap } from './WebMap';
import { ParkPoint, ParkingStreet, reportParkPoint } from '../../services/api';

interface MapProps {
  mapRef: React.MutableRefObject<MapView | null>;
  onRegionChange: (region: any) => void;
  onDeletePoint: (pointId: string) => void;
}

const CalloutContent: React.FC<{
  point: ParkPoint;
  onParked: () => void;
  onWrongLocation: () => void;
  onClose: () => void;
}> = ({ point, onParked, onWrongLocation, onClose }) => {
  return (
    <View style={styles.callout}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.successButton]} 
          onPress={onParked}
        >
          <Text style={styles.buttonText}>Park Ettim</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.dangerButton]}
          onPress={onWrongLocation}
        >
          <Text style={styles.buttonText}>Park Yeri Yanlış</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const Map: React.FC<MapProps> = ({ mapRef, onRegionChange, onDeletePoint }) => {
  const { region, parkPoints, setParkPoints, parkingStreets } = useMapContext();
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const markerRefs = useRef<{ [key: string]: Marker | null }>({});

  // Park noktası raporlama işleyicisi
  const handleReportParkPoint = async (pointId: string, type: 'parked' | 'wrong_location') => {
    try {
      console.log('Rapor gönderiliyor:', pointId, type);
      await reportParkPoint(pointId, type);
      setParkPoints((prevPoints: ParkPoint[]) => prevPoints.filter((p: ParkPoint) => p.id !== pointId));
      if (markerRefs.current[pointId]) {
        markerRefs.current[pointId]?.hideCallout();
      }
      setSelectedMarker(null);
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

  return Platform.select({
    web: <WebMap />,
    default: (
      <>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={region}
          onRegionChangeComplete={onRegionChange}
          showsUserLocation={true}
          showsMyLocationButton={false}
          mapType="standard"
          rotateEnabled={false}
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

          {parkPoints.map((point: ParkPoint) => (
            <Marker
              key={point.id}
              coordinate={point.coordinate}
              title={point.userId === 'system' ? 'Boş Park Yeri' : undefined}
              zIndex={3}
              ref={(ref) => {
                markerRefs.current[point.id] = ref;
                if (point.id === selectedMarker) {
                  ref?.showCallout();
                }
              }}
              onPress={() => {
                console.log('Marker tıklandı:', point.id);
                setSelectedMarker(point.id);
              }}
            >
              <View>
                <Text style={{ 
                  fontSize: 24,
                  opacity: point.userId === 'system' ? 0.6 : 1
                }}>
                  {point.userId === 'system' ? '🅿️' : '🚗'}
                </Text>
              </View>
              <Callout
                tooltip={true}
                onPress={() => {
                  console.log('Callout tıklandı');
                  if (markerRefs.current[point.id]) {
                    markerRefs.current[point.id]?.hideCallout();
                  }
                }}
              >
                <View style={styles.calloutContainer}>
                  <CalloutContent
                    point={point}
                    onParked={() => {
                      console.log('Park Ettim çağrıldı');
                      handleReportParkPoint(point.id, 'parked');
                    }}
                    onWrongLocation={() => {
                      console.log('Park Yeri Yanlış çağrıldı');
                      handleReportParkPoint(point.id, 'wrong_location');
                    }}
                    onClose={() => {
                      console.log('Dialog kapatıldı');
                      if (markerRefs.current[point.id]) {
                        markerRefs.current[point.id]?.hideCallout();
                      }
                      setSelectedMarker(null);
                    }}
                  />
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      </>
    ),
  });
}; 