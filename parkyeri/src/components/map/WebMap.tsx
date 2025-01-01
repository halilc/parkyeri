import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Region } from '../../types';
import { useMapContext } from '../../context/MapContext';

interface WebMapProps {
  style?: StyleProp<ViewStyle>;
}

export const WebMap: React.FC<WebMapProps> = ({ style }) => {
  const { region } = useMapContext();

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#f0f0f0',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      ...(style as any),
    }}>
      <p>Web haritası henüz desteklenmiyor</p>
      <p>Konum: {region.latitude}, {region.longitude}</p>
    </div>
  );
}; 