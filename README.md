


## Mimari ayrım: Web uygulaması ve yönetici sunucusu

- Bu web istemcisi, kullanıcı oturumu için Firebase Authentication; kullanıcıya ait cihazları ve komut kuyruğunu okumak/yazmak için doğrudan Cloud Firestore kullanır.
- `MynAssistant-Server` ayrı bir yönetici/API projesidir. Render'daki yönetici paneli ve servis hesabı bu web sitesine taşınmaz; web uygulaması yönetici parolası veya servis hesabı istemez.
- PC Kumandası sayfası oturum açmadan görüntülenebilir. Ancak mevcut Android/Windows Agent bulut protokolünde cihaz sahipliği `ownerId` ve Firebase UID ile doğrulanır. Bu nedenle uzaktan komut göndermek için kullanıcının kendi MynAssistant hesabında oturum açması gerekir.
- Google girişi `GoogleAuthProvider` ile Firebase Authentication'a bağlanır. Bunun çalışması için aynı Firebase projesine ayrı bir Web app kaydı eklenmeli, onun Web `appId` değeri kullanılmalı, Google sağlayıcısı etkin olmalı ve `mynkralus.github.io` Authentication → Authorized domains listesine eklenmelidir.


## Marka görseli

Ana sayfa avatarı, başlık simgesi, favicon ve PWA simgesi `mynassistant-logo.webp` dosyasını kullanır. Bu dosya proje sahibi tarafından sağlanan mavi MynAssistant logosunun beyaz zemini korunarak WebP biçimine dönüştürülmüş sürümüdür. Yayın iş akışı logoyu başka bir depodan indirmez veya yeniden çizmez.


## Google sign-in flow on GitHub Pages

Google authentication uses `signInWithPopup` on mobile and desktop. The earlier mobile-only redirect flow has been removed because this site is hosted on GitHub Pages while Firebase's OAuth helper uses the `firebaseapp.com` domain; third-party storage restrictions can interrupt redirect sign-in on modern browsers. The app now explicitly uses local Firebase Auth persistence, completes any pending legacy redirect result at startup, and returns a successful user to the home screen while subscribing to that user's devices.

The Google account chooser may still display `myncloud-24.firebaseapp.com`. This is the Firebase `authDomain` used as the OAuth redirect host, not the visible name of the website. It cannot be safely replaced by editing a display string or by changing it to the GitHub Pages hostname. Hiding it requires a real custom auth domain with Firebase Hosting or an equivalent same-domain auth-helper proxy, plus the corresponding authorized OAuth redirect URI.

## Web soru-cevap

Ana sayfada giriş yaptıktan sonra **Soru sor** moduyla genel yapay zekâ sohbeti kullanılabilir. **Cihaz komutu** modu, mevcut Windows/Android cihaz komutları için ayrı tutulmuştur. Sohbet istekleri `https://mynassistant-server.onrender.com/api/v1/assistant/chat` adresine Firebase ID token ile gönderilir. Sağlayıcı API anahtarı web JavaScript dosyalarında bulunmaz; sunucunun Render Environment ayarlarında tutulur.

### Sohbet oturumları ve geçmiş

- Sohbetler Firebase Authentication UID'sine göre bu tarayıcının yerel depolamasında ayrı tutulur; başka bir hesap aynı geçmişi görüntüleyemez.
- Tarayıcı yenilendiğinde veya kullanıcı aynı hesapla tekrar giriş yaptığında son aktif sohbet geri yüklenir.
- Son 8 sohbet ve sohbet başına son 40 mesaj saklanır. Yapay zekâ isteğine bağlam olarak son 12 mesaj gönderilir.
- Sohbet seçiciyle önceki oturuma dönülebilir; **Yeni sohbet** bağlamı sıfırlar, **Sil** yalnızca seçili yerel sohbeti siler.
- Bu kayıtlar Render sunucusuna veya Firestore'a yüklenmez ve başka cihazlarla eşitlenmez. Tarayıcı verisi temizlenirse yerel geçmiş de silinir.
