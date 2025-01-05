import React, { createContext, useContext, useState } from 'react';
import { Region } from 'react-native-maps';
import { MapContextType, ParkPoint, ParkingStreet, User } from '../types';
import { getParkingStreets } from '../services/api';

export interface MapContextType {
  region: Region;
  setRegion: (region: Region) => void;
  parkPoints: ParkPoint[];
  setParkPoints: (points: ParkPoint[]) => void;
  parkingStreets: ParkingStreet[];
  setParkingStreets: (streets: ParkingStreet[]) => void;
  fetchParkingStreets: (region: Region) => Promise<void>;
}

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
  fetchParkingStreets: async () => {},
});

const defaultUser: User = {
  id: 'default-user',
  name: 'Misafir Kullanıcı',
};

export const MapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [region, setRegion] = useState<Region>({
    latitude: 41.0082,
    longitude: 28.9784,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });
  const [parkPoints, setParkPoints] = useState<ParkPoint[]>([]);
  const [parkingStreets, setParkingStreets] = useState<ParkingStreet[]>([]);
  const [user, setUser] = useState<User | null>(defaultUser);

  // Sokak verilerini getir
  const fetchParkingStreets = async (currentRegion: Region) => {
    try {
      console.log('Sokak verileri alınıyor...');
      const streets = await getParkingStreets({
        latitude: currentRegion.latitude,
        longitude: currentRegion.longitude,
      });
      console.log(`${streets.length} sokak bulundu`);
      setParkingStreets(streets);
    } catch (error) {
      console.error('Sokak verileri alınırken hata:', error);
      throw error;
    }
  };

  // Region değiştiğinde sokak verilerini koruyacak şekilde güncelle
  const handleRegionChange = (newRegion: Region) => {
    setRegion(newRegion);
  };

  return (
    <MapContext.Provider
      value={{
        region,
        setRegion: handleRegionChange,
        parkPoints,
        setParkPoints,
        parkingStreets,
        setParkingStreets,
        fetchParkingStreets,
      }}
    >
      {children}
    </MapContext.Provider>
  );
};

export const useMapContext = () => {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
}; 