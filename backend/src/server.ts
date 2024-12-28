import express from 'express';
import cors from 'cors';

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for park points
interface ParkPoint {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  duration: number;
  timestamp: number;
  remainingTime?: number;
}

// Test verileri
const testParkPoints: ParkPoint[] = [
  {
    id: '1',
    coordinate: {
      latitude: 41.0370013,
      longitude: 28.9763369
    },
    duration: 60,
    timestamp: Date.now() - (10 * 60 * 1000) // 10 dakika önce park edilmiş
  },
  {
    id: '2',
    coordinate: {
      latitude: 41.0380013,
      longitude: 28.9773369
    },
    duration: 30,
    timestamp: Date.now() - (5 * 60 * 1000) // 5 dakika önce park edilmiş
  },
  {
    id: '3',
    coordinate: {
      latitude: 41.0360013,
      longitude: 28.9753369
    },
    duration: 120,
    timestamp: Date.now() // Yeni park edilmiş
  },
  {
    id: '4',
    coordinate: {
      latitude: 41.0375013,
      longitude: 28.9768369
    },
    duration: 45,
    timestamp: Date.now() - (40 * 60 * 1000) // 40 dakika önce park edilmiş
  }
];

let parkPoints: ParkPoint[] = [...testParkPoints];

// Süresi dolmuş park noktalarını temizle
const cleanExpiredParkPoints = () => {
  const now = Date.now();
  parkPoints = parkPoints.filter(point => {
    const endTime = point.timestamp + (point.duration * 60 * 1000);
    return endTime > now;
  });
};

// Kalan süreyi hesapla
const calculateRemainingTime = (point: ParkPoint): number => {
  const now = Date.now();
  const endTime = point.timestamp + (point.duration * 60 * 1000);
  return Math.max(0, Math.ceil((endTime - now) / (60 * 1000)));
};

// Routes
app.get('/park-points', (req, res) => {
  cleanExpiredParkPoints();
  const pointsWithRemainingTime = parkPoints.map(point => ({
    ...point,
    remainingTime: calculateRemainingTime(point)
  }));
  res.json(pointsWithRemainingTime);
});

app.post('/park-points', (req, res) => {
  cleanExpiredParkPoints();
  const newParkPoint: ParkPoint = {
    id: Date.now().toString(),
    coordinate: req.body.coordinate,
    duration: req.body.duration,
    timestamp: Date.now(),
  };
  parkPoints.push(newParkPoint);
  res.status(201).json({
    ...newParkPoint,
    remainingTime: newParkPoint.duration
  });
});

app.delete('/park-points/:id', (req, res) => {
  const id = req.params.id;
  parkPoints = parkPoints.filter(point => point.id !== id);
  res.status(204).send();
});

// Her 10 saniyede bir süresi dolmuş park noktalarını temizle
setInterval(cleanExpiredParkPoints, 10000);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 