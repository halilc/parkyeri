import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/parkyeri')
  .then(() => console.log('MongoDB bağlantısı başarılı'))
  .catch((err) => console.error('MongoDB bağlantı hatası:', err));

// Park raporu şeması
const parkReportSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  reportType: { type: Number, required: true }, // 0: park ettim, 1: park yeri yanlış
  streetName: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const ParkReport = mongoose.model('ParkReport', parkReportSchema);

// Middleware
app.use(cors());
app.use(express.json());

// Park noktası raporlama endpoint'i
app.post('/api/park-reports', async (req, res) => {
  try {
    const { userId, latitude, longitude, reportType, streetName } = req.body;
    
    console.log('Gelen istek:', {
      endpoint: '/api/park-reports',
      method: 'POST',
      body: req.body,
      timestamp: new Date().toISOString()
    });

    const parkReport = new ParkReport({
      userId,
      latitude,
      longitude,
      reportType,
      streetName
    });

    console.log('Oluşturulan park raporu:', parkReport);

    const savedReport = await parkReport.save();
    console.log('Kaydedilen park raporu:', savedReport);

    res.status(201).json(savedReport);
  } catch (error: any) {
    console.error('Park raporu kaydedilirken hata:', error);
    console.error('Hata detayları:', {
      name: error?.name || 'Bilinmeyen hata',
      message: error?.message || 'Hata detayı yok',
      stack: error?.stack || 'Stack bilgisi yok'
    });
    res.status(500).json({ 
      error: 'Park raporu kaydedilemedi', 
      details: error?.message || 'Hata detayı yok' 
    });
  }
});

// İstatistik endpoint'i
app.get('/api/park-statistics', async (req, res) => {
  try {
    const stats = await ParkReport.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            reportType: '$reportType',
            hour: {
              $dateToString: {
                format: '%Y-%m-%d %H:00:00',
                date: '$createdAt'
              }
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.hour': -1 }
      }
    ]);

    res.json(stats);
  } catch (error) {
    console.error('İstatistikler alınırken hata:', error);
    res.status(500).json({ error: 'İstatistikler alınamadı' });
  }
});

// Tüm park raporlarını getir
app.get('/api/park-reports', async (req, res) => {
  try {
    const reports = await ParkReport.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    console.error('Park raporları alınırken hata:', error);
    res.status(500).json({ error: 'Park raporları alınamadı' });
  }
});

// Sunucuyu başlat
app.listen(port, () => {
  console.log(`Sunucu ${port} portunda çalışıyor`);
}); 