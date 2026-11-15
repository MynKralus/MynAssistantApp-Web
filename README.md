


## Mimari ayrım: Web uygulaması ve yönetici sunucusu

- Bu web istemcisi, kullanıcı oturumu için Firebase Authentication; kullanıcıya ait cihazları ve komut kuyruğunu okumak/yazmak için doğrudan Cloud Firestore kullanır.
- `MynAssistant-Server` ayrı bir yönetici/API projesidir. Render'daki yönetici paneli ve servis hesabı bu web sitesine taşınmaz; web uygulaması yönetici parolası veya servis hesabı istemez.
- PC Kumandası sayfası oturum açmadan görüntülenebilir. Ancak mevcut Android/Windows Agent bulut protokolünde cihaz sahipliği `ownerId` ve Firebase UID ile doğrulanır. Bu nedenle uzaktan komut göndermek için kullanıcının kendi MynAssistant hesabında oturum açması gerekir.
- Google girişi `GoogleAuthProvider` ile Firebase Authentication'a bağlanır. Bunun çalışması için aynı Firebase projesine ayrı bir Web app kaydı eklenmeli, onun Web `appId` değeri kullanılmalı, Google sağlayıcısı etkin olmalı ve `mynkralus.github.io` Authentication → Authorized domains listesine eklenmelidir.
