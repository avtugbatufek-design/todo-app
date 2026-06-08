# Todo Uygulaması

Supabase (Auth + Postgres) ile çalışan basit bir yapılacaklar listesi. Tek dosya, vanilla JS — build gerektirmez.

## Özellikler
- E-posta + şifre ile kayıt / giriş (onay maili yok, doğrudan onaylanır)
- Görev ekle / tamamla / sil
- Row Level Security: her kullanıcı yalnızca kendi görevlerini görür

## Çalıştırma
```bash
python3 -m http.server 5500
```
Tarayıcıda `http://localhost:5500` adresini aç.

## Yayın
GitHub Pages ile yayınlanır (`index.html` kök dizinde).

## Mobil uygulama (React Native / Expo)
Aynı Supabase backend'ini kullanan Expo SDK 54 uygulaması [mobile/](mobile) altında.
```bash
cd mobile
npm install
npx expo start
```
Telefonunda **Expo Go** ile çıkan QR kodu okut. Aynı Wi-Fi ağında olman gerekir
(değilse `npx expo start --tunnel` kullan).

## Veritabanı
Şema [supabase/migrations](supabase/migrations) altında. Uzak projeye uygulamak için:
```bash
supabase db push
```
