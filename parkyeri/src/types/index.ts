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
  email: string;
  name: string;
  picture?: string;
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
  userId: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  duration: number;
  timestamp: number;
  remainingTime?: number;
}

export interface ParkingStreet {
  id: string;
  coordinates: Array<{
    latitude: number;
    longitude: number;
  }>;
  parkingProbability: number;
} 