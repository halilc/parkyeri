import React, { createContext, useContext, useState } from 'react';
import { Region } from 'react-native-maps';
import { MapContextType, ParkPoint, ParkingStreet, User } from '../types';

const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [region, setRegion] = useState<Region>({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
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
  if (context === undefined) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
}; 