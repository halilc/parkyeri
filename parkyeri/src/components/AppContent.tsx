import React, { useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView from 'react-native-maps';
import PlatformMap from './map/PlatformMap';
import { useMapContext } from '../context/MapContext';
import { ParkModal } from './modals/ParkModal';

export default function AppContent() {
  const mapRef = useRef<MapView | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [parkDuration, setParkDuration] = useState('');
  const { 
    region, 
    setRegion, 
    parkPoints, 
    parkingStreets,
    getCurrentLocation 
  } = useMapContext();

  const handleRegionChange = (newRegion: any) => {
    setRegion(newRegion);
  };

  const handleLocationButtonPress = () => {
    getCurrentLocation();
  };

  const handleSaveParkPoint = () => {
    // Park noktası kaydetme işlemi burada yapılacak
    setModalVisible(false);
    setParkDuration('');
  };

  return (
    <View style={styles.container}>
      <PlatformMap
        mapRef={mapRef}
        region={region}
        parkPoints={parkPoints}
        parkingStreets={parkingStreets}
        onRegionChangeComplete={handleRegionChange}
      />
      <ParkModal 
        visible={modalVisible}
        duration={parkDuration}
        onChangeDuration={setParkDuration}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveParkPoint}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 