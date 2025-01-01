import React from 'react';
import { View, Text, Platform, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, Callout, Polyline } from 'react-native-maps';
import { useMapContext } from '../../context/MapContext';
import { styles } from './styles';
import { WebMap } from './WebMap';
import { ParkPoint, ParkingStreet } from '../../types';

interface MapProps {
  mapRef: React.MutableRefObject<MapView | null>;
  onRegionChange: (region: any) => void;
  onDeletePoint: (pointId: string) => void;
}

export const Map: React.FC<MapProps> = ({ mapRef, onRegionChange, onDeletePoint }) => {
  const { region, user, parkPoints, parkingStreets } = useMapContext();

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

  // Sokakları çizerken kontrol et
  console.log('Çizilecek sokak sayısı:', parkingStreets.length);

  return Platform.select({
    web: (
      <WebMap region={region} style={styles.map}>
        {parkPoints.map((point: ParkPoint) => (
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
              title={`${point.remainingTime} dakika kaldı`}
              zIndex={3}
            >
              <View>
                <Text style={{ 
                  fontSize: 24,
                  opacity: point.userId === 'system' ? 0.6 : 1 // Boş park yerleri daha soluk görünsün
                }}>
                  {point.userId === 'system' ? '🅿️' : '🚗'}
                </Text>
              </View>
              <Callout>
                <View style={styles.callout}>
                  {point.userId === 'system' ? (
                    <Text>Tahmini Boş Park Yeri{'\n'}Yaklaşık {point.remainingTime} dakika içinde boşalacak</Text>
                  ) : (
                    <>
                      <Text>Kalan Süre: {point.remainingTime} dakika</Text>
                      {point.userId === user?.id && (
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => onDeletePoint(point.id)}
                        >
                          <Text style={styles.deleteButtonText}>Sil</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#ff4444' }]} />
            <Text style={styles.legendText}>Düşük Olasılık</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#ffbb33' }]} />
            <Text style={styles.legendText}>Orta Olasılık</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#00C851' }]} />
            <Text style={styles.legendText}>Yüksek Olasılık</Text>
          </View>
        </View>
      </>
    ),
  });
}; 