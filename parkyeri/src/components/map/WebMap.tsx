import React, { useEffect } from 'react';
import { WebMapProps } from '../../types';
import Constants from 'expo-constants';

declare global {
  interface Window {
    google: any;
  }
}

export const WebMap: React.FC<WebMapProps> = ({ children, region, style }) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${Constants.expoConfig?.extra?.googleMapsApiKey}`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      const map = new window.google.maps.Map(document.getElementById('map'), {
        center: { lat: region.latitude, lng: region.longitude },
        zoom: 15,
      });
    };
  }, [region]);

  return <div id="map" style={{ width: '100%', height: '100%', ...style }} />;
}; 