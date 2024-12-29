import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const router = express.Router();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory databases
interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  password?: string;
  authType: 'google' | 'email';
}

interface ParkPoint {
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

let users: User[] = [{
  id: 'admin',
  email: 'admin@parkyeri.com',
  name: 'Admin',
  password: 'admin123',
  authType: 'email'
}];
let parkPoints: ParkPoint[] = [];

// Rastgele yakın noktalar oluştur
const createNearbyPoints = (baseLocation: { latitude: number; longitude: number }, userId: string) => {
  const offsets = [
    { lat: 0.001, lng: 0.001 },    // Sağ üst
    { lat: -0.001, lng: 0.001 },   // Sağ alt
    { lat: 0.001, lng: -0.001 },   // Sol üst
    { lat: -0.001, lng: -0.001 },  // Sol alt
  ];

  return offsets.map((offset, index) => ({
    id: (index + 1).toString(),
    userId,
    coordinate: {
      latitude: baseLocation.latitude + offset.lat,
      longitude: baseLocation.longitude + offset.lng
    },
    duration: Math.floor(Math.random() * 60) + 30, // 30-90 dakika arası
    timestamp: Date.now() - (Math.floor(Math.random() * 30) * 60 * 1000) // 0-30 dakika önce
  }));
};

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

// User Routes
router.post('/users/auth', (req: Request, res: Response): void => {
  const { email, name, picture } = req.body;
  
  let user = users.find(u => u.email === email);
  
  if (!user) {
    user = {
      id: Date.now().toString(),
      email,
      name,
      picture,
      authType: 'google'
    };
    users.push(user);
  }
  
  res.status(200).json(user);
});

// Email/şifre ile kayıt
router.post('/users/register', (req: Request, res: Response): void => {
  const { email, password, name } = req.body;
  
  // Email kontrolü
  if (users.find(u => u.email === email)) {
    res.status(400).json({ error: 'Bu email adresi zaten kayıtlı' });
    return;
  }
  
  const newUser: User = {
    id: Date.now().toString(),
    email,
    name,
    password,
    authType: 'email'
  };
  
  users.push(newUser);
  
  // Şifreyi response'dan çıkar
  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json(userWithoutPassword);
});

// Email/şifre ile giriş
router.post('/users/login', (req: Request, res: Response): void => {
  const { email, password } = req.body;
  
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    res.status(401).json({ error: 'Geçersiz email veya şifre' });
    return;
  }
  
  // Şifreyi response'dan çıkar
  const { password: _, ...userWithoutPassword } = user;
  res.status(200).json(userWithoutPassword);
});

// Park Points Routes
router.get('/park-points', (req: Request, res: Response): void => {
  cleanExpiredParkPoints();
  const pointsWithRemainingTime = parkPoints.map(point => ({
    ...point,
    remainingTime: calculateRemainingTime(point)
  }));
  res.json(pointsWithRemainingTime);
});

router.post('/park-points', (req: Request, res: Response): void => {
  cleanExpiredParkPoints();
  const { coordinate, duration, userId } = req.body;

  if (!userId) {
    res.status(401).json({ error: 'Kullanıcı girişi gerekli' });
    return;
  }

  const newParkPoint: ParkPoint = {
    id: Date.now().toString(),
    userId,
    coordinate,
    duration,
    timestamp: Date.now(),
  };

  // İlk park noktası eklendiğinde test verilerini oluştur
  if (parkPoints.filter(p => p.userId === userId).length === 0) {
    const testPoints = createNearbyPoints(coordinate, userId);
    parkPoints = [...parkPoints, ...testPoints];
  }

  parkPoints.push(newParkPoint);
  res.status(201).json({
    ...newParkPoint,
    remainingTime: newParkPoint.duration
  });
});

interface DeleteParams {
  id: string;
}

router.delete('/park-points/:id', (req: Request<DeleteParams>, res: Response): void => {
  const { id } = req.params;
  const userId = req.query.userId as string;

  const point = parkPoints.find(p => p.id === id);
  
  if (!point) {
    res.status(404).json({ error: 'Park noktası bulunamadı' });
    return;
  }

  if (point.userId !== userId) {
    res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
    return;
  }

  parkPoints = parkPoints.filter(point => point.id !== id);
  res.status(204).send();
});

// Router'ı uygulama ile ilişkilendir
app.use(router);

// Her 10 saniyede bir süresi dolmuş park noktalarını temizle
setInterval(cleanExpiredParkPoints, 10000);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 