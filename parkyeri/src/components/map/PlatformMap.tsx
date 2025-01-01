import React from 'react';
import { Platform } from 'react-native';
import MapComponent from './Map';
import WebMapComponent from './WebMap';
import { ParkPoint, ParkingStreet } from '../../services/api';

interface PlatformMapProps {
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  parkPoints: ParkPoint[];
  parkingStreets: ParkingStreet[];
  onRegionChangeComplete: (region: any) => void;
  mapRef: React.RefObject<any>;
}

const PlatformMap: React.FC<PlatformMapProps> = (props) => {
  if (Platform.OS === 'web') {
    return <WebMapComponent {...props} />;
  }
  return <MapComponent {...props} />;
};

export default PlatformMap; 