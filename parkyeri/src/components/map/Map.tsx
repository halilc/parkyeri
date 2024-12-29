import React from 'react';
import { View, Text, Platform, TouchableOpacity } from 'react-native';
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
    if (probability < 0.3) return '#ff4444'; // Kırmızı - düşük olasılık
    if (probability < 0.7) return '#ffbb33'; // Turuncu - orta olasılık
    return '#00C851'; // Yeşil - yüksek olasılık
  };

  return Platform.select({
    web: (
      <WebMap region={region} style={styles.map}>
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
        ref={mapRef}
        style={styles.map}
        region={region}
        onRegionChangeComplete={onRegionChange}
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
                    onPress={() => onDeletePoint(point.id)}
                  >
                    <Text style={styles.deleteButtonText}>Sil</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Callout>
          </Marker>
        ))}

        {parkingStreets.map((street) => (
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
        ))}
      </MapView>
    ),
  });
}; 