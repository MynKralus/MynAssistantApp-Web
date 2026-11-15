# MynAssistant Web

HTML, CSS ve JavaScript ile hazırlanmış, Android MynAssistant uygulamasının web istemcisidir. Android uygulamasıyla aynı Firebase projesini ve Firestore cihaz/komut modelini kullanır.

## Teknoloji

- HTML5, CSS3, vanilla JavaScript (ES modules)
- Firebase JavaScript SDK 13.3.0 (Auth + Cloud Firestore)
- PWA manifest ve service worker
- GitHub Pages için Actions dağıtımı

## Firebase Web uygulaması kurulumu

Android projesinde kullanılan Firebase projesi: **myncloud-24**.

1. Firebase Console'da https://console.firebase.google.com/project/myncloud-24/settings/general adresini aç.
2. **Your apps** bölümünden Web (</>) uygulaması ekle. Uygulama adına `MynAssistant Web` yazabilirsin. Yeni Firebase projesi oluşturma.
3. Firebase sana Web SDK yapılandırmasını verecek. `firebase-config.js` dosyasındaki `firebaseConfig` nesnesini bu Web yapılandırmasıyla güncelle. Özellikle Web uygulamasına ait `appId` değerini ekle. Android `mobilesdk_app_id` değerini Web `appId` olarak kullanma.
4. Firebase Console → Authentication → Sign-in method bölümünde Email/Password ve Google sağlayıcılarının açık olduğunu doğrula.
5. Authentication → Settings → Authorized domains bölümüne sitenin alan adını ekle. Örneğin GitHub Pages için `mynkralus.github.io`; özel alan adı kullanırsan onu da ekle.
6. Firestore Database'in Android uygulamasının kullandığı `myncloud-24` projesinde olduğunu doğrula. Web istemcisi `users`, `devices` ve `commands` koleksiyonlarını mevcut güvenlik kurallarıyla kullanır.

**Gizli anahtarları ekleme:** Firebase Admin SDK servis hesabı JSON'u, Brevo API anahtarı, Cloudinary API secret'ı veya başka sunucu sırları bu depoya konmamalıdır. Web Firebase API anahtarı istemci yapılandırmasının parçasıdır; Firestore Rules ve Authentication domain izinleri gerçek erişim sınırıdır.

## Yerel test

Proje kök klasöründe:

```bash
python -m http.server 8080
```

Sonra `http://localhost:8080` adresini aç. HTML dosyasını doğrudan `file://` üzerinden açma; ES module, Firebase Auth popup ve service worker testleri HTTP/HTTPS gerektirir.

## GitHub Pages

Depoda `.github/workflows/pages.yml` bulunur. `main` dalına push olduğunda JavaScript sözdizimi ve manifest denetlenir, ardından Pages dağıtımı denenir.

1. GitHub → Repository → Settings → Pages bölümüne gir.
2. **Build and deployment → Source** seçeneğini **GitHub Actions** yap.
3. Actions sekmesinde **Deploy MynAssistant Web to GitHub Pages** iş akışının tamamlandığını kontrol et.
4. Proje sitesi adresi: `https://mynkralus.github.io/MynAssistantApp-Web/` (yalnızca Pages dağıtımı başarılı olduktan sonra açılır).

GitHub Free kişisel hesaplarda GitHub Pages için depo public olmalıdır. GitHub Pro ve uygun organizasyon planları private depolarda da Pages kullanımına izin verir. Depo şu an private tutuluyor; otomatik olarak public yapılmadı. Public yapmak kaynak kodunu internete açar. Planın private Pages'i desteklemiyorsa, görünürlüğü değiştirmeden önce bilinçli karar ver.

## Mevcut işlevler

- E-posta/şifre ile Firebase Authentication girişi ve kayıt
- Google ile Firebase girişi (authorized domain yapılandırmasına bağlı)
- Profil görünen adını kaydetme ve e-posta doğrulama/değişikliği isteği
- Aynı UID'ye ait Windows Agent cihazlarını canlı listeleme; 3 dakikadan eski heartbeat çevrimdışı sayılır
- Mevcut Firestore komut kuyruğuna allowlist tabanlı metin komutu ve PC kumanda komutları gönderme
- Ses, masaüstü, fare, klavye ve düşük kare hızlı ekran önizlemesi (Agent çevrimiçiyken)
- PcFiles: klasör listeleme, ZIP isteği, en fazla 500.000 bayt dosya yükleme/indirme ve SHA-256 doğrulaması
- Koyu/açık tema, web hata kayıtları, mobil uyumlu gezinme ve PWA kabuğu

## Web ile Android arasındaki platform sınırları

Web sayfası Android'in işletim sistemi servislerini taklit edemez. Sürekli arka plan "Hey Meyene" dinlemesi, diğer uygulamaların üzerinde overlay, Android Accessibility Service, telefon araması, Android kişiler ve tam cihaz depolaması web sürümünde sunulmaz. Ses tanıma sadece kullanıcı butona bastığında, tarayıcı destekliyorsa ve sekme açıkken çalışır.

## Güvenlik ve sınırlamalar

- Windows komutları ham PowerShell/shell değildir; sadece Agent'ın tanıdığı komut adları ve metin allowlist'i gönderilir.
- Dosya erişimi Windows Agent'ın kendi izinli kökleriyle sınırlıdır. Web uygulaması sunucu dosya sistemine erişmez.
- Dosya aktarımı tek dosyada 500.000 bayt ile sınırlıdır; SHA-256 hatasında indirme/yükleme tamamlanmaz.
- Eski yerel LAN bağlantı türleri yerine `firebase-agent` cihaz bağlantısı gerekir.
- Web istemcisi GitHub Pages gibi statik bir sunucuda çalışır; Firebase/Firestore erişimi için internet ve yetkili alan adı gerekir.
- Ekran kareleri yalnızca PC Kumandası sayfası açıkken istenir; akıcı WebRTC video akışı değildir.
- Gerçek kullanıcı hesabı/cihazlarla uçtan uca test için Firebase Web App kaydı, Authentication authorized domain ve canlı Windows Agent gerekir.
