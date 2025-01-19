const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const UserPark = require('./models/UserPark');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB bağlantısı
mongoose.connect('mongodb://localhost:27017/parkyeri', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB bağlantısı başarılı');
}).catch((err) => {
  console.error('MongoDB bağlantı hatası:', err);
});

// Park raporlarını kaydet
app.post('/api/park-reports', async (req, res) => {
  try {
    const { userId, latitude, longitude, reportType, streetName } = req.body;
    console.log('Park raporu alındı:', { userId, latitude, longitude, reportType, streetName });
    res.status(200).json({ message: 'Rapor kaydedildi' });
  } catch (error) {
    console.error('Rapor kaydedilirken hata:', error);
    res.status(500).json({ error: 'Rapor kaydedilemedi' });
  }
});

// Kullanıcının park ettiği yeri kaydet
app.post('/api/user-parks', async (req, res) => {
  try {
    const { userId, location, timestamp } = req.body;
    console.log('Park yeri kaydediliyor:', { userId, location, timestamp });
    
    const userPark = new UserPark({
      userId,
      location,
      timestamp: new Date(timestamp)
    });
    
    await userPark.save();
    console.log('Yeni park kaydı oluşturuldu:', userPark);
    
    res.status(200).json({ 
      message: 'Park yeri kaydedildi',
      userPark 
    });
  } catch (error) {
    console.error('Park yeri kaydetme hatası:', error);
    res.status(500).json({ 
      error: 'Park yeri kaydedilemedi',
      details: error.message 
    });
  }
});

// Park kayıtlarını getir
app.get('/api/user-parks', async (req, res) => {
  try {
    const userParks = await UserPark.find()
      .sort({ timestamp: -1 })
      .limit(100);
    
    console.log(`${userParks.length} park kaydı bulundu`);
    res.status(200).json(userParks);
  } catch (error) {
    console.error('Park kayıtları alınırken hata:', error);
    res.status(500).json({ 
      error: 'Park kayıtları alınamadı',
      details: error.message 
    });
  }
});

// Sunucuyu başlat
app.listen(port, () => {
  console.log(`Sunucu http://localhost:${port} adresinde çalışıyor`);
}); 