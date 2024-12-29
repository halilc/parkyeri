const API_URL = 'http://192.168.1.103:3000';

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