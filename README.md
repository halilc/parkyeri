# Park Yeri Uygulaması

Bu uygulama, araç sürücülerinin park yerlerini harita üzerinde işaretleyip paylaşabilmelerini sağlayan bir mobil uygulamadır.

## Özellikler

- Harita üzerinde mevcut konumu görüntüleme
- Park noktası ekleme ve süre belirleme
- Park noktalarını harita üzerinde görüntüleme
- Kalan park sürelerini gerçek zamanlı takip etme
- Park noktalarını silme
- Son 5 dakikası kalan park noktalarını kırmızı renkte gösterme

## Teknolojiler

- React Native (TypeScript)
- Expo
- Node.js
- Express
- React Native Maps

## Kurulum

### Backend

```bash
cd backend
npm install
npm start
```

### Mobile App

```bash
cd parkyeri
npm install
npm start
```

## Kullanım

1. Expo Go uygulamasını telefonunuza indirin
2. Backend'i başlatın
3. Mobile uygulamayı başlatın
4. Expo Go ile QR kodu okutun
5. "Park Et" butonuna tıklayarak yeni park noktası ekleyin
6. Park noktalarını harita üzerinde görüntüleyin
7. Park noktasına tıklayıp "Sil" butonuyla silebilirsiniz

## Geliştirme

- Backend: `backend/src/server.ts`
- Mobile App: `parkyeri/App.tsx`
- API Servisleri: `parkyeri/src/services/api.ts`

## Lisans

MIT 