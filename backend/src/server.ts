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

let parkPoints: ParkPoint[] = [];

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