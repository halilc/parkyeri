import Constants from 'expo-constants';

const API_URL = 'http://192.168.1.103:3000';
const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey || 'YOUR_API_KEY';

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

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface ParkingStreet {
  id: string;
  coordinates: Array<{
    latitude: number;
    longitude: number;
  }>;
  parkingProbability: number;
}

export interface GetParkingStreetsParams {
  latitude: number;
  longitude: number;
  radius?: number;
}

// Gerçek sokak verilerini al
async function getNearbyStreets(location: { latitude: number; longitude: number }): Promise<ParkingStreet[]> {
  const streets: ParkingStreet[] = [];
  const radius = 0.01; // 1km yarıçap

  try {
    // OpenStreetMap Overpass API sorgusu
    const query = `
      [out:json][timeout:25];
      (
        way["highway"~"^(residential|tertiary|secondary|primary|trunk)$"]
        (${location.latitude - radius},${location.longitude - radius},${location.latitude + radius},${location.longitude + radius});
      );
      out body;
      >;
      out skel qt;
    `;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`
    });

    if (!response.ok) {
      throw new Error('Sokak verileri alınamadı');
    }

    const data = await response.json();
    const nodes = new Map();

    // Önce tüm düğümleri işle
    data.elements.forEach((element: any) => {
      if (element.type === 'node') {
        nodes.set(element.id, {
          latitude: element.lat,
          longitude: element.lon
        });
      }
    });

    // Sonra yolları işle
    data.elements.forEach((element: any) => {
      if (element.type === 'way' && element.nodes && element.nodes.length > 1) {
        const coordinates = element.nodes
          .map((nodeId: number) => nodes.get(nodeId))
          .filter(Boolean);

        if (coordinates.length > 1) {
          // Yol tipine göre park olasılığını belirle
          let probability = 0.5;
          const tags = element.tags || {};
          
          if (tags.highway === 'primary' || tags.highway === 'trunk') {
            probability = 0.2; // Ana yollar
          } else if (tags.highway === 'secondary') {
            probability = 0.4; // İkincil yollar
          } else if (tags.highway === 'tertiary') {
            probability = 0.6; // Üçüncül yollar
          } else if (tags.highway === 'residential') {
            probability = 0.8; // Mahalle içi yollar
          }

          // Her yol segmentini ayrı bir sokak olarak ekle
          for (let i = 0; i < coordinates.length - 1; i++) {
            streets.push({
              id: `street-${element.id}-${i}`,
              coordinates: [coordinates[i], coordinates[i + 1]],
              parkingProbability: probability
            });
          }
        }
      }
    });

    console.log(`${streets.length} sokak parçası bulundu`);
    return streets;
  } catch (error) {
    console.error('OpenStreetMap verisi alınırken hata:', error);
    return [];
  }
}

export const getParkingStreets = async (params: GetParkingStreetsParams): Promise<ParkingStreet[]> => {
  try {
    const { latitude, longitude } = params;
    console.log('Gerçek sokak verileri alınıyor...');
    return await getNearbyStreets({ latitude, longitude });
  } catch (error) {
    console.error('getParkingStreets error:', error);
    throw error;
  }
};

// Test park noktaları listesi
let testParkPoints: ParkPoint[] = [];

export const getParkPoints = async (): Promise<ParkPoint[]> => {
  return testParkPoints;
};

export const addParkPoint = async (parkPoint: Omit<ParkPoint, 'id' | 'timestamp' | 'remainingTime'>): Promise<ParkPoint> => {
  const newPoint: ParkPoint = {
    ...parkPoint,
    id: Math.random().toString(36).substring(7),
    timestamp: Date.now(),
    remainingTime: parkPoint.duration
  };
  testParkPoints.push(newPoint);
  return newPoint;
};

export const deleteParkPoint = async (id: string, userId: string): Promise<void> => {
  testParkPoints = testParkPoints.filter(p => p.id !== id);
}; 