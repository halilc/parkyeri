import React, { useRef } from 'react';
import { StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MapView from 'react-native-maps';
import { MapProvider, useMapContext } from './src/context/MapContext';
import { Map } from './src/components/map/Map';
import { LoginScreen } from './src/components/auth/LoginScreen';

const AppContent = () => {
  const mapRef = useRef<MapView | null>(null);
  const { user } = useMapContext();

  const handleRegionChange = (region: any) => {
    // Harita bölgesi değiştiğinde yapılacak işlemler
  };

  const handleDeletePoint = (pointId: string) => {
    // Park noktası silindiğinde yapılacak işlemler
  };

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <>
      <Map
        mapRef={mapRef}
        onRegionChange={handleRegionChange}
        onDeletePoint={handleDeletePoint}
      />
      <StatusBar style="auto" />
    </>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <MapProvider>
        <AppContent />
      </MapProvider>
    </SafeAreaProvider>
  );
}
