import { Region } from 'react-native-maps';

export interface WebMapProps {
  children?: React.ReactNode;
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta?: number;
    longitudeDelta?: number;
  };
  style?: any;
}

export interface User {
  id: string;
  name: string;
}

export interface MapContextType {
  region: Region;
  setRegion: (region: Region) => void;
  parkPoints: ParkPoint[];
  setParkPoints: (points: ParkPoint[]) => void;
  parkingStreets: ParkingStreet[];
  setParkingStreets: (streets: ParkingStreet[]) => void;
  user: User | null;
  setUser: (user: User | null) => void;
}

export interface ParkPoint {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  userId: string;
  remainingTime: number;
  parkedCount?: number;
  wrongLocationCount?: number;
}

export interface ParkingStreet {
  id: string;
  name: string;
  coordinates: Array<{
    latitude: number;
    longitude: number;
  }>;
  parkingProbability: number;
}

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
} 