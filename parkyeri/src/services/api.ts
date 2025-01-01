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
  remainingTime: number;
  parkedCount?: number;
  wrongLocationCount?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface ParkingStreet {
  id: string;
  name: string;
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
              name: tags.name || 'Bilinmeyen Sokak',
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

// Rastgele park yerleri oluştur
function generateRandomParkPoints(streets: ParkingStreet[]): ParkPoint[] {
  const points: ParkPoint[] = [];
  const now = Date.now();

  // Her sokak için %30 olasılıkla park yeri oluştur
  streets.forEach(street => {
    if (Math.random() < 0.3) {
      const coordinates = street.coordinates;
      // Sokağın başlangıç ve bitiş noktaları arasında rastgele bir nokta seç
      const t = Math.random(); // 0 ile 1 arasında
      const point: ParkPoint = {
        id: `empty-${Math.random().toString(36).substring(7)}`,
        userId: 'system',
        coordinate: {
          latitude: coordinates[0].latitude + (coordinates[1].latitude - coordinates[0].latitude) * t,
          longitude: coordinates[0].longitude + (coordinates[1].longitude - coordinates[0].longitude) * t
        },
        remainingTime: Math.floor(Math.random() * 60) + 10, // 10-70 dakika arası
        parkedCount: 0,
        wrongLocationCount: 0
      };
      points.push(point);
    }
  });

  return points;
}

// Test park noktaları listesi
let testParkPoints: ParkPoint[] = [];

export const getParkPoints = async (): Promise<ParkPoint[]> => {
  try {
    // Mevcut park noktalarını al
    const userPoints = testParkPoints;

    // Sokakları al ve rastgele boş park yerleri oluştur
    const streets = await getNearbyStreets({
      latitude: lastRegion?.latitude || 41.0082,
      longitude: lastRegion?.longitude || 28.9784
    });
    const emptyPoints = generateRandomParkPoints(streets);

    // Kullanıcı park noktaları ve boş park yerlerini birleştir
    return [...userPoints, ...emptyPoints];
  } catch (error) {
    console.error('Park noktaları alınırken hata:', error);
    return testParkPoints;
  }
};

// Son harita bölgesini ve sokakları sakla
let lastRegion: { latitude: number; longitude: number } | null = null;
let cachedStreets: ParkingStreet[] | null = null;
const CACHE_DISTANCE = 0.01; // Yaklaşık 1km

// İki nokta arasındaki mesafeyi hesapla
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Dünya'nın yarıçapı (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const getParkingStreets = async (params: GetParkingStreetsParams): Promise<ParkingStreet[]> => {
  try {
    const { latitude, longitude } = params;

    // Eğer önbellekte veri varsa ve yeni konum yakınsa, önbellekten döndür
    if (lastRegion && cachedStreets) {
      const distance = calculateDistance(
        latitude,
        longitude,
        lastRegion.latitude,
        lastRegion.longitude
      );
      if (distance < CACHE_DISTANCE) {
        return cachedStreets;
      }
    }

    // Yeni konum için sokakları al
    console.log('Gerçek sokak verileri alınıyor...');
    const streets = await getNearbyStreets({ latitude, longitude });
    
    // Önbelleğe al
    lastRegion = { latitude, longitude };
    cachedStreets = streets;
    
    return streets;
  } catch (error) {
    console.error('getParkingStreets error:', error);
    // Hata durumunda önbellekteki verileri döndür
    if (cachedStreets) {
      return cachedStreets;
    }
    throw error;
  }
};

export const addParkPoint = async (parkPoint: Omit<ParkPoint, 'id'>): Promise<ParkPoint> => {
  const newPoint: ParkPoint = {
    ...parkPoint,
    id: Math.random().toString(36).substring(7),
  };
  testParkPoints.push(newPoint);
  return newPoint;
};

export const deleteParkPoint = async (id: string, userId: string): Promise<void> => {
  testParkPoints = testParkPoints.filter(p => p.id !== id);
};

export const reportParkPoint = async (pointId: string, type: 'parked' | 'wrong_location'): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/parkpoints/${pointId}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type }),
    });

    if (!response.ok) {
      throw new Error('Park noktası raporlanırken hata oluştu');
    }
  } catch (error) {
    console.error('Park noktası raporlama hatası:', error);
    throw error;
  }
}; 