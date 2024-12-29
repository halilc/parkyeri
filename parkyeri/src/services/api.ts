import Constants from 'expo-constants';

const API_URL = 'http://192.168.1.103:3000';
const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey;

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

export const getParkPoints = async (): Promise<ParkPoint[]> => {
  try {
    const response = await fetch(`${API_URL}/park-points`);
    if (!response.ok) {
      throw new Error('Sunucu hatası');
    }
    const data = await response.json();
    return data.map((point: ParkPoint) => ({
      ...point,
      remainingTime: point.remainingTime || 0
    }));
  } catch (error) {
    console.error('getParkPoints error:', error);
    throw error;
  }
};

export const addParkPoint = async (parkPoint: Omit<ParkPoint, 'id' | 'timestamp' | 'remainingTime'>): Promise<ParkPoint> => {
  try {
    const response = await fetch(`${API_URL}/park-points`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(parkPoint),
    });
    
    if (!response.ok) {
      throw new Error('Sunucu hatası');
    }
    
    const data = await response.json();
    return {
      ...data,
      remainingTime: data.duration
    };
  } catch (error) {
    console.error('addParkPoint error:', error);
    throw error;
  }
};

export const deleteParkPoint = async (id: string, userId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/park-points/${id}?userId=${userId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Sunucu hatası');
    }
  } catch (error) {
    console.error('deleteParkPoint error:', error);
    throw error;
  }
};

// Google Polyline decoder
function decodePolyline(encoded: string): Array<{latitude: number; longitude: number}> {
  const points: Array<{latitude: number; longitude: number}> = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let shift = 0;
    let result = 0;

    do {
      const b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (result & 0x20);

    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      const b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (result & 0x20);

    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push({
      latitude: lat * 1e-5,
      longitude: lng * 1e-5
    });
  }

  return points;
}

// Test için örnek rota verisi
const TEST_ROUTES = {
  routes: [
    {
      legs: [{
        steps: [
          {
            start_location: { lat: 41.0082, lng: 28.9784 },
            end_location: { lat: 41.0085, lng: 28.9787 }
          },
          {
            start_location: { lat: 41.0085, lng: 28.9787 },
            end_location: { lat: 41.0088, lng: 28.9790 }
          },
          {
            start_location: { lat: 41.0088, lng: 28.9790 },
            end_location: { lat: 41.0091, lng: 28.9793 }
          }
        ]
      }]
    },
    {
      legs: [{
        steps: [
          {
            start_location: { lat: 41.0082, lng: 28.9784 },
            end_location: { lat: 41.0082, lng: 28.9789 }
          },
          {
            start_location: { lat: 41.0082, lng: 28.9789 },
            end_location: { lat: 41.0082, lng: 28.9794 }
          }
        ]
      }]
    }
  ]
};

// Yol tipine göre park yeri bulma olasılığını hesapla
const calculateParkingProbability = (step: any): number => {
  // Yolun tipi ve özellikleri
  const roadType = step.html_instructions?.toLowerCase() || '';
  const roadWidth = step.distance?.value || 0;
  const timeOfDay = new Date().getHours();

  let probability = 0.5; // Başlangıç olasılığı

  // 1. Yol tipi faktörü
  if (
    roadType.includes('highway') || 
    roadType.includes('otoyol') ||
    roadType.includes('e-') ||
    step.maneuver?.includes('roundabout')
  ) {
    // Ana yollarda park etmek genelde yasak
    probability *= 0.1;
  } else if (roadType.includes('bulvar') || roadType.includes('cadde')) {
    // Ana caddelerde sınırlı park alanı
    probability *= 0.3;
  } else if (roadType.includes('sokak') || roadType.includes('street')) {
    // Ara sokaklarda daha fazla park alanı
    probability *= 1.2;
  }

  // 2. Yol genişliği faktörü
  if (roadWidth > 25) {
    // Çok geniş yollar genelde ana yollar, park yasak
    probability *= 0.2;
  } else if (roadWidth > 15) {
    // Orta genişlikte yollar, sınırlı park
    probability *= 0.6;
  } else if (roadWidth > 8) {
    // Normal genişlikte sokaklar, park mümkün
    probability *= 1.0;
  } else {
    // Dar sokaklar, park zor
    probability *= 0.4;
  }

  // 3. Zaman faktörü
  if (timeOfDay >= 9 && timeOfDay <= 17) {
    // Mesai saatleri - park yeri bulmak zor
    probability *= 0.6;
  } else if (timeOfDay >= 22 || timeOfDay <= 6) {
    // Gece saatleri - park yeri bulmak kolay
    probability *= 1.5;
  }

  // 4. Konum bazlı faktörler
  if (roadType.includes('merkez') || roadType.includes('center')) {
    // Merkezi bölgelerde park zor
    probability *= 0.4;
  } else if (roadType.includes('mahalle') || roadType.includes('residential')) {
    // Mahalle aralarında park kolay
    probability *= 1.3;
  }

  // 5. Yol özellikleri
  if (step.maneuver?.includes('turn')) {
    // Dönüşlerde ve kavşaklarda park zor
    probability *= 0.5;
  }

  // Olasılığı 0-1 aralığına normalize et
  probability = Math.max(0, Math.min(1, probability));

  // Son olasılık değerlerini kategorize et
  if (probability < 0.3) {
    // Kırmızı - park yeri bulmak çok zor
    return Math.random() * 0.3;
  } else if (probability < 0.7) {
    // Sarı - orta olasılık
    return 0.3 + Math.random() * 0.4;
  } else {
    // Yeşil - park yeri bulmak kolay
    return 0.7 + Math.random() * 0.3;
  }
};

// Gerçek sokak verilerini al
const getNearbyStreets = async (location: { latitude: number; longitude: number }): Promise<ParkingStreet[]> => {
  const streets: ParkingStreet[] = [];
  const radius = 0.003; // Yaklaşık 300 metre
  
  // 4 yöne doğru rotalar oluştur
  const destinations = [
    { lat: location.latitude + radius, lng: location.longitude }, // Kuzey
    { lat: location.latitude - radius, lng: location.longitude }, // Güney
    { lat: location.latitude, lng: location.longitude + radius }, // Doğu
    { lat: location.latitude, lng: location.longitude - radius }  // Batı
  ];

  try {
    // Her yön için rota al
    const promises = destinations.map(async (dest, index) => {
      console.log(`Rota isteği ${index}:`, {
        origin: `${location.latitude},${location.longitude}`,
        destination: `${dest.lat},${dest.lng}`
      });

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${location.latitude},${location.longitude}&destination=${dest.lat},${dest.lng}&mode=driving&alternatives=true&key=${GOOGLE_MAPS_API_KEY}`
      );
      
      const data = await response.json();
      console.log(`Rota cevabı ${index}:`, {
        status: data.status,
        routesCount: data.routes?.length
      });

      if (data.routes && data.routes.length > 0) {
        data.routes.forEach((route: any, routeIndex: number) => {
          if (route.legs && route.legs.length > 0) {
            const steps = route.legs[0].steps;
            
            steps.forEach((step: any) => {
              // Her adım için park olasılığını hesapla
              const probability = calculateParkingProbability(step);
              
              // Başlangıç ve bitiş noktalarını kullan
              const coordinates = [
                {
                  latitude: step.start_location.lat,
                  longitude: step.start_location.lng
                },
                {
                  latitude: step.end_location.lat,
                  longitude: step.end_location.lng
                }
              ];

              console.log(`Yol parçası oluşturuluyor:`, {
                start: coordinates[0],
                end: coordinates[1],
                probability
              });

              streets.push({
                id: `route-${index}-${routeIndex}-${Math.random()}`,
                coordinates: coordinates,
                parkingProbability: probability
              });
            });
          }
        });
      }
    });

    await Promise.all(promises);
    console.log('Toplam oluşturulan sokak sayısı:', streets.length);
    // İlk sokağın verilerini kontrol et
    if (streets.length > 0) {
      console.log('Örnek sokak verisi:', {
        id: streets[0].id,
        coordinates: streets[0].coordinates,
        probability: streets[0].parkingProbability
      });
    }
  } catch (error) {
    console.error('Sokak verileri alınırken hata:', error);
  }

  return streets;
};

// Sokakları getir ve önbelleğe al
let cachedStreets: ParkingStreet[] | null = null;
let lastLocation: { latitude: number; longitude: number } | null = null;

export const getParkingStreets = async (location: { latitude: number; longitude: number }): Promise<ParkingStreet[]> => {
  // Eğer konum değişmediyse ve önbellekte veri varsa, önbellekten döndür
  if (
    cachedStreets && 
    lastLocation && 
    Math.abs(lastLocation.latitude - location.latitude) < 0.001 && 
    Math.abs(lastLocation.longitude - location.longitude) < 0.001
  ) {
    return cachedStreets;
  }

  // Yeni veri al
  const streets = await getNearbyStreets(location);
  
  // Önbelleğe al
  cachedStreets = streets;
  lastLocation = location;
  
  return streets;
}; 