# 🛰️ OrbitWatch: Uzay Enkazı Takip Sistemi

![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![Flask](https://img.shields.io/badge/Framework-Flask-lightgrey.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

Dünya yörüngesindeki aktif uyduları ve uzay enkazlarını gerçek zamanlı olarak takip eden, yörünge tahminleri yapan ve çarpışma analizi sunan kapsamlı bir backend sistemidir.

---

## 📸 Ekran Görüntüsü
*(Buraya uygulamanızın 3D simülasyonundan bir ekran görüntüsü ekleyebilirsiniz)*
`![Simulation Preview](https://via.placeholder.com/800x400?text=OrbitWatch+3D+Simulation+Preview)`

---

## 🎨 Kullanıcı Arayüzü Özellikleri

Sistem, kullanıcıya verileri sadece liste olarak değil, interaktif bir **3D Uzay Durumsal Farkındalık (SSA)** platformu olarak sunar:

*   **🌍 İnteraktif 3D Dünya:** Binlerce uydu ve enkaz parçasının gerçek zamanlı konumlarını ve yörünge rotalarını görselleştirir.
*   **🔍 Gelişmiş Arama ve Filtreleme:** Uydular ve enkazlar arasında anlık geçiş yapabilir, NORAD ID veya isim ile arama yapabilirsiniz.
*   **📊 Detaylı Bilgi Paneli (Sidebar):** Seçilen bir nesne için:
    *   **Genel Bilgiler:** NORAD ID, Ülke, Fırlatma Tarihi, Yükseklik, Periyot, Hız ve Eğim (Inclination) gibi kritik veriler.
    *   **Yörünge Tahmini:** SGP4 algoritması ile hesaplanan gelecek 4 saatlik yörünge rotasının harita üzerinde gösterimi.
*   **⚠️ Çarpışma Risk Analizi (24 Saat):** Seçilen nesneye en çok yaklaşacak olan diğer 10 nesneyi, minimum mesafe ve risk seviyesi (Minimal, Orta, Kritik) ile birlikte listeler.
*   **🛠️ Görünüm Modları:** "Nokta Görünümü" ve "Çarpışma Analizi" modları arasında geçiş yaparak odaklanılan veriyi özelleştirebilirsiniz.

---

## 🚀 Temel Özellikler

*   **📡 Gerçek Zamanlı Veri Entegrasyonu:** Space-Track.org API'si üzerinden güncel GP (General Perturbation) verilerini otomatik olarak çeker.
*   **💾 Akıllı Önbellekleme (Caching):** API limitlerini korumak için verileri 2 saatlik periyotlarla yerel JSON dosyalarında saklar.
*   **🔮 Yörünge Tahmini (SGP4):** Belirli bir uydunun gelecek 72 saate kadar olan yörüngesini yüksek hassasiyetle hesaplar.
*   **💥 Çarpışma Riski Analizi:** Hedef uydu ile yörüngedeki diğer binlerce nesne arasındaki yakınlaşmaları (Close Approach) milisaniyeler içinde analiz eder.
*   **🛡️ Hata Toleransı:** API erişilemezse veya kimlik bilgileri hatalıysa sistem otomatik olarak demo veri setine geçiş yapar.

---

## 🛠️ Teknoloji Yığını

*   **Backend:** Python / Flask
*   **Veri Çekme:** Requests / Space-Track API
*   **Hesaplama:** SGP4 / Orbit Predictor (Yörünge Mekaniği)
*   **Frontend:** HTML5 / JavaScript (3D Globe Visualization)
*   **Veri Formatı:** OMM JSON / TLE (Two-Line Element Set)

---

## ⚙️ Kurulum ve Çalıştırma

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/kullaniciadi/uzay-enkazi-takip.git
cd uzay-enkazi-takip
```

### 2. Sanal Ortam Oluşturun (Önerilir)
```bash
python -m venv venv
source venv/bin/activate  # Windows için: venv\Scripts\activate
```

### 3. Bağımlılıkları Yükleyin
```bash
pip install flask flask-cors requests
```

### 4. Ortam Değişkenlerini Ayarlayın
Space-Track API erişimi için terminalinizde şu değişkenleri tanımlayın:
```bash
export SPACETRACK_USERNAME='email@adresiniz.com'
export SPACETRACK_PASSWORD='sifreniz'
```

### 5. Uygulamayı Başlatın
```bash
python app.py
```
Uygulama varsayılan olarak `http://127.0.0.1:5000` adresinde çalışacaktır.

---

## 📡 API Dokümantasyonu

| Metot | Uç Nokta | Açıklama |
| :--- | :--- | :--- |
| `GET` | `/api/satellites` | Tüm aktif uydu ve enkaz verilerini döndürür. |
| `GET` | `/api/search?q={query}` | İsim veya NORAD ID ile arama yapar. |
| `GET` | `/api/predict/{id}` | Gelecek yörünge rotasını hesaplar. |
| `GET` | `/api/collision/{id}` | Çarpışma riski analizi yapar. |
| `GET` | `/api/position/{id}` | Anlık koordinatları (Lat/Lng/Alt) hesaplar. |

---

## ⚠️ Önemli Uyarı
Bu sistemdeki "Aktiflik" durumu Space-Track üzerindeki "PAYLOAD" etiketine dayanmaktadır. Bir nesnenin "PAYLOAD" olması onun mutlaka operasyonel olduğu anlamına gelmez (eski uydular da bu etiketi taşır). Kesin operasyonel durum için UCS Satellite Database gibi kaynaklarla çapraz kontrol yapılması önerilir.

---

## 📄 Lisans
Bu proje MIT Lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakınız.

## 🤝 Katkıda Bulunma
Hata bildirimleri ve özellik talepleri için lütfen "Issues" kısmını kullanın. Pull request'leriniz her zaman bekleriz!
