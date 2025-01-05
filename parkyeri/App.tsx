import React, { useRef } from 'react';
import { StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MapView from 'react-native-maps';
import { MapProvider } from './src/context/MapContext';
import { Map } from './src/components/map/Map';

export default function App() {
  const mapRef = useRef<MapView | null>(null);

  const handleRegionChange = (region: any) => {
    // Harita bölgesi değiştiğinde yapılacak işlemler
  };

  const handleDeletePoint = (pointId: string) => {
    // Park noktası silindiğinde yapılacak işlemler
  };

  return (
    <SafeAreaProvider>
      <MapProvider>
        <Map
          mapRef={mapRef}
          onRegionChange={handleRegionChange}
          onDeletePoint={handleDeletePoint}
        />
        <StatusBar style="auto" />
      </MapProvider>
    </SafeAreaProvider>
  );
}
