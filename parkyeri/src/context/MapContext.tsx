import React, { createContext, useContext, useState } from 'react';
import { Region } from 'react-native-maps';
import { MapContextType, ParkPoint, ParkingStreet, User } from '../types';

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

const defaultUser: User = {
  id: 'default-user',
  name: 'Misafir Kullanıcı',
};

export const MapContext = createContext<MapContextType>({
  region: {
    latitude: 41.0082,
    longitude: 28.9784,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  },
  setRegion: () => {},
  parkPoints: [],
  setParkPoints: () => {},
  parkingStreets: [],
  setParkingStreets: () => {},
  user: null,
  setUser: () => {},
});

export const MapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [region, setRegion] = useState<Region>({
    latitude: 41.0082,
    longitude: 28.9784,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });
  const [parkPoints, setParkPoints] = useState<ParkPoint[]>([]);
  const [parkingStreets, setParkingStreets] = useState<ParkingStreet[]>([]);
  const [user, setUser] = useState<User | null>(null);

  return (
    <MapContext.Provider
      value={{
        region,
        setRegion,
        parkPoints,
        setParkPoints,
        parkingStreets,
        setParkingStreets,
        user,
        setUser,
      }}
    >
      {children}
    </MapContext.Provider>
  );
};

export const useMapContext = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
}; 