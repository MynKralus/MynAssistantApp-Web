import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, setPersistence, browserLocalPersistence,
  createUserWithEmailAndPassword, signInWithPopup, signInWithRedirect,
  getRedirectResult, GoogleAuthProvider, linkWithPopup, signOut, updateProfile, reload,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";
import {
  getFirestore, collection, query, where, onSnapshot, doc, updateDoc,
  addDoc, serverTimestamp, Timestamp, setDoc
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const APP_VERSION = "0.2.0-web";
const MAX_TRANSFER_BYTES = 500_000;
const COMMAND_TIMEOUT_MS = 90_000;
const ONLINE_WINDOW_MS = 180_000;
const SETTINGS_TABS = ["Genel", "Agent", "Hesap", "İzinler", "Eklentiler", "Başlangıç", "Hata günlükleri"];
const NAV = [
  ["home", "Ana sayfa", "home"],
  ["account", "Hesabım", "user"],
  ["devices", "Cihazlarım", "devices"],
  ["settings", "Ayarlar", "settings"],
  ["remote", "PC Kumandası", "remote"],
  ["files", "PcFiles", "folder"]
];
const ICONS = {
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  devices: '<rect x="3" y="4" width="13" height="12" rx="2"/><path d="M8 20h3m-1.5-4v4m8-9h3v9h-7v-3"/>',
  touchpad: '<rect x="4" y="2.5" width="16" height="19" rx="7"/><path d="M12 15V7m0 0-2.3 2.3M12 7l2.3 2.3M7.5 15.5h9"/>',
  settings: '<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.5-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.5.9l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.8Z" transform="translate(-1 -1) scale(1.08)"/>',
  remote: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4m-5-10 2-2 2 2m2 0 2-2 2 2"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  mic: '<rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2m-7 9v3m-4 0h8"/>',
  monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/>',
  volume: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9a5 5 0 0 1 0 6m2-9a9 9 0 0 1 0 12"/>',
  mute: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="m17 9 5 6m0-6-5 6"/>',
  upload: '<path d="M12 16V3m-5 5 5-5 5 5"/><path d="M4 16v4h16v-4"/>',
  download: '<path d="M12 3v13m-5-5 5 5 5-5"/><path d="M4 17v4h16v-4"/>',
  moon: '<path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>',
  refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  edit: '<path d="m4 16.5-.8 4.3 4.3-.8L20 7.5 16.5 4z"/><path d="m14.5 6 3.5 3.5"/>',
  save: '<path d="M4 3h14l3 3v15H4z"/><path d="M8 3v6h8V3M8 21v-8h8v8"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  key: '<circle cx="8" cy="15" r="5"/><path d="m11.5 11.5 8-8L22 6l-3 3m-3 0 2 2"/>',
  alert: '<path d="m12 3 10 18H2z"/><path d="M12 9v5m0 3h.01"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  keyboard: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 15h8"/>',
  trash: '<path d="M3 6h18m-2 0-1 15H6L5 6m3 0V3h8v3m-6 4v7m4-7v7"/>',
  zip: '<path d="M4 3h16v18H4z"/><path d="M10 3v3h4V3m-2 3v3m0 3v2m0 3h.01"/>'
};

const appRoot = document.getElementById("app");
function storageGet(key, fallback = "") {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function storageSet(key, value) {
  try { localStorage.setItem(key, String(value)); } catch {}
}
function storageRemove(key) {
  try { localStorage.removeItem(key); } catch {}
}
function loadLogs() {
  try {
    const value = JSON.parse(storageGet("myn-web-logs", "[]"));
    return Array.isArray(value) ? value.slice(0, 80) : [];
  } catch { return []; }
}
const state = {
  firebaseReady: false, authReady: false, authBusy: false, user: null, page: "home", settingsTab: "Genel", authMode: "login",
  targetDialogOpen: false, accountListExpanded: false, pairingCode: "", pairingQrSignature: "", pairingQrExpiresAtUnix: 0,
  pairingBusy: false, pairingStatus: "Windows uygulamasından yeni bir eşleştirme kodu al.", pairingScannerActive: false,
  phoneEditOpen: false, phoneNumberDraft: "", phoneVerificationId: "", phoneCodeDraft: "", phoneBusy: false,
  profilePhotoBusy: false, remoteTouchpadEnabled: storageGet("myn-remote-touchpad", "true") !== "false",
  remoteKeyboardEnabled: storageGet("myn-remote-keyboard", "true") !== "false",
  theme: storageGet("myn-theme", "dark"), drawerOpen: false,
  devices: [], devicesLoading: false, devicesError: "",
  profile: null, profileBusy: false, profileMessage: "",
  selectedDeviceId: storageGet("myn-selected-device", ""),
  commandTargetId: storageGet("myn-command-target", "AUTO"), selectedAndroidDeviceId: storageGet("myn-selected-android-device", ""),
  commandText: "", busy: false, activeCommandId: "",
  feedback: "", logs: loadLogs(),
  fileListing: null, filesDeviceId: "", filesLoading: false,
  filePath: "", remoteScreenEnabled: true, speechBusy: false,
  speechRecognition: null, screenPulse: null, deviceUnsubscribe: null,
  profileUnsubscribe: null, commandUnsubscribe: null, toastTimer: null
};

function icon(name, cls = "") {
  return '<svg class="' + cls + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || ICONS.alert) + "</svg>";
}
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[ch]);
}
function fmtDate(value) {
  if (!value) return "Bilinmiyor";
  const d = value?.toDate ? value.toDate() : value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? "Bilinmiyor" : new Intl.DateTimeFormat("tr-TR", {dateStyle:"short", timeStyle:"short"}).format(d);
}
function timeMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();
  return new Date(value).getTime() || 0;
}
function isOnline(device) {
  return String(device?.status || "").toLowerCase() === "online" &&
    (Date.now() - timeMillis(device?.lastSeenAt)) <= ONLINE_WINDOW_MS;
}
function pcDevices() {
  return state.devices.filter(d => !isAndroidDevice(d) && (
    String(d.connectionMode || "") === "firebase-agent" ||
    /windows|pc/i.test(String(d.platform || d.type || d.os || ""))
  ));
}
function onlinePcDevices() { return pcDevices().filter(isOnline); }
function androidDevices() {
  const pcIds = new Set(pcDevices().map(device => device.id));
  return state.devices.filter(device => !pcIds.has(device.id) && (
    String(device.platform || device.type || device.os || "").toLowerCase() === "android" || String(device.id || "").startsWith("android-")
  ));
}
function onlineAndroidDevices() { return androidDevices().filter(isOnline); }
function isAndroidDevice(device) {
  return !!device && (String(device.platform || device.type || device.os || "").toLowerCase() === "android" || String(device.id || "").startsWith("android-"));
}
function deviceDisplayName(device) { return device?.name || device?.deviceName || (isAndroidDevice(device) ? "Android cihaz" : "Windows bilgisayar"); }
function commandTargetLabel() {
  if (state.commandTargetId === "PHONE") return "Bu telefon (Android)";
  if (state.commandTargetId === "PC") return deviceDisplayName(pcDevices().find(d => d.id === state.selectedDeviceId) || currentDevice()) || "Windows bilgisayar";
  if (state.commandTargetId === "ANDROID") return deviceDisplayName(androidDevices().find(d => d.id === state.selectedAndroidDeviceId)) || "Android cihaz";
  return "Otomatik hedef";
}
function currentDevice() {
  const list = pcDevices();
  return list.find(d => d.id === state.selectedDeviceId) || list.find(isOnline) || list[0] || null;
}
function logIssue(code, title, message, details = "") {
  const entry = { id: code, title, message, details, at: new Date().toISOString() };
  state.logs = [entry, ...state.logs].slice(0, 80);
  storageSet("myn-web-logs", JSON.stringify(state.logs));
  showToast(message);
  return message;
}
function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = String(message || "");
  toast.classList.add("show");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.classList.remove("show"), 3600);
}
function setTheme(theme) {
  state.theme = theme;
  storageSet("myn-theme", theme);
  document.body.classList.toggle("light-theme", theme === "light");
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === "light" ? "#f5f6fa" : "#0b0d14";
}
function pageTitle() {
  return ({
    home: "Ana sayfa", auth: state.authMode === "register" ? "Kayıt ol" : "Giriş yap",
    account: "Hesabım", devices: "Cihazlarım", settings: "Ayarlar",
    remote: "PC Kumandası", files: "PcFiles", diagnostics: "Hata kayıtları"
  })[state.page] || "MynAssistant";
}
function navigate(page) {
  if (!["home","auth","account","devices","settings","remote","files","diagnostics"].includes(page)) return;
  if (page !== "settings") stopDesktopQrScan();
  if (state.page === "remote" && page !== "remote") stopScreenPreview();
  state.page = page;
  state.drawerOpen = false;
  if (page === "remote") startScreenPreview();
  render();
  window.scrollTo({top:0, behavior:"smooth"});
}

function renderDrawer() {
  const activeLabel = ({home:"Ana sayfa",account:"Hesabım",devices:"Cihazlarım",settings:"Ayarlar",remote:"PC Kumandası",files:"PcFiles"})[state.page];
  const user = state.user;
  const nav = NAV.map(([id,label,ic]) => '<button class="nav-item ' + (activeLabel === label ? 'active' : '') + '" data-page="' + id + '">' + icon(ic) + '<span>' + label + '</span></button>').join("");
  const accountImage = user?.photoURL ? '<img class="avatar" src="' + esc(user.photoURL) + '" alt="Profil fotoğrafı" referrerpolicy="no-referrer">' : '<img class="avatar" src="./mynassistant-logo.webp" alt="MynAssistant logosu">';
  const accountSwitcher = state.accountListExpanded && user ? '<div class="account-switcher">' +
    '<p>Google hesabı</p>' +
    '<div class="account-current">' + accountImage + '<div><strong>' + esc(user.displayName || 'MynAssistant') + '</strong><span>' + esc(user.email || '') + '</span></div></div>' +
    '<p class="muted tiny">Başka bir Google hesabıyla devam etmek için hesap seçiciyi aç.</p>' +
    '<button class="button secondary full" data-action="google-login">Hesap değiştir</button>' +
    '<button class="link-button full-link" data-action="google-login">＋ Hesap ekle</button>' +
    '</div>' : '';
  return '<div class="drawer-backdrop ' + (state.drawerOpen ? '' : 'hidden') + '" data-action="drawer-close"></div>' +
    '<aside class="drawer ' + (state.drawerOpen ? 'open' : '') + '" aria-label="Uygulama menüsü">' +
    '<div class="drawer-account drawer-account-android">' + accountImage +
    '<div class="drawer-account-copy"><strong>' + esc(user?.displayName || (user?.email ? user.email.split('@')[0] : 'MynAssistant')) + '</strong><span>' + esc(user?.email || 'Giriş yap veya kayıt ol') + '</span></div>' +
    (user ? '<button class="account-chevron" data-action="account-list-toggle" aria-label="Hesap seçenekleri">' + (state.accountListExpanded ? '▲' : '▼') + '</button>' : '') +
    '</div>' + accountSwitcher + nav +
    '<button class="nav-item ' + (state.page === 'diagnostics' ? 'active' : '') + '" data-page="diagnostics">' + icon('alert') + '<span>Hata kayıtları</span></button>' +
    '<div class="drawer-footer">' + (user ? '<button class="button danger full" data-action="logout">Çıkış yap</button>' : '<button class="button full" data-page="auth">Giriş yap / Kayıt ol</button>') +
    '<p class="muted tiny" style="text-align:center;margin:12px 0 0">MynAssistant • Android 0.6.3 • Web</p></div></aside>';
}

function renderHeader() {
  const online = onlinePcDevices().length;
  return [
    '<header class="topbar myn-toolbar">',
    '<button class="icon-button toolbar-menu" data-action="drawer-open" aria-label="Menüyü aç">' + icon("menu") + '</button>',
    '<div class="topbar-spacer"></div>',
    '<button class="toolbar-remote" data-page="remote" aria-label="PC Kumandası">' + icon("remote") + '</button>',
    '<span class="header-online-dot ' + (online ? 'online' : '') + '" title="' + online + ' çevrimiçi Windows cihazı"></span>',
    '<button class="theme-pill" data-action="toggle-theme" aria-label="Temayı değiştir">' + icon(state.theme === "dark" ? "sun" : "moon") + '<span>' + (state.theme === "dark" ? 'Açık' : 'Koyu') + '</span></button>',
    '</header>'
  ].join("");
}

function renderHeading(title, subtitle = "") {
  return `<div class="page-heading"><div><h1>${esc(title)}</h1>${subtitle ? `<p>${esc(subtitle)}</p>` : ""}</div></div>`;
}
function renderDeviceCard(device, showActions = true) {
  const online = isOnline(device);
  const pc = !isAndroidDevice(device) && (String(device.connectionMode || "") === "firebase-agent" || /windows|pc/i.test(String(device.platform || device.os || "")));
  const chosen = state.selectedDeviceId === device.id;
  return `
    <article class="card device-card">
      <div class="device-top">
        <div class="device-icon">${icon(pc ? "monitor" : "devices")}</div>
        <div class="device-info">
          <strong>${esc(device.name || device.deviceName || "Windows bilgisayar")}</strong>
          <span>${esc(device.platform || device.type || device.os || "Cihaz")} • ${esc(device.connectionMode || "Cihaz bağlantısı")}</span>
        </div>
        <span class="pill ${online ? "success" : "warning"}"><span class="status-dot ${online ? "online" : ""}"></span>${online ? "Çevrimiçi" : "Çevrimdışı"}</span>
      </div>
      <div class="row between wrap">
        <span class="muted small">Son bağlantı: ${esc(fmtDate(device.lastSeenAt))}</span>
        ${chosen ? '<span class="pill success">Seçili cihaz</span>' : ""}
      </div>
      ${showActions ? `<div class="form-actions">
        <button class="button secondary small-button" data-action="select-device" data-id="${esc(device.id)}">Cihazı seç</button>
        <button class="button secondary small-button" data-action="rename-device" data-id="${esc(device.id)}">Adını düzenle</button>
        <button class="button small-button" data-page="remote" ${online && pc ? "" : "disabled"}>PC kumandası</button>
      </div>` : ""}
    </article>`;
}

function renderHome() {
  return '<section class="home-command-stage" aria-label="MynAssistant komut merkezi">' +
    '<div class="home-orbit-logo" aria-label="Dönen MynAssistant logosu">' +
      '<div class="home-logo-aura"></div>' +
      '<img class="home-logo-spin" src="./mynassistant-logo.webp?v=logo-rotor" alt="MynAssistant logosu" fetchpriority="high">' +
    '</div>' +
    '<div class="home-command-copy"><div class="eyebrow">KOMUT MERKEZİ</div>' +
      '<h1>Sana nasıl yardımcı olabilirim?</h1>' +
      '<p>Telefonuna veya bilgisayarına komut ver; hedefi sen seç veya otomatik yönlendirmeyi kullan.</p></div>' +
    (state.feedback ? '<p class="home-feedback" role="status">' + esc(state.feedback) + '</p>' : "") +
    '</section>';
}

function renderAuth() {
  if (state.user) return renderAccount();
  if (!state.firebaseReady) return `${renderHeading("Hesap bağlantısını etkinleştir", "Google ile giriş arayüzü hazır; Firebase Web uygulaması yapılandırması henüz tamamlanmadı.")}
    <section class="card">
      <div class="row"><img class="avatar" src="./mynassistant-logo.webp" alt="MynAssistant logosu"><div><h3>Google ile MynAssistant</h3><p>Android uygulamasıyla aynı Firebase projesine bağlanır.</p></div></div>
      <button class="button secondary full" disabled style="margin-top:14px">Google ile devam et · Kurulum bekleniyor</button>
      <p>Google girişini etkinleştirmek için Firebase Console'da <strong>myncloud-24</strong> projesine bir Web uygulaması kaydet ve Web SDK yapılandırmasını aşağıdaki dosyaya aktar.</p>
      <a class="button full" href="https://console.firebase.google.com/project/myncloud-24/settings/general" target="_blank" rel="noopener">Firebase Web uygulamasını yapılandır</a>
    </section>
    <div class="notice warning">Bu web sitesi Render yönetim sunucusuna bağlı değildir. Hesap ve cihaz kimliği Firebase Authentication; cihaz durumu ve komut kuyruğu Cloud Firestore üzerinden yürür.</div>`;
  const register = state.authMode === "register";
  return `
    ${renderHeading(register ? "MynAssistant hesabı oluştur" : "Tekrar hoş geldin", register ? "Hesabını oluştur ve cihazlarını bağla." : "Hesabına giriş yaparak devam et.")}
    <section class="card">
      <div class="notice" style="margin-bottom:14px">
        <strong>Android MynAssistant hesabın Google ile açıldıysa</strong><br>
        Aynı Google hesabıyla devam etmek için aşağıdaki düğmeyi kullan. E-posta/şifre girişi ayrı bir Firebase giriş yöntemidir.
      </div>
      <button class="button full" data-action="google-login" ${state.authBusy ? "disabled" : ""}>${icon("user")} ${state.authBusy ? "Google hesabı doğrulanıyor…" : "Google ile devam et"}</button>
      <div class="row" style="margin:17px 0"><span style="height:1px;background:var(--border);flex:1"></span><span class="muted tiny">E-POSTA / ŞİFRE ALTERNATİFİ</span><span style="height:1px;background:var(--border);flex:1"></span></div>
      <form id="auth-form" class="form-stack">
        ${register ? '<div class="field"><label for="auth-name">Ad soyad</label><input class="input" id="auth-name" name="name" autocomplete="name" maxlength="80" required></div>' : ""}
        <div class="field"><label for="auth-email">E-posta</label><input class="input" id="auth-email" name="email" type="email" autocomplete="email" maxlength="254" required></div>
        <div class="field"><label for="auth-password">Şifre</label><input class="input" id="auth-password" name="password" type="password" autocomplete="${register ? "new-password" : "current-password"}" minlength="8" maxlength="128" required></div>
        <button class="button secondary full" type="submit">${register ? "E-posta ile hesap oluştur" : "E-posta ve şifreyle giriş yap"}</button>
      </form>
      ${!register ? '<button class="link-button" type="button" data-action="reset-password" style="margin-top:8px">Şifremi unuttum</button>' : ""}
      <p class="muted small" style="margin-top:15px">${register ? "Zaten hesabın var mı?" : "Henüz hesabın yok mu?"} <button class="link-button" data-action="toggle-auth">${register ? "Giriş yap" : "Kayıt ol"}</button></p>
      ${state.feedback ? `<div class="notice" role="status">${esc(state.feedback)}</div>` : ""}
    </section>
    <div class="notice">Web sürümü, Android uygulamanla aynı Firebase hesabını kullanır. Giriş için Firebase Console'da web alan adının yetkili alan adları listesinde bulunması gerekir.</div>`;
}
function renderAccount() {
  if (!state.user) return renderAuth();
  const u = state.user;
  const googleLinked = !!u.providerData?.some(provider => provider.providerId === "google.com");
  const phone = u.phoneNumber || state.profile?.phoneNumber || "";
  const pendingPhone = state.profile?.pendingPhoneNumber || "";
  const phoneStatus = phone ? "Doğrulandı · " + phone : pendingPhone ? "Doğrulanmadı · " + pendingPhone : "Henüz belirtilmemiş";
  return `
    ${renderHeading("Hesabım","MynAssistant profil bilgilerin.")}
    <section class="card account-profile-card">
      <div class="account-profile-head">
        <img class="account-profile-photo" src="${esc(u.photoURL || "./mynassistant-logo.webp")}" alt="Profil fotoğrafı">
        <div class="account-profile-identity"><strong>${esc(u.displayName || u.email?.split("@")[0] || "MynAssistant kullanıcısı")}</strong><span>${esc(u.email || "")}</span>
        <button class="button ghost small-button" type="button" data-action="choose-profile-photo" ${state.profilePhotoBusy ? "disabled" : ""}>${icon("upload")} ${state.profilePhotoBusy ? "Fotoğraf yükleniyor…" : "Fotoğraf yükle"}</button></div>
      </div>
      <input type="file" id="profile-photo-input" accept="image/jpeg,image/png,image/webp" hidden>
      <form id="profile-form" class="form-stack account-form">
        <div class="field"><label for="profile-name">Kullanıcı adı</label><input class="input" id="profile-name" name="name" maxlength="80" value="${esc(u.displayName || "")}" required></div>
        <div class="account-divider"></div>
        <div class="account-status-row"><div class="account-status-copy"><strong>E-posta doğrulaması</strong><span>${u.emailVerified ? "E-posta adresi doğrulandı" : "E-posta adresi henüz doğrulanmadı"}</span></div><span class="pill ${u.emailVerified ? "success" : "warning"}">${u.emailVerified ? icon("check") : "Bekliyor"}</span></div>
        ${!u.emailVerified ? '<button class="button ghost full" type="button" data-action="verify-email">Doğrulama e-postası gönder</button>' : ""}
        <div class="field"><label for="profile-email">E-posta adresini değiştir</label><input class="input" id="profile-email" name="email" type="email" maxlength="254" placeholder="yeni@ornek.com"></div>
        <button class="button secondary full" type="submit" ${state.profileBusy ? "disabled" : ""}>${state.profileBusy ? "Kaydediliyor…" : "Profil bilgilerini kaydet"}</button>
      </form>
      <div class="account-divider"></div>
      <div class="account-status-row"><div class="account-status-copy"><strong>Google hesabı</strong><span>${googleLinked ? "Bağlandı" : "Bu hesaba Google sağlayıcısı bağlanmadı"}</span></div><span class="pill ${googleLinked ? "success" : "warning"}">${googleLinked ? icon("check") : "Bağlı değil"}</span></div>
      ${!googleLinked ? '<button class="button ghost full" type="button" data-action="link-google">Google hesabını bağla</button>' : ""}
      <div class="account-divider"></div>
      <div class="account-status-row"><div class="account-status-copy"><strong>Telefon numarası</strong><span class="${phone ? "text-success" : "text-warning"}">${esc(phoneStatus)}</span></div><button class="button ghost small-button" type="button" data-action="toggle-phone-form">${state.phoneEditOpen ? "Kapat" : phone || pendingPhone ? "Düzenle" : "Ekle"}</button></div>
      ${state.phoneEditOpen ? `<form id="phone-form" class="form-stack"><div class="field"><label for="profile-phone">Telefon numarası</label><input class="input" id="profile-phone" name="phone" inputmode="tel" autocomplete="tel" maxlength="22" placeholder="+90 5XX XXX XX XX" value="${esc(pendingPhone || phone)}" required></div><button class="button secondary full" type="submit">Telefon numarasını kaydet</button><p class="muted tiny">Android uygulamasındaki ücretsiz hesap modunda gerçek SMS gönderimi kapalıdır. Web sürümü de numarayı bekleyen/doğrulanmamış olarak saklar; SMS doğrulaması yapılmış gibi göstermez.</p></form>` : ""}
      ${state.profileMessage ? `<p class="pairing-status" role="status">${esc(state.profileMessage)}</p>` : ""}
      <div class="account-divider"></div>
      <button class="button ghost full" type="button" data-action="logout">Çıkış yap</button>
    </section>`;
}
function renderDevices() {
  if (!state.user) return `${renderHeading("Cihazlarım","Cihazlarını görmek için hesabına giriş yap.")}<section class="card"><button class="button full" data-page="auth">Giriş yap / Kayıt ol</button></section>`;
  const pcs = pcDevices();
  const androids = androidDevices();
  const androidCard = device => {
    const online = isOnline(device);
    const selected = state.commandTargetId === "ANDROID" && state.selectedAndroidDeviceId === device.id;
    return `<article class="card device-card">
      <div class="device-top"><div class="device-icon">${icon("devices")}</div><div class="device-info"><strong>${esc(deviceDisplayName(device))}</strong><span>Android • ${esc(device.connectionMode || "MynAssistant")}</span></div><span class="pill ${online ? "success" : "warning"}"><span class="status-dot ${online ? "online" : ""}"></span>${online ? "Çevrimiçi" : "Çevrimdışı"}</span></div>
      <div class="row between wrap"><span class="muted small">Son bağlantı: ${esc(fmtDate(device.lastSeenAt))}</span>${selected ? '<span class="pill success">Seçili hedef</span>' : ""}</div>
      <button class="button secondary full" data-action="select-android-device" data-id="${esc(device.id)}" ${online ? "" : "disabled"}>Komut hedefi olarak seç</button>
      </article>`;
  };
  return `${renderHeading("Cihazlarım","Bu MynAssistant hesabına bağlı Windows ve Android cihazları.")}
    <section class="row between"><span class="muted small">${pcs.length} Windows • ${androids.length} Android cihazı</span><button class="button secondary small-button" data-action="refresh-devices">${icon("refresh")} Yenile</button></section>
    ${state.devicesLoading ? '<div class="progress"><span></span></div>' : ""}
    ${state.devicesError ? `<div class="notice danger">${esc(state.devicesError)}</div>` : ""}
    <section class="device-group"><div class="section-heading"><h2>Windows cihazları</h2><span class="pill">${pcs.length}</span></div>
      ${pcs.length ? pcs.map(d=>renderDeviceCard(d)).join("") : '<div class="empty-state"><div class="empty-icon">' + icon("monitor") + '</div><strong>Henüz bilgisayar bağlanmamış</strong><p>Windows MynAssistant uygulamasında bu Google/Firebase hesabıyla oturum açtığında bilgisayarın burada görünür.</p></div>'}</section>
    <section class="device-group"><div class="section-heading"><h2>Android cihazları</h2><span class="pill">${androids.length}</span></div>
      ${androids.length ? androids.map(androidCard).join("") : '<div class="empty-state"><div class="empty-icon">' + icon("devices") + '</div><strong>Kayıtlı başka Android cihazı yok</strong><p>Android MynAssistant uygulamasında aynı hesapla oturum açan cihazlar burada görünür. Bu web tarayıcısı kendi Android kurulum kimliği yerine ayrı bir web oturumudur.</p></div>'}</section>
    <div class="notice">Cihaz listesi Firestore ownerId alanı ile yalnızca oturum açan kullanıcıya göre filtrelenir. Çevrimiçi durumu son 3 dakikadaki heartbeat ile belirlenir.</div>`;
}

function renderRemoteScreenContent(device) {
  if (!device?.screenJpegBase64) {
    return '<div class="empty-state"><div class="empty-icon">' + icon("monitor") +
      '</div><strong>Ekran görüntüsü bekleniyor</strong><p>Önizleme Windows Agent çalışırken ve bu sayfa açıkken alınır.</p></div>';
  }
  return '<img class="screen-preview" alt="Windows masaüstü önizlemesi" src="data:image/jpeg;base64,' +
    esc(device.screenJpegBase64) + '">';
}
function renderRemote() {
  const device = currentDevice();
  const online = !!device && isOnline(device) && device.connectionMode === "firebase-agent";
  const controlsEnabled = online && !!state.user && !state.busy;
  const buttons = [
    ["lock_pc","Kilitle","key",false],
    ["close_app","Uygulamayı kapat","close",false],
    ["mute","Sesi kapat","mute",true],
    ["volume_up","Sesi artır","volume",true],
    ["home","Ana sayfa","home",true],
    ["volume_down","Sesi kıs","volume",true]
  ];
  const remoteButton = ([command,label,ic,supported]) => `<button class="remote-control" data-command="${command}" ${controlsEnabled && supported ? "" : "disabled"} title="${supported ? label : "Bu Windows Agent sürümünde desteklenmiyor"}">${icon(ic)}<span>${label}</span>${!supported ? '<small class="remote-unsupported">Agent desteği yok</small>' : ""}</button>`;
  return `${renderHeading("PC Kumandası","Windows bilgisayarını uzaktan yönet.")}
    <div class="remote-toolbar">
      <button class="remote-tool ${state.remoteScreenEnabled ? "active" : ""}" data-action="toggle-screen" aria-pressed="${state.remoteScreenEnabled}" title="Ekran önizlemesi">${icon("monitor")}</button>
      <button class="remote-tool ${state.remoteTouchpadEnabled ? "active" : ""}" data-action="toggle-remote-touchpad" aria-pressed="${state.remoteTouchpadEnabled}" title="Touchpad">${icon("touchpad")}</button>
      <button class="remote-tool ${state.remoteKeyboardEnabled ? "active" : ""}" data-action="toggle-remote-keyboard" aria-pressed="${state.remoteKeyboardEnabled}" title="Klavye">${icon("keyboard")}</button>
    </div>
    ${!state.user ? '<div class="notice">PC Kumandası arayüzünü görüntüleyebilirsin. Bulut üzerinden kendi Windows cihazını seçmek ve komut göndermek için MynAssistant hesabında oturum aç.</div>' : ""}
    <section class="card compact remote-device-card">
      <div class="row"><div class="device-icon">${icon("monitor")}</div><div class="device-info"><strong>${esc(deviceDisplayName(device) || "Windows bilgisayar")}</strong><span>${online ? "Windows • Çevrimiçi" : "Bu hesaba bağlı bilgisayar bekleniyor veya çevrimdışı"}</span></div><span class="status-dot ${online ? "online" : ""}"></span></div>
      <div class="form-actions" style="margin-top:12px"><button class="button secondary full" data-page="devices">Cihaz listesine dön</button></div>
    </section>
    ${state.remoteScreenEnabled ? `<section class="section-stack"><div class="section-heading"><h3>Windows masaüstü</h3><span class="muted tiny">Sayfa açıkken güncellenir</span></div><div id="remote-screen-content">${renderRemoteScreenContent(device)}</div></section>` : ""}
    <section class="section-stack"><h3 class="remote-section-title">PC KUMANDASI</h3><div class="card remote-grid-card"><div class="remote-grid">${buttons.map(remoteButton).join("")}</div></div></section>
    ${!state.remoteTouchpadEnabled ? "" : `<section class="section-stack"><div class="section-heading"><h3>Touchpad</h3><span class="muted tiny">Sürükle: hareket • Dokun: sol tık • Basılı tut: sağ tık</span></div><div class="touchpad ${online ? "" : "disabled"}" id="touchpad" aria-label="Bilgisayar touchpad alanı"><span class="touchpad-label">Touchpad</span>${!online ? '<span class="touchpad-offline">Windows bilgisayar bekleniyor</span>' : ""}</div></section>`}
    ${!state.remoteKeyboardEnabled ? "" : `<section class="card compact"><h3>Klavye</h3><div class="remote-keyboard-row" style="margin-top:12px"><input class="input" id="remote-keyboard-input" maxlength="1000" placeholder="Bilgisayara yaz…" ${controlsEnabled ? "" : "disabled"}><button class="icon-button" data-action="remote-backspace" title="Backspace" ${controlsEnabled ? "" : "disabled"}>${icon("close")}</button><button class="button" data-action="remote-type-enter" ${controlsEnabled ? "" : "disabled"}>Enter</button></div><p class="muted tiny">Metin Windows bilgisayarında seçili alana yazılır. En fazla 1.000 karakter.</p></section>`}
    ${!online ? '<div class="notice warning">Windows Agent çevrimiçi olduğunda kumanda etkinleşir. Aynı Firebase hesabı kullanılmalı ve son 3 dakika içinde heartbeat gelmelidir.</div>' : ""}
    <div class="notice">Not: Kilitle ve Uygulamayı kapat düğmeleri Android kumanda düzeniyle eşleştirildi; bu Windows Agent sürümünde karşılık gelen komutlar desteklenmediği için güvenlik amacıyla devre dışıdır.</div>`;
}

function renderFiles() {
  if (!state.user) return `${renderHeading("PcFiles","Bilgisayar dosyalarını görmek için giriş yap.")}<section class="card"><button class="button full" data-page="auth">Giriş yap / Kayıt ol</button></section>`;
  const device = pcDevices().find(d=>d.id===state.filesDeviceId) || currentDevice();
  const online = !!device && isOnline(device) && device.connectionMode === "firebase-agent";
  const listing = state.fileListing;
  return `
    ${renderHeading("PcFiles","Bağlı Windows bilgisayarındaki izin verilen klasörler.")}
    <section class="card compact">
      <div class="field"><label for="files-device">Windows bilgisayar</label><select class="select" id="files-device">${pcDevices().map(d=>`<option value="${esc(d.id)}" ${device?.id===d.id?"selected":""}>${esc(d.name||"Windows bilgisayar")} • ${isOnline(d)?"Çevrimiçi":"Çevrimdışı"}</option>`).join("")}</select></div>
      <button class="button full" data-action="files-list-root" style="margin-top:12px" ${online?"":"disabled"}>${state.filesLoading?"Dosya listesi alınıyor…":"Dosya listesini iste"}</button>
    </section>
    ${state.filesLoading ? '<div class="progress"><span></span></div>' : ""}
    ${listing ? `
      <section class="card">
        <div class="section-heading"><h3>Bilgisayar dosyaları</h3><span class="pill">${listing.entries?.length || 0} öğe</span></div>
        <p class="small muted" style="overflow-wrap:anywhere">${esc(listing.currentPath || "İzin verilen klasörler")}</p>
        <div class="form-actions" style="margin:10px 0">
          <button class="button secondary small-button" data-action="files-parent" ${listing.parentPath == null?"disabled":""}>Üst klasör</button>
          <button class="button secondary small-button" data-action="files-refresh" ${online?"":"disabled"}>${icon("refresh")} Yenile</button>
          <button class="button secondary small-button" data-action="files-upload" ${online?"":"disabled"}>${icon("upload")} Dosya yükle</button>
          <input type="file" id="files-upload-input" class="hidden">
        </div>
        <div class="file-list">
          ${(listing.entries || []).map((entry,index)=>`
            <div class="file-row">
              <div class="device-icon" style="width:36px;height:36px;border-radius:11px">${icon(entry.isDirectory?"folder":"download")}</div>
              <div class="file-name"><strong>${esc(entry.name)}</strong><span>${entry.isDirectory?"Klasör":formatBytes(entry.size)} • ${esc(fmtDate(entry.modifiedUtc))}</span></div>
              ${entry.isDirectory ? `<button class="file-action" data-action="files-open" data-index="${index}" aria-label="Klasörü aç">${icon("back")}</button><button class="file-action" data-action="files-zip" data-index="${index}" aria-label="ZIP oluştur">${icon("zip")}</button>` : `<button class="file-action" data-action="files-download" data-index="${index}" aria-label="Dosyayı indir" ${entry.size<=MAX_TRANSFER_BYTES?"":"disabled"}>${icon("download")}</button>`}
            </div>`).join("") || '<div class="empty-state"><strong>Bu klasör boş</strong><p>Gösterilecek öğe bulunamadı.</p></div>'}
        </div>
        ${listing.truncated ? '<p class="text-warning small">İlk 200 öğe gösteriliyor; klasör çok büyük.</p>' : ""}
        ${(listing.warnings || []).map(w=>`<p class="text-warning small">${esc(w)}</p>`).join("")}
      </section>
      <div class="notice">Güvenlik: yalnızca Windows Agent tarafından izin verilen kullanıcı klasörleri listelenir. Yükleme/indirme 500.000 bayt ile sınırlıdır ve SHA-256 doğrulaması yapılır.</div>
    ` : ""}
    ${!online ? '<div class="notice warning">PcFiles için çevrimiçi firebase-agent bağlantısı gerekir. Yerel/legacy bağlantılar web dosya protokolünü desteklemez.</div>' : ""}
  `;
}
function formatBytes(value) {
  const n = Number(value) || 0;
  if (n < 1024) return n + " B";
  if (n < 1024*1024) return (n/1024).toFixed(1) + " KB";
  return (n/(1024*1024)).toFixed(2) + " MB";
}

function stopDesktopQrScan() {
  state.pairingScannerActive = false;
  if (state.pairingScanFrame) cancelAnimationFrame(state.pairingScanFrame);
  state.pairingScanFrame = null;
  if (state.pairingStream) { state.pairingStream.getTracks().forEach(track => track.stop()); state.pairingStream = null; }
}
function parseDesktopPairingQr(rawValue) {
  const parts = String(rawValue || "").trim().split(":",4);
  if (parts.length !== 4 || parts[0].toUpperCase() !== "MYNASSISTANT-PAIR") return null;
  const code = parts[1].replace(/[^A-Za-z0-9]/g,"").toUpperCase();
  const codeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const expiresAtUnix = Number(parts[2]);
  const signature = parts[3];
  if (code.length !== 10 || [...code].some(ch => !codeAlphabet.includes(ch))) return null;
  if (!Number.isSafeInteger(expiresAtUnix) || expiresAtUnix <= Math.floor(Date.now()/1000)) return null;
  if (!/^[A-Za-z0-9_-]{43}$/.test(signature)) return null;
  return {code, expiresAtUnix, signature};
}
async function startDesktopQrScan() {
  if (!state.user) { state.pairingStatus = "QR eşleştirmesi için önce MynAssistant hesabına giriş yap."; render(); return; }
  if (!navigator.mediaDevices?.getUserMedia) { state.pairingStatus = "Bu tarayıcı kamera erişimini desteklemiyor. 10 karakterli kodu elle girebilirsin."; render(); return; }
  if (!("BarcodeDetector" in window)) { state.pairingStatus = "Bu tarayıcı yerel QR algılamayı desteklemiyor. 10 karakterli kodu elle gir."; render(); return; }
  try {
    stopDesktopQrScan();
    state.pairingStream = await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:false});
    state.pairingScannerActive = true;
    state.pairingStatus = "Windows uygulamasındaki MynAssistant QR kodunu kameraya göster.";
    render();
    const video = document.getElementById("pairing-camera-video");
    if (!video) throw new Error("QR kamera alanı oluşturulamadı.");
    video.srcObject = state.pairingStream;
    await video.play();
    const detector = new BarcodeDetector({formats:["qr_code"]});
    const scanFrame = async () => {
      if (!state.pairingScannerActive || !video.isConnected) return;
      try {
        const codes = await detector.detect(video);
        const value = codes[0]?.rawValue;
        if (value) {
          const parsed = parseDesktopPairingQr(value);
          if (parsed) {
            state.pairingCode = parsed.code;
            state.pairingQrSignature = parsed.signature;
            state.pairingQrExpiresAtUnix = parsed.expiresAtUnix;
            state.pairingStatus = "QR kodu okundu. Bilgisayarı hesabına bağlamak için onayı tamamla.";
            stopDesktopQrScan(); render(); return;
          }
          state.pairingStatus = "QR kod biçimi geçersiz veya süresi dolmuş. Windows uygulamasından yeni QR kodu al.";
          render();
        }
      } catch(error) {
        state.pairingStatus = "QR kodu okunamadı: " + (error?.message || "kamera hatası");
        stopDesktopQrScan(); render(); return;
      }
      state.pairingScanFrame = requestAnimationFrame(scanFrame);
    };
    state.pairingScanFrame = requestAnimationFrame(scanFrame);
  } catch(error) {
    stopDesktopQrScan();
    state.pairingStatus = error?.name === "NotAllowedError" ? "Kamera izni reddedildi. Tarayıcı ayarlarından kamera izni ver veya kodu elle gir." : error?.message || "QR tarayıcı başlatılamadı.";
    render();
  }
}
async function approveDesktopPairing() {
  if (!state.user) throw new Error("Windows bilgisayarını eşleştirmek için MynAssistant hesabına giriş yap.");
  if (state.pairingBusy) return;
  const code = String(state.pairingCode || "").replace(/[^A-Za-z0-9]/g,"").toUpperCase();
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  if (code.length !== 10 || [...code].some(ch => !alphabet.includes(ch))) {
    state.pairingStatus = "Windows uygulamasında gösterilen 10 karakterli kodu gir.";
    render(); return;
  }
  const hasSignature = !!state.pairingQrSignature;
  if (hasSignature !== !!state.pairingQrExpiresAtUnix) { state.pairingStatus = "QR imza bilgisi eksik. QR kodunu yeniden tara veya kodu elle gir."; render(); return; }
  if (hasSignature && state.pairingQrExpiresAtUnix <= Math.floor(Date.now()/1000)) { state.pairingStatus = "QR kodunun süresi doldu. Windows uygulamasından yeni kod al."; state.pairingQrSignature = ""; state.pairingQrExpiresAtUnix = 0; render(); return; }
  state.pairingBusy = true; state.pairingStatus = "Telefon hesabı doğrulanıyor…"; render();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const token = await state.user.getIdToken(false);
    if (!token) throw new Error("Firebase oturumu doğrulanamadı. Yeniden giriş yap.");
    const payload = {code};
    if (hasSignature) { payload.qrSignature = state.pairingQrSignature; payload.qrExpiresAtUnix = state.pairingQrExpiresAtUnix; }
    const response = await fetch("https://mynassistant-server.onrender.com/api/v1/desktop/pairing/approve",{
      method:"POST", signal:controller.signal, headers:{Accept:"application/json","Content-Type":"application/json",Authorization:"Bearer "+token}, body:JSON.stringify(payload)
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = body.detail || body.message || body.title;
      throw new Error(detail || (response.status === 503 ? "Eşleştirme servisi henüz yapılandırılmadı." : "Eşleştirme onaylanamadı (HTTP "+response.status+")."));
    }
    state.pairingStatus = (body.message || "Bilgisayar hesabınla eşleştirildi.") + (body.machineName ? " Bilgisayar: "+body.machineName+"." : "");
    state.pairingCode = ""; state.pairingQrSignature = ""; state.pairingQrExpiresAtUnix = 0;
    showToast(state.pairingStatus);
    subscribeDevices();
  } catch(error) {
    const message = error?.name === "AbortError" ? "Eşleştirme sunucusu zamanında yanıt vermedi. Tekrar dene." : error?.message || "Eşleştirme isteği tamamlanamadı.";
    state.pairingStatus = message;
    logIssue("MYN-WEB-PAIR-001","Windows eşleştirme",message,error?.name || "");
  } finally {
    clearTimeout(timeout); state.pairingBusy = false; render();
  }
}
async function postAccountApi(path, payload = null) {
  if (!state.user) throw new Error("Hesap oturumu gerekli.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const token = await state.user.getIdToken(false);
    const response = await fetch("https://mynassistant-server.onrender.com"+path,{
      method:"POST", signal:controller.signal,
      headers:{Accept:"application/json",Authorization:"Bearer "+token,...(payload ? {"Content-Type":"application/json"} : {})},
      ...(payload ? {body:JSON.stringify(payload)} : {})
    });
    const body = await response.json().catch(()=>({}));
    if (!response.ok) throw new Error(body.detail || body.title || "Hesap işlemi tamamlanamadı (HTTP "+response.status+").");
    return body;
  } catch(error) {
    if (error?.name === "AbortError") throw new Error("Hesap sunucusu zamanında yanıt vermedi. Tekrar dene.");
    throw error;
  } finally { clearTimeout(timeout); }
}
async function sendAccountVerificationEmail() {
  if (!state.user) throw new Error("Oturum gerekli.");
  await postAccountApi("/api/v1/account/email/verification");
  state.profileMessage = "E-posta doğrulama bağlantısı gönderim için kabul edildi. Gelen kutunu ve spam klasörünü kontrol et.";
  render();
}

async function savePendingPhoneNumber(rawNumber) {
  if (!state.user) throw new Error("Telefon numarası kaydetmek için giriş yap.");
  const number = String(rawNumber || "").trim();
  let normalized = number.replace(/[\s()-]/g,"");
  if (/^0?5\d{9}$/.test(normalized)) normalized = "+90" + normalized.replace(/^0/,"");
  else if (/^905\d{9}$/.test(normalized)) normalized = "+" + normalized;
  if (!/^\+[1-9]\d{7,14}$/.test(normalized)) throw new Error("Telefon numarasını ülke koduyla gir. Örnek: +905XXXXXXXXX.");
  await setDoc(doc(db,"users",state.user.uid),{pendingPhoneNumber:normalized,pendingPhoneVerified:false,updatedAt:serverTimestamp()},{merge:true});
  state.profile = {...(state.profile || {}),pendingPhoneNumber:normalized,pendingPhoneVerified:false};
  state.profileMessage = "Telefon numarası kaydedildi ancak henüz doğrulanmadı. Android uygulamasındaki mevcut ücretsiz mod gerçek SMS göndermediği için bu web ekranı da SMS göndermez.";
  render();
}
async function linkGoogleAccount() {
  if (!state.user) throw new Error("Önce MynAssistant hesabına giriş yap.");
  const provider = new GoogleAuthProvider(); provider.setCustomParameters({prompt:"select_account",hl:"tr"});
  await linkWithPopup(state.user,provider);
  await reload(state.user); state.user = auth.currentUser;
  state.profileMessage = "Google hesabı MynAssistant hesabına bağlandı.";
  render();
}
async function uploadProfilePhoto(file) {
  if (!state.user) throw new Error("Profil fotoğrafı yüklemek için giriş yap.");
  if (!(file instanceof File) || !["image/jpeg","image/png","image/webp"].includes(file.type)) throw new Error("JPG, PNG veya WebP türünde bir fotoğraf seç.");
  if (file.size > 5*1024*1024) throw new Error("Profil fotoğrafı en fazla 5 MB olabilir.");
  state.profilePhotoBusy = true; state.profileMessage = "Profil fotoğrafı hazırlanıyor…"; render();
  try {
    const token = await state.user.getIdToken(true);
    const signed = await fetch("https://mynassistant-server.onrender.com/api/v1/account/profile-photo/sign",{method:"POST",headers:{Accept:"application/json",Authorization:"Bearer "+token}});
    const signature = await signed.json().catch(()=>({}));
    if (!signed.ok) throw new Error(signature.detail || signature.title || "Profil fotoğrafı servisi hazır değil.");
    const form = new FormData(); form.append("file",file); form.append("api_key",signature.apiKey); form.append("timestamp",String(signature.timestamp)); form.append("public_id",signature.publicId); form.append("overwrite",signature.overwrite ? "true" : "false"); form.append("signature",signature.signature);
    const uploaded = await fetch("https://api.cloudinary.com/v1_1/"+encodeURIComponent(signature.cloudName)+"/image/upload",{method:"POST",body:form});
    const result = await uploaded.json().catch(()=>({}));
    if (!uploaded.ok || typeof result.secure_url !== "string") throw new Error(result.error?.message || "Fotoğraf yüklenemedi.");
    const url = new URL(result.secure_url);
    if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") throw new Error("Fotoğraf adresi güvenlik kontrolünden geçmedi.");
    await updateProfile(state.user,{photoURL:url.href});
    await setDoc(doc(db,"users",state.user.uid),{photoUrl:url.href,updatedAt:serverTimestamp()},{merge:true});
    await reload(state.user); state.user = auth.currentUser;
    state.profileMessage = "Profil fotoğrafın güncellendi.";
  } catch(error) {
    state.profileMessage = error?.message || "Profil fotoğrafı yüklenemedi.";
    logIssue("MYN-WEB-PROFILE-003","Profil fotoğrafı",state.profileMessage,error?.code || "");
  } finally { state.profilePhotoBusy = false; render(); }
}

function renderDesktopPairingCard() {
  return `<section class="card pairing-card">
    <div class="row"><div class="device-icon">${icon("monitor")}</div><div class="device-info"><strong>Windows bilgisayarını eşleştir</strong><span>Windows uygulamasındaki tek kullanımlık kodla</span></div></div>
    <p>Windows uygulamasında gösterilen 10 karakterli eşleştirme kodunu gir veya QR kodunu tara. Kod 5 dakika içinde sona erer.</p>
    <form id="desktop-pairing-form" class="form-stack" style="margin-top:14px">
      <div class="field"><label for="desktop-pairing-code">Windows eşleştirme kodu</label><input class="input pairing-code-input" id="desktop-pairing-code" name="code" maxlength="10" autocomplete="off" autocapitalize="characters" placeholder="ABCDE23456" value="${esc(state.pairingCode)}" ${state.pairingBusy ? "disabled" : ""}></div>
      <p class="muted tiny">Yalnızca kod girilir; telefon hesabının oturum anahtarları paylaşılmaz.</p>
      <button class="button ghost full" type="button" data-action="scan-desktop-qr" ${state.pairingBusy || state.pairingScannerActive ? "disabled" : ""}>${icon("devices")} QR kodunu tara</button>
      ${state.pairingScannerActive ? '<div class="pairing-camera-wrap"><video id="pairing-camera-video" autoplay playsinline muted></video><button class="button ghost full" type="button" data-action="stop-desktop-qr">Taramayı kapat</button></div>' : ""}
      <button class="button full" type="submit" ${state.pairingBusy || !state.user ? "disabled" : ""}>${state.pairingBusy ? "Bilgisayar bağlanıyor…" : "Bilgisayarı bağla"}</button>
    </form>
    <p class="pairing-status" role="status">${esc(state.pairingStatus)}</p>
    ${!state.user ? '<button class="button secondary full" data-page="auth">Giriş yap / Kayıt ol</button>' : ""}
    <p class="muted tiny">Onay Firebase ID token ile yapılır. Yönetici paneli parolası ve sunucu servis anahtarları web tarayıcısına gönderilmez.</p>
  </section>`;
}

function renderSettings() {
  const tab = state.settingsTab;
  let body = "";
  if (tab === "Genel") {
    body = `
      <section class="card">
        <div class="row between"><div><h3>Görünüm</h3><p>Tema tercihi bu tarayıcıda saklanır.</p></div><button class="button secondary" data-action="toggle-theme">${icon(state.theme==="dark"?"sun":"moon")} ${state.theme==="dark"?"Açık tema":"Koyu tema"}</button></div>
      </section>
      <section class="card compact"><h3>Uygulama bilgileri</h3><p>MynAssistant Web ${APP_VERSION}</p><p class="muted tiny">Android uygulaması: 0.6.3 • Web ayrı bir istemci uygulamasıdır.</p></section>`;
  } else if (tab === "Agent") {
    const online = onlinePcDevices();
    body = `<section class="card">
      <h3>Windows Agent</h3>
      <p>Windows uygulamasındaki Agent hesabınla aynı Firebase UID üzerinden bağlanır. Son 3 dakika içinde heartbeat gönderen bilgisayarlar çevrimiçi görünür.</p>
      <div class="row between" style="margin-top:15px"><strong>Bağlantı durumu</strong><span class="pill ${online.length?"success":"warning"}">${online.length?"Çevrimiçi":"Bilgisayar bekleniyor"}</span></div>
      <p>${online.length ? online.map(d=>esc(deviceDisplayName(d))).join(", ") : "Bu hesaba ait çevrimiçi Windows Agent bulunamadı."}</p>
      <button class="button secondary full" data-page="devices" style="margin-top:12px">Cihazlarımı gör</button>
      <button class="button ghost full" data-action="refresh-devices" style="margin-top:8px">Bağlantıyı yenile</button>
    </section>
    <section class="card"><h3>Bağlantı çalışma biçimi</h3><p>Komutlar mevcut Firebase cihaz/komut kuyruğu üzerinden gönderilir. Yönetici API’si bu kullanıcı bağlantısının yerine geçmez.</p></section>`;
  } else if (tab === "Hesap") {
    body = `<section class="card">
      <p class="muted small">Oturum bu cihazda hatırlanıyor.</p>
      ${renderDesktopPairingCard()}
      <button class="button ghost full" data-page="${state.user?"account":"auth"}">${icon("user")} Hesap ve profil ayarları</button>
    </section>`;
  } else if (tab === "İzinler") {
    body = `
      <p class="muted small">İzin durumları tarayıcıda geçerlidir. Android'e ait sistem izinleri web sayfasından yönetilemez.</p>
      <div class="permission-row"><div class="row between"><strong>Mikrofon</strong><span class="pill" id="permission-microphone">Henüz sorulmadı</span></div><p>Yalnızca sen sesli komut başlattığında ve bu sekme açıkken kullanılır.</p><button class="button secondary small-button" data-action="request-microphone">Mikrofon iznini dene</button></div>
      <div class="permission-row"><div class="row between"><strong>Bildirimler</strong><span class="pill" id="permission-notifications">${"Notification" in window?Notification.permission:"Desteklenmiyor"}</span></div><p>İşlem durumu bildirimleri için isteğe bağlıdır.</p><button class="button secondary small-button" data-action="request-notifications">Bildirim izni iste</button></div>
      <div class="permission-row"><div class="row between"><strong>Kamera</strong><span class="pill" id="permission-camera">Henüz sorulmadı</span></div><p>Web sürümünde şu an kamera gerektiren etkin bir özellik yoktur.</p><button class="button secondary small-button" data-action="request-camera">Kamera iznini dene</button></div>
      ${["Diğer uygulamaların üzerinde gösterme","Arka plan mikrofon servisi","Erişilebilirlik hizmeti","Telefon araması","Android kişiler","Tüm cihaz depolaması"].map(t=>`<div class="permission-row"><div class="row between"><strong>${t}</strong><span class="pill warning">Web'de kullanılamaz</span></div><p>Bu özellik Android uygulamasının işletim sistemi API'sine bağlıdır.</p></div>`).join("")}`;
  } else if (tab === "Eklentiler") {
    body = `
      <section class="card"><h3>WhatsApp otomatik işlemleri</h3><p>Android sürümünde kullanıcı tarafından ayrıca etkinleştirilen erişilebilirlik hizmeti kullanılır. Web sayfası başka uygulamaların arayüzüne müdahale edemez.</p><span class="pill warning">Android'e özel</span></section>
      <section class="card"><h3>Sesli komut</h3><p>Tarayıcı destekliyorsa Web Speech API üzerinden kullanıcı başlatmalı ses tanıma kullanılabilir.</p><button class="button secondary full" data-action="speech-start">${icon("mic")} Sesli komutu başlat</button></section>`;
  } else if (tab === "Başlangıç") {
    body = `
      <section class="card">
        <div class="row"><div class="device-icon">${icon("mic")}</div><div class="device-info"><strong>Hey Meyene</strong><span>Web Speech API • kullanıcı başlatmalı</span></div><span class="pill warning">Sürekli dinleme yok</span></div>
        <p>Tarayıcı, kullanıcının açıkça başlattığı tek seferlik ses tanıma oturumunu destekleyebilir. Android'deki çevrimdışı uyandırma motoru, kalıcı mikrofon servisi ve yüzen panel web sayfasına taşınamaz.</p>
        <button class="button full" data-action="speech-start" style="margin-top:14px">${icon("mic")} Dinlemeyi başlat</button>
      </section>
      <div class="notice warning">Tarayıcı veya işletim sistemi sekme arka plana alındığında mikrofonu durdurabilir. Bu özellik Android'deki “Hey Meyene” ile eşdeğer değildir.</div>`;
  } else if (tab === "Hata günlükleri") {
    body = `<section class="card compact"><div class="row between"><div><h3>Web hata günlükleri</h3><p>Son 80 kayıt bu tarayıcıda saklanır.</p></div><button class="button danger small-button" data-action="clear-logs">Temizle</button></div></section>
      ${state.logs.length ? state.logs.map(l=>`<div class="log-row"><strong>${esc(l.id)} • ${esc(l.title)}</strong><span>${esc(fmtDate(l.at))}</span><p>${esc(l.message)}</p>${l.details?`<p>${esc(l.details)}</p>`:""}</div>`).join("") : '<div class="empty-state"><div class="empty-icon">' + icon("check") + '</div><strong>Henüz hata kaydı yok</strong><p>Web sürümünde oluşan hatalar burada listelenir.</p></div>'}
      <button class="button secondary full" data-action="export-logs">Hata kayıtlarını JSON indir</button>`;
  }
  return `
    ${renderHeading("Ayarlar","MynAssistant tercihlerini yönet.")}
    <nav class="settings-tabs" aria-label="Ayarlar kategorileri">${SETTINGS_TABS.map(t=>`<button class="tab ${tab===t?"active":""}" data-tab="${esc(t)}">${esc(t)}</button>`).join("")}</nav>
    <div class="section-stack">${body}</div>`;
}
function renderDiagnostics() {
  return `
    ${renderHeading("Hata kayıtları","Bu tarayıcıda son 80 web hatası saklanır.")}
    <div class="row between"><span class="muted small">${state.logs.length} kayıt</span><button class="button danger small-button" data-action="clear-logs">Kayıtları temizle</button></div>
    ${state.logs.length ? state.logs.map(l=>`<div class="log-row"><strong>${esc(l.id)} • ${esc(l.title)}</strong><span>${esc(fmtDate(l.at))}</span><p>${esc(l.message)}</p>${l.details?`<p>${esc(l.details)}</p>`:""}</div>`).join("") : '<div class="empty-state"><div class="empty-icon">' + icon("check") + '</div><strong>Henüz hata kaydı yok.</strong></div>'}
    <button class="button secondary full" data-action="export-logs">Kayıtları JSON indir</button>`;
}

function renderComposer() {
  if (state.page !== "home") return "";
  const pc = currentDevice();
  const selectedAndroid = androidDevices().find(device => device.id === state.selectedAndroidDeviceId);
  const targetDescription = state.commandTargetId === "PC" ? (pc ? deviceDisplayName(pc) : "Windows bilgisayar bekleniyor") :
    state.commandTargetId === "ANDROID" ? (selectedAndroid ? deviceDisplayName(selectedAndroid) : "Android cihaz seçilmedi") :
    state.commandTargetId === "PHONE" ? "Bu telefon (Android)" : "Komuta göre telefon veya kullanılabilir bilgisayar";
  return '<div class="composer-wrap"><form class="composer android-composer" id="command-form">' +
    '<div class="composer-top"><button type="button" class="composer-target" data-action="open-target-picker">' + icon("plus") + '<span>' + esc(commandTargetLabel()) + '</span><span class="target-chevron">⌄</span></button><span class="muted tiny composer-target-description">' + esc(targetDescription) + '</span></div>' +
    '<div class="composer-input-row"><input class="composer-input" id="command-input" maxlength="1000" autocomplete="off" placeholder="Komut yaz…" value="' + esc(state.commandText) + '" ' + (state.busy ? "disabled" : "") + '>' +
    '<button type="button" class="round-action" data-action="speech-start" title="Sesli komut" ' + (("SpeechRecognition" in window || "webkitSpeechRecognition" in window) ? "" : "disabled") + '>' + icon("mic") + '</button>' +
    '<button type="submit" class="round-action primary" aria-label="Komutu gönder" ' + (state.busy ? "disabled" : "") + '>' + icon("send") + '</button></div>' +
    '</form>' +
    (!state.user ? '<p class="muted tiny" style="text-align:center;margin:7px 0 0">Bulut cihazlarına komut göndermek için MynAssistant hesabına giriş yap.</p>' : "") +
    (state.feedback ? '<p class="muted tiny" role="status" style="text-align:center;margin:7px 0 0">' + esc(state.feedback) + '</p>' : "") +
    '</div>';
}

function renderTargetDialog() {
  if (!state.targetDialogOpen) return "";
  const selected = state.commandTargetId;
  const choose = (id, deviceId = "") => '<button class="target-option ' + (selected === id && (!deviceId || deviceId === state.selectedDeviceId || deviceId === state.selectedAndroidDeviceId) ? 'selected' : '') + '" data-target="' + id + '" data-target-id="' + esc(deviceId) + '">' +
    '<span class="target-option-icon">' + icon(id === "PC" ? "monitor" : id === "ANDROID" || id === "PHONE" ? "devices" : "settings") + '</span><span class="target-option-copy"><strong>' +
    esc(id === "AUTO" ? "Otomatik hedef" : id === "PHONE" ? (isAndroidBrowser() ? "Bu telefon (Android)" : "Bu cihaz (Web)") : deviceId ? esc(deviceDisplayName((id === "PC" ? pcDevices() : androidDevices()).find(d => d.id === deviceId))) : (id === "PC" ? "Windows bilgisayar" : "Android cihaz")) +
    '</strong><small>' + (id === "AUTO" ? 'Komuta göre telefon veya kullanılabilir bilgisayar' : id === "PHONE" ? 'Bu tarayıcı Android sistem komutlarını doğrudan çalıştıramaz' : deviceId ? ((isOnline((id === "PC" ? pcDevices() : androidDevices()).find(d => d.id === deviceId))) ? (id === "PC" ? 'Windows · Çevrimiçi' : 'Android · Çevrimiçi') : (id === "PC" ? 'Windows · Çevrimdışı' : 'Android · Çevrimdışı')) : 'Cihaz seçimi') + '</small></span>' +
    '<span class="target-check">' + (selected === id && (!deviceId || deviceId === state.selectedDeviceId || deviceId === state.selectedAndroidDeviceId) ? icon("check") : '') + '</span></button>';
  const windows = pcDevices();
  const androids = androidDevices();
  const windowsBody = !state.user ? '<div class="target-empty">Windows cihazlarını görmek için giriş yap.</div>' : state.devicesLoading ? '<div class="target-empty">Cihazlar yükleniyor…</div>' : state.devicesError ? '<div class="target-empty">' + esc(state.devicesError) + ' <button class="link-button" data-action="refresh-devices">Yeniden dene</button></div>' : windows.length ? windows.map(d => choose("PC", d.id)).join("") : '<div class="target-empty">Bu hesapta kayıtlı Windows cihazı bulunamadı.</div>';
  const androidBody = !state.user ? '<div class="target-empty">Android cihazlarını görmek için giriş yap.</div>' : androids.length ? androids.map(d => choose("ANDROID", d.id)).join("") : '<div class="target-empty">Bu hesaba kayıtlı başka Android cihazı bulunamadı.</div>';
  return '<div class="target-modal-backdrop" data-action="close-target-picker"><section class="target-modal" role="dialog" aria-modal="true" aria-labelledby="target-modal-title">' +
    '<div class="target-modal-head"><h2 id="target-modal-title">Komut hedefi ve cihaz seç</h2><button class="icon-button" data-action="close-target-picker" aria-label="Kapat">' + icon("close") + '</button></div>' +
    '<div class="target-modal-scroll"><h3>Komut hedefi</h3>' + choose("AUTO") + choose("PHONE") +
    '<h3>Kayıtlı Windows cihazları</h3>' + windowsBody +
    '<h3>Kayıtlı Android cihazları</h3>' + androidBody + '</div>' +
    '<div class="target-modal-footer"><button class="button ghost full" data-action="close-target-picker">Kapat</button></div>' +
    '</section></div>';
}

function isAndroidBrowser() { return /Android/i.test(navigator.userAgent); }

function render() {
  setTheme(state.theme);
  const pages = {
    home: renderHome, auth: renderAuth, account: renderAccount,
    devices: renderDevices, remote: renderRemote, files: renderFiles,
    settings: renderSettings, diagnostics: renderDiagnostics
  };
  const content = (pages[state.page] || renderHome)();
  appRoot.className = "app-shell";
  appRoot.innerHTML = `
    ${renderHeader()}
    <div class="workspace"><main class="app-main">${content}</main></div>
    ${renderComposer()}
    ${renderDrawer()}
    ${renderTargetDialog()}
  `;
}

function subscribeDevices() {
  state.deviceUnsubscribe?.();
  state.deviceUnsubscribe = null;
  state.devices = [];
  if (!state.user) { state.devicesLoading = false; render(); return; }
  state.devicesLoading = true;
  state.devicesError = "";
  render();
  const q = query(collection(db, "devices"), where("ownerId", "==", state.user.uid));
  state.deviceUnsubscribe = onSnapshot(q, snapshot => {
    const previousControlState = state.devices.map(d => [
      d.id,d.name || d.deviceName || "",d.platform || d.type || d.os || "",
      d.status || "",d.connectionMode || "",timeMillis(d.lastSeenAt)
    ].join("|")).sort().join("|");
    const nextDevices = snapshot.docs.map(s => ({id:s.id,...s.data()}));
    const nextControlState = nextDevices.map(d => [
      d.id,d.name || d.deviceName || "",d.platform || d.type || d.os || "",
      d.status || "",d.connectionMode || "",timeMillis(d.lastSeenAt)
    ].join("|")).sort().join("|");
    const onlyRemoteFramesChanged = state.page === "remote" &&
      previousControlState === nextControlState && state.devices.length === nextDevices.length;
    state.devices = nextDevices;
    state.devicesLoading = false;
    state.devicesError = "";
    const chosen = pcDevices().find(d=>d.id===state.selectedDeviceId);
    if (!chosen) {
      state.selectedDeviceId = currentDevice()?.id || "";
      if (state.selectedDeviceId) storageSet("myn-selected-device", state.selectedDeviceId);
    }
    if (onlyRemoteFramesChanged) {
      const preview = document.getElementById("remote-screen-content");
      if (preview && state.remoteScreenEnabled) preview.innerHTML = renderRemoteScreenContent(currentDevice());
    } else render();
  }, error => {
    state.devicesLoading = false;
    state.devicesError = "Cihaz listesi yüklenemedi. Firestore kurallarını ve internet bağlantını kontrol et.";
    logIssue("MYN-WEB-DEVICES-001","Cihaz listesi",state.devicesError,error?.code || error?.message || "");
    render();
  });
  setTimeout(() => {
    if (state.devicesLoading) {
      state.devicesLoading = false;
      state.devicesError = "Cihaz listesi zaman aşımına uğradı. Yeniden deneyebilirsin.";
      render();
    }
  }, 12_000);
}
function subscribeProfile() {
  state.profileUnsubscribe?.();
  state.profileUnsubscribe = null;
  state.profile = null;
  if (!state.user) return;
  state.profileUnsubscribe = onSnapshot(doc(db,"users",state.user.uid), snap => {
    state.profile = snap.exists() ? snap.data() : {};
    const activeTag = document.activeElement?.tagName;
    if (state.page === "account" && !["INPUT","TEXTAREA","SELECT"].includes(activeTag)) render();
  }, error => logIssue("MYN-WEB-PROFILE-001","Profil", "Profil bilgisi okunamadı.",error?.code || ""));
}

function normalizeText(value) {
  return String(value || "").toLocaleLowerCase("tr-TR")
    .replaceAll("ı","i").replaceAll("ş","s").replaceAll("ğ","g")
    .replaceAll("ü","u").replaceAll("ö","o").replaceAll("ç","c")
    .replace(/\s+/g," ").trim();
}
function isAllowedAndroidTextCommand(raw) {
  const value = normalizeText(raw);
  const allowed = new Set([
    "ses artir","sesi artir","sesini artir","ses yukselt","sesi yukselt","ses arttir","sesi arttir",
    "ses azalt","sesi azalt","sesini azalt","ses kis","sesi kis","sessize al","sesi kapat","sesini kapat",
    "medya sesini kapat","medya sesini sessize al","medya sesini ac","sessizden cikar",
    "bluetooth ayarlarini ac","bluetooth ac","bluetoothu ac","wifi ayarlarini ac","wi-fi ayarlarini ac","wifi ac","wi-fi ac","kablosuz ag ayarlarini ac",
    "ayarlari ac","telefon ayarlarini ac","android ayarlarini ac","arama ekranini ac","telefon uygulamasini ac","arama ac","telefonu ac",
    "chrome ac","tarayici ac","internet ac","google ac","youtube ac","youtubeu ac","play store ac","play storeu ac"
  ]);
  return allowed.has(value) && value.length <= 120;
}
function isAllowedTextCommand(raw) {
  const value = normalizeText(raw);
  const exact = new Set([
    "sesi kapa","sesi kapat","sessize al","sesi sustur","mute",
    "ses arttir","sesi arttir","ses artir","sesi artir","ses yuksel","sesi yuksel","ses ac","sesi ac","volume up",
    "ses azalt","sesi azalt","ses kis","sesi kis","volume down",
    "masaustu goster","masaustunu goster","masaustune don","masaustu","show desktop",
    "not defteri ac","not defterini ac","notepad ac","notepad",
    "hesap makinesi ac","hesap makinesini ac","calculator ac","calc ac",
    "dosya gezgini ac","dosya yoneticisini ac","explorer ac",
    "gorev yoneticisi ac","task manager ac","taskmgr ac",
    "ayarlar ac","windows ayarlari ac","chrome ac","google chrome ac",
    "youtube ac","google ac"
  ]);
  if (exact.has(value)) return true;
  const prefixes = ["internette ara ","google'da ara ","googleda ara ","webde ara ","site ac ","web sitesi ac ","adres ac "];
  if (prefixes.some(prefix=>value.startsWith(prefix) && value.slice(prefix.length).trim().length>0)) return true;
  return false;
}
async function enqueueCommand(device, command, payload = {}, timeoutMs = COMMAND_TIMEOUT_MS) {
  if (!state.user) throw new Error("Devam etmek için önce giriş yap.");
  const androidTarget = isAndroidDevice(device);
  if (!device || !isOnline(device)) throw new Error("Seçili cihaz çevrimiçi değil. Komut gönderilmedi.");
  if (androidTarget) {
    if (command !== "text_command" || !isAllowedAndroidTextCommand(payload.text || "")) {
      throw new Error("Bu Android komutu uzaktan çalıştırma izin listesinde bulunmuyor. Yalnızca temel ses, ayar ve uygulama açma komutları kabul edilir.");
    }
  } else if (device.connectionMode !== "firebase-agent") {
    throw new Error("Seçili Windows Agent bulut bağlantısında değil. Komut gönderilmedi.");
  }
  if (state.busy) throw new Error("Önceki işlem tamamlanmalı. Yinelenen komut gönderilmedi.");
  state.busy = true;
  state.feedback = androidTarget ? "Komut Android cihaza gönderiliyor…" : "Komut Windows bilgisayara gönderiliyor…";
  render();
  let unsubscribe = null;
  let timeout = null;
  try {
    const ref = await addDoc(collection(db,"commands"), {
      ownerId: state.user.uid,
      deviceId: device.id,
      command,
      status: "pending",
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(new Date(Date.now()+120_000)),
      ...payload
    });
    state.activeCommandId = ref.id;
    state.feedback = androidTarget ? "Komut Android cihaza iletildi; işlem sonucu bekleniyor." : "Komut Windows bilgisayara iletildi; işlem sonucu bekleniyor.";
    render();
    const result = await new Promise((resolve,reject) => {
      let settled = false;
      const finish = (fn,value) => {
        if (settled) return;
        settled = true;
        if (unsubscribe) unsubscribe();
        clearTimeout(timeout);
        fn(value);
      };
      timeout = setTimeout(()=>finish(reject,new Error("Komut yanıtı zaman aşımına uğradı. Bilgisayarın bağlı olduğunu kontrol edip yeniden dene.")),timeoutMs);
      unsubscribe = onSnapshot(doc(db,"commands",ref.id), snap => {
        if (!snap.exists()) return;
        const data = snap.data();
        if (["completed","failed","cancelled"].includes(data.status)) {
          finish(resolve,{status:data.status,result:data.result || "",data});
        }
      },error=>finish(reject,new Error("Komut durumu okunamadı: " + (error?.code || "bağlantı hatası"))));
    });
    state.feedback = result.result || (result.status === "completed" ? "İşlem tamamlandı." : "İşlem tamamlanamadı.");
    if (result.status !== "completed") logIssue("MYN-WEB-COMMAND-002",androidTarget ? "Android komutu" : "Windows komutu",state.feedback,String(result.status));
    showToast(state.feedback);
    return result;
  } catch (error) {
    const message = error?.message || "Komut gönderilemedi.";
    state.feedback = message;
    logIssue("MYN-WEB-COMMAND-001","Komut gönderimi",message,error?.code || "");
    throw error;
  } finally {
    unsubscribe?.();
    clearTimeout(timeout);
    state.busy = false;
    state.activeCommandId = "";
    render();
  }
}
async function sendTextCommand(raw) {
  const original = String(raw || "").trim();
  if (!original) { showToast("Önce bir komut yaz."); return; }
  if (original.length > 1000) { showToast("Komut en fazla 1.000 karakter olabilir."); return; }
  if (!state.user) {
    state.feedback = "Cihazlara komut göndermek için MynAssistant hesabına giriş yap.";
    navigate("auth"); showToast(state.feedback); return;
  }
  if (state.commandTargetId === "PHONE") {
    state.feedback = "Bu web sayfası Android işletim sistemine doğrudan komut gönderemez. Telefonun yerel komutları için MynAssistant Android uygulamasını kullan.";
    showToast(state.feedback); render(); return;
  }
  let device = null;
  let commandText = original;
  let androidTarget = false;
  if (state.commandTargetId === "ANDROID") {
    device = androidDevices().find(d => d.id === state.selectedAndroidDeviceId) || null;
    androidTarget = true;
    if (!device) { showToast("Önce kayıtlı bir Android cihaz seç."); return; }
    if (!isAllowedAndroidTextCommand(original)) {
      state.feedback = "Bu Android komutu uzaktan otomatik çalıştırılmadı. Ses, ayar ve uygulama açma izin listesindeki komutları kullan. Arama, mesaj ve özel içerik işlemleri için cihazda yerel onay gerekir.";
      showToast(state.feedback); render(); return;
    }
  } else if (state.commandTargetId === "PC") {
    device = pcDevices().find(d => d.id === state.selectedDeviceId) || currentDevice();
    commandText = original.replace(/^(?:bilgisayara|windows bilgisayara)\s+/i,"").trim() || original;
  } else {
    const pcPrefix = /^(?:bilgisayara|windows bilgisayara)\s+/i;
    if (pcPrefix.test(original) || isAllowedTextCommand(original)) {
      device = currentDevice();
      commandText = original.replace(pcPrefix,"").trim() || original;
    } else {
      state.feedback = "Otomatik hedef bu komutun hangi cihaza gideceğini belirleyemedi. Windows komutu için PC hedefini, başka bir telefonu kontrol etmek için kayıtlı Android cihazını seç.";
      showToast(state.feedback); render(); return;
    }
  }
  if (!device) { showToast(androidTarget ? "Android cihaz bulunamadı." : "Bağlı Windows bilgisayarı bulunamadı."); return; }
  if (!isOnline(device)) { showToast("Seçilen cihaz çevrimdışı. Komut başka bir cihaza yönlendirilmedi."); return; }
  if (!androidTarget && !isAllowedTextCommand(commandText)) {
    state.feedback = "Bu komut mevcut Windows Agent izin listesinde bulunmuyor. Desteklenen komut gönderilmedi.";
    showToast(state.feedback); render(); return;
  }
  state.commandText = "";
  state.commandTargetId = androidTarget ? "ANDROID" : "PC";
  storageSet("myn-command-target", state.commandTargetId);
  try { await enqueueCommand(device,"text_command",{text:commandText}); } catch {}
}

async function startScreenPreview() {
  clearInterval(state.screenPulse);
  const device = currentDevice();
  if (!state.user || !device || device.connectionMode !== "firebase-agent" || !isOnline(device)) return;
  const pulse = async () => {
    try {
      await updateDoc(doc(db,"devices",device.id), {
        screenRequested: true,
        screenRequestedAt: serverTimestamp()
      });
    } catch (error) {
      logIssue("MYN-WEB-SCREEN-001","Ekran önizlemesi","Ekran önizlemesi isteği gönderilemedi.",error?.code || "");
    }
  };
  await pulse();
  state.screenPulse = setInterval(pulse, 8_000);
}
function stopScreenPreview() {
  clearInterval(state.screenPulse);
  state.screenPulse = null;
  const device = currentDevice();
  if (device && state.user && device.connectionMode === "firebase-agent") {
    updateDoc(doc(db,"devices",device.id), {screenRequested:false}).catch(()=>{});
  }
}

async function listFiles(path = "") {
  const device = pcDevices().find(d=>d.id===state.filesDeviceId) || currentDevice();
  if (!device) { showToast("Windows bilgisayarı bulunamadı."); return; }
  state.filesDeviceId = device.id;
  state.filesLoading = true; state.filePath = path; render();
  try {
    const response = await enqueueCommand(device,"list_files",{path});
    if (response.status !== "completed") throw new Error(String(response.result || "Dosya listesi alınamadı."));
    const listing = typeof response.result === "string" ? JSON.parse(response.result) : response.result;
    if (!listing || !Array.isArray(listing.entries)) throw new Error("Dosya listesi yanıtı beklenen biçimde değil.");
    state.fileListing = listing;
  } catch (error) {
    logIssue("MYN-WEB-FILES-001","PcFiles",error.message || "Dosya listesi alınamadı.");
  } finally { state.filesLoading=false; render(); }
}
function validWindowsFilename(name) {
  if (!name || name.length > 255 || name === "." || name === ".." || /[\\/<>:"|?*\x00-\x1f]/.test(name) || /[. ]$/.test(name)) return false;
  const base = name.split(".")[0].toUpperCase();
  return !(["CON","PRN","AUX","NUL"].includes(base) || /^(COM|LPT)[1-9]$/.test(base));
}
async function sha256(bytes) {
  const hash = await crypto.subtle.digest("SHA-256",bytes);
  return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,"0")).join("");
}
function toBase64(bytes) {
  let binary = "";
  const chunk = 0x8000;
  for (let i=0;i<bytes.length;i+=chunk) binary += String.fromCharCode(...bytes.subarray(i,i+chunk));
  return btoa(binary);
}
async function uploadPcFile(file) {
  const device = pcDevices().find(d=>d.id===state.filesDeviceId) || currentDevice();
  const destinationPath = state.fileListing?.currentPath;
  if (!device || !isOnline(device) || device.connectionMode !== "firebase-agent" || !destinationPath) throw new Error("Hedef bilgisayar veya klasör geçersiz.");
  if (!validWindowsFilename(file.name)) throw new Error("Dosya adı Windows tarafından desteklenmiyor.");
  if (file.size > MAX_TRANSFER_BYTES) throw new Error("Bu sürüm tek dosyada en fazla 500.000 bayt yükler.");
  state.filesLoading = true; render();
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const digest = await sha256(bytes);
    await enqueueCommand(device,"upload_file",{
      destinationPath, name:file.name, size:file.size,
      sha256:digest, contentBase64:toBase64(bytes)
    });
    await listFiles(destinationPath);
  } finally { state.filesLoading=false; render(); }
}
async function downloadPcFile(entry) {
  const device = pcDevices().find(d=>d.id===state.filesDeviceId) || currentDevice();
  if (!device || !isOnline(device) || device.connectionMode !== "firebase-agent") throw new Error("Bilgisayar çevrimdışı.");
  if (entry.size > MAX_TRANSFER_BYTES) throw new Error("Dosya 500.000 bayttan büyük; bu sürüm parçalı aktarımı desteklemiyor.");
  const response = await enqueueCommand(device,"download_file",{path:entry.path});
  if (response.status !== "completed") throw new Error(String(response.result || "Dosya indirilemedi."));
  const payload = typeof response.result === "string" ? JSON.parse(response.result) : response.result;
  if (!payload || typeof payload.contentBase64 !== "string") throw new Error("Dosya yanıtı geçersiz.");
  const binary = atob(payload.contentBase64);
  const bytes = Uint8Array.from(binary,c=>c.charCodeAt(0));
  if (bytes.length !== Number(payload.size) || bytes.length > MAX_TRANSFER_BYTES) throw new Error("Dosya boyutu doğrulanamadı.");
  const digest = await sha256(bytes);
  if (digest.toLowerCase() !== String(payload.sha256).toLowerCase()) throw new Error("SHA-256 doğrulaması başarısız; dosya kaydedilmedi.");
  const blob = new Blob([bytes],{type:"application/octet-stream"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href=url; a.download=payload.name || entry.name; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  showToast("Dosya indirildi ve SHA-256 doğrulandı.");
}

async function updateDeviceName(id) {
  const device = state.devices.find(d=>d.id===id);
  if (!device || !state.user) return;
  const name = prompt("Cihaz için yeni ad",device.name || device.deviceName || "");
  if (name === null) return;
  const cleaned = name.trim();
  if (!cleaned || cleaned.length > 80) { showToast("Cihaz adı 1–80 karakter olmalı."); return; }
  try {
    await updateDoc(doc(db,"devices",id),{name:cleaned});
    showToast("Cihaz adı kaydedildi.");
  } catch(error) { logIssue("MYN-WEB-DEVICE-002","Cihaz adı","Cihaz adı kaydedilemedi.",error?.code || ""); }
}

async function requestPermission(kind) {
  try {
    if (kind === "microphone" || kind === "camera") {
      const stream = await navigator.mediaDevices.getUserMedia(kind === "microphone" ? {audio:true} : {video:true});
      stream.getTracks().forEach(t=>t.stop());
      const pill = document.getElementById(kind === "microphone" ? "permission-microphone" : "permission-camera");
      if (pill) { pill.textContent = "İzin verildi"; pill.className = "pill success"; }
      showToast(kind === "microphone" ? "Mikrofon izni verildi. Sesli komutu yeniden deneyebilirsin." : "Kamera izni verildi.");
    } else if (kind === "notifications") {
      if (!("Notification" in window)) throw new Error("Bu tarayıcı bildirimleri desteklemiyor.");
      const result = await Notification.requestPermission();
      showToast("Bildirim izni: " + result);
    }
  } catch(error) {
    const message = error?.name === "NotAllowedError" ? (kind === "microphone" ? "Mikrofon izni reddedildi. Android Ayarlar → Uygulamalar → Chrome → İzinler → Mikrofon bölümünden izin ver; site ayarlarında da Mikrofonu etkinleştir." : "İzin reddedildi veya tarayıcı tarafından engellendi.") : error?.message || "İzin alınamadı.";
    logIssue("MYN-WEB-PERM-001","Tarayıcı izni",message,error?.name || "");
  }
}
function startSpeech() {
  const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Speech) { showToast("Bu tarayıcı ses tanımayı desteklemiyor."); return; }
  if (state.speechBusy) { state.speechRecognition?.stop(); return; }
  const recognition = new Speech();
  state.speechRecognition = recognition;
  recognition.lang = "tr-TR"; recognition.continuous = false; recognition.interimResults = false;
  recognition.onstart = () => { state.speechBusy=true; showToast("Dinliyorum…"); };
  recognition.onresult = event => {
    const text = event.results?.[0]?.[0]?.transcript || "";
    const command = text.replace(/^\s*hey\s*m[eı]y[eı]ne[,:]?\s*/i,"").trim();
    state.commandText = command || text;
    if (state.page === "home") render();
    else { navigate("home"); }
    showToast("Ses tanındı. Göndermeden önce komutu kontrol et.");
  };
  recognition.onerror = event => {
    const errorCode = String(event.error || "");
    const message = errorCode === "not-allowed" || errorCode === "service-not-allowed"
      ? "Mikrofon izni tarayıcı tarafından engellendi. Android Ayarlar → Uygulamalar → Chrome → İzinler → Mikrofon bölümünden izin ver; ayrıca site ayarlarında bu adres için Mikrofon iznini aç."
      : errorCode === "no-speech"
        ? "Ses algılanmadı. Mikrofonu kontrol edip daha yakından konuşarak tekrar dene."
        : errorCode === "audio-capture"
          ? "Mikrofon bulunamadı veya başka bir uygulama tarafından kullanılıyor."
          : "Ses tanıma tamamlanamadı: " + (errorCode || "bilinmeyen hata");
    logIssue("MYN-WEB-SPEECH-001","Ses tanıma",message,errorCode);
  };
  recognition.onend = () => { state.speechBusy=false; state.speechRecognition=null; };
  try { recognition.start(); } catch(error) { logIssue("MYN-WEB-SPEECH-002","Ses tanıma",error.message || "Mikrofon başlatılamadı."); }
}
function downloadTextFile(name, content, type = "application/json") {
  const blob = new Blob([content],{type});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href=url; a.download=name; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function friendlyAuthError(error, provider = "password") {
  const code = String(error?.code || "");
  const messages = {
    "auth/invalid-credential": "E-posta/şifre bilgileri eşleşmedi. Android hesabını Google ile açtıysan “Google ile devam et” düğmesini kullan. E-posta/şifre hesabın yoksa “Kayıt ol” seçeneğini kullan.",
    "auth/wrong-password": "Şifre doğru görünmüyor. Tekrar dene veya “Şifremi unuttum” ile sıfırlama bağlantısı iste.",
    "auth/user-not-found": "Bu e-posta ile e-posta/şifre hesabı bulunamadı. Google ile kayıt olduysan Google ile devam et.",
    "auth/too-many-requests": "Çok fazla giriş denemesi yapıldı. Bir süre bekleyip tekrar dene.",
    "auth/user-disabled": "Bu hesap devre dışı bırakılmış. Hesap yöneticisiyle iletişime geç.",
    "auth/operation-not-allowed": provider === "google" ? "Firebase Authentication içinde Google sağlayıcısı etkin değil." : "Firebase Authentication içinde E-posta/Şifre sağlayıcısı etkin değil.",
    "auth/unauthorized-domain": "mynkralus.github.io alan adı Firebase Authentication → Settings → Authorized domains listesinde yetkili değil.",
    "auth/network-request-failed": "İnternet bağlantısı kurulamadı. Bağlantını kontrol edip tekrar dene.",
    "auth/email-already-in-use": "Bu e-posta zaten kayıtlı. Giriş yap veya Google ile devam et.",
    "auth/weak-password": "Şifre yeterince güçlü değil. En az 8 karakter kullan.",
    "auth/invalid-email": "E-posta adresinin biçimini kontrol et.",
    "auth/popup-blocked": "Chrome Google giriş penceresini engelledi. MynAssistant sayfasını normal Chrome sekmesinde aç ve açılır pencerelere izin ver.",
    "auth/popup-closed-by-user": "Google giriş penceresi kapatıldı; giriş tamamlanmadı.",
    "auth/cancelled-popup-request": "Önceki Google giriş isteği iptal edildi. Yeniden dene.",
    "auth/account-exists-with-different-credential": "Bu e-posta başka bir giriş yöntemiyle kayıtlı. Önce kayıtlı sağlayıcıyla giriş yap.",
    "auth/invalid-action-code": "Sıfırlama bağlantısı geçersiz veya süresi dolmuş. Yeni bağlantı iste."
  };
  return messages[code] || error?.message || "İşlem tamamlanamadı. Tekrar dene.";
}
async function resetPassword() {
  const email = String(document.getElementById("auth-email")?.value || "").trim();
  if (!email || !email.includes("@")) {
    showToast("Önce e-posta alanına adresini yaz.");
    document.getElementById("auth-email")?.focus();
    return;
  }
  try {
    await sendPasswordResetEmail(auth,email);
    state.feedback = "Şifre sıfırlama bağlantısı e-posta adresine gönderildi. Gelen kutunu ve spam klasörünü kontrol et.";
    render();
  } catch(error) {
    state.feedback = friendlyAuthError(error);
    logIssue("MYN-WEB-AUTH-004","Şifre sıfırlama",state.feedback,error?.code || "");
    render();
  }
}
async function handleAuthForm(form) {
  const data = new FormData(form);
  const email = String(data.get("email") || "").trim();
  const password = String(data.get("password") || "");
  if (!email || !email.includes("@")) throw new Error("Geçerli bir e-posta adresi gir.");
  if (password.length < 8) throw new Error("Şifre en az 8 karakter olmalı.");
  if (state.authMode === "register") {
    const name = String(data.get("name") || "").trim();
    if (name.length < 2) throw new Error("Ad soyad en az 2 karakter olmalı.");
    const credential = await createUserWithEmailAndPassword(auth,email,password);
    await updateProfile(credential.user,{displayName:name});
    await setDoc(doc(db,"users",credential.user.uid),{
      uid:credential.user.uid, displayName:name, email:credential.user.email,
      provider:"password", emailVerified:credential.user.emailVerified,
      createdAt:serverTimestamp(), lastSignInAt:serverTimestamp()
    },{merge:true});
    try { await sendEmailVerification(credential.user); } catch {}
    showToast("Hesap oluşturuldu. E-posta doğrulama bağlantısı gönderildi.");
  } else {
    await signInWithEmailAndPassword(auth,email,password);
  }
}
function applyAuthenticatedUser(user, source = "observer") {
  const previousUid = state.user?.uid || "";
  const nextUid = user?.uid || "";
  const changed = previousUid !== nextUid;
  state.user = user || null;
  state.authReady = true;

  if (user) {
    // A successful sign-in always returns the user to the main assistant screen.
    if (state.page === "auth" || source === "google-popup" || source === "redirect-result") {
      state.page = "home";
      state.drawerOpen = false;
    }
    if (changed) state.feedback = "";
  } else {
    state.devices = [];
    state.profile = null;
    state.deviceUnsubscribe?.();
    state.profileUnsubscribe?.();
    state.deviceUnsubscribe = null;
    state.profileUnsubscribe = null;
  }

  if (changed || (user && !state.deviceUnsubscribe)) {
    subscribeDevices();
    subscribeProfile();
  }
  render();

  if (user && changed) {
    const label = user.displayName || user.email || "MynAssistant kullanıcısı";
    showToast("Hoş geldin, " + label + ". Hesabın bağlandı; cihazların yükleniyor.");
  }
}

async function googleLogin() {
  if (!auth || !state.firebaseReady) throw new Error("Firebase oturumu henüz hazır değil. Sayfayı yenileyip tekrar dene.");
  if (state.authBusy) return;

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({prompt:"select_account", hl:"tr"});
  auth.languageCode = "tr";

  // GitHub Pages is hosted on github.io while Firebase Auth helpers run on firebaseapp.com.
  // On current Chrome builds, redirect auth can lose its cross-site helper storage.
  // Open the Google popup directly in the click gesture instead of falling back to redirect.
  const signInTask = signInWithPopup(auth,provider);
  state.authBusy = true;
  state.feedback = "Google hesabı doğrulanıyor…";
  render();

  try {
    const credential = await signInTask;
    await credential.user.getIdToken();
    applyAuthenticatedUser(credential.user,"google-popup");
    state.feedback = "";
    render();
  } finally {
    state.authBusy = false;
    render();
  }
}
async function saveProfile(form) {
  if (!state.user) throw new Error("Oturum gerekli.");
  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const newEmail = String(data.get("email") || "").trim();
  if (!name || name.length > 80) throw new Error("Görünen ad 1–80 karakter olmalı.");
  state.profileBusy = true;
  try {
    await updateProfile(state.user,{displayName:name});
    await setDoc(doc(db,"users",state.user.uid),{
      uid:state.user.uid, displayName:name,
      email:state.user.email, photoUrl:state.user.photoURL || "",
      emailVerified:state.user.emailVerified, updatedAt:serverTimestamp()
    },{merge:true});
    if (newEmail && newEmail.toLowerCase() !== state.user.email?.toLowerCase()) {
      const cleanEmail = newEmail.trim();
      if (!cleanEmail.includes("@") || cleanEmail.length > 254) throw new Error("Geçerli bir yeni e-posta adresi gir.");
      await postAccountApi("/api/v1/account/email/change",{newEmail:cleanEmail});
      await setDoc(doc(db,"users",state.user.uid),{pendingEmailAddress:cleanEmail,pendingEmailVerified:false,updatedAt:serverTimestamp()},{merge:true});
      state.profileMessage = "Yeni e-posta doğrulama bağlantısı gönderildi. Yeni adres doğrulanana kadar mevcut adresin etkin kalır.";
    } else state.profileMessage = "Profil bilgileri kaydedildi.";
  } finally { state.profileBusy=false; render(); }
}

async function startApp() {
  appRoot.innerHTML = '<div class="boot-screen"><img src="./mynassistant-logo.webp" alt="" width="58" height="58"><strong>MynAssistant</strong><span>Firebase bağlantısı kuruluyor…</span><div class="progress" style="width:150px"><span></span></div></div>';
  if (!firebaseConfig.appId || !firebaseConfig.apiKey || !firebaseConfig.projectId) {
    state.firebaseReady = false;
    render();
    return;
  }
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    state.firebaseReady = true;
    auth.languageCode = "tr";
  } catch(error) {
    appRoot.className = "app-main";
    appRoot.innerHTML = '<section class="card"><h2>Firebase yapılandırması yüklenemedi</h2><p>firebase-config.js dosyasındaki Web uygulaması bilgilerini kontrol et.</p><p class="muted small">' + esc(error?.message || "") + '</p></section>';
    return;
  }

  try {
    // Keep the authenticated user after returning from Google and across browser restarts.
    await setPersistence(auth,browserLocalPersistence);
  } catch(error) {
    logIssue("MYN-WEB-AUTH-005","Oturum saklama","Tarayıcı oturum saklama ayarı uygulanamadı. Gizli sekme veya tarayıcı depolama ayarlarını kontrol et.",error?.code || "");
  }

  try {
    // Complete any redirect started by an earlier deployed version before attaching the observer.
    const legacyRedirectResult = await getRedirectResult(auth);
    if (legacyRedirectResult?.user) {
      await legacyRedirectResult.user.getIdToken();
      applyAuthenticatedUser(legacyRedirectResult.user,"redirect-result");
    }
  } catch(error) {
    state.page = "auth";
    state.feedback = friendlyAuthError(error,"google");
    logIssue("MYN-WEB-AUTH-003","Google girişi",state.feedback,error?.code || "");
  }

  onAuthStateChanged(auth, user => {
    applyAuthenticatedUser(user,"observer");
  },error=>{
    state.authReady = true;
    logIssue("MYN-WEB-AUTH-001","Oturum","Firebase oturum durumu okunamadı.",error?.code || "");
    appRoot.innerHTML = '<section class="card"><h2>Hesap bağlantısı kurulamadı</h2><p>İnternet bağlantını ve Firebase yapılandırmasını kontrol et.</p></section>';
  });
  // Refresh heartbeat-based state without replacing focused inputs or an active touchpad gesture.
  setInterval(() => {
    const activeTag = document.activeElement?.tagName;
    if (!state.busy && !touchStart && !["INPUT","TEXTAREA","SELECT"].includes(activeTag)) {
      if (["home","remote","devices","files"].includes(state.page)) render();
    }
  }, 15_000);
}

let auth;
let db;

document.addEventListener("click", async event => {
  if (event.target.closest(".target-modal") && !event.target.closest(".target-modal [data-action], .target-modal [data-target], .target-modal [data-page]")) return;
  const button = event.target.closest("[data-page],[data-action],[data-tab],[data-command],[data-target]");
  if (!button || button.disabled) return;
  const page = button.dataset.page, action = button.dataset.action, tab = button.dataset.tab;
  try {
    if (page) {
      if (page === "auth" && !state.user) state.authMode="login";
      navigate(page);
    } else if (tab) { if (tab !== "Agent") stopDesktopQrScan(); state.settingsTab=tab; render(); }
    else if (button.dataset.target) {
      const selected = button.dataset.target;
      const id = button.dataset.targetId || "";
      state.commandTargetId = selected;
      if (selected === "PC" && id) { state.selectedDeviceId = id; storageSet("myn-selected-device",id); }
      if (selected === "ANDROID" && id) { state.selectedAndroidDeviceId = id; storageSet("myn-selected-android-device",id); }
      storageSet("myn-command-target",selected);
      state.targetDialogOpen = false;
      state.feedback = "";
      render();
    }
    else if (button.dataset.command) {
      const device=currentDevice();
      if (!device || !isOnline(device)) throw new Error("Windows Agent çevrimdışı.");
      await enqueueCommand(device,button.dataset.command,{});
    } else if (action === "drawer-open") { state.drawerOpen=true; render(); }
    else if (action === "drawer-close") { state.drawerOpen=false; render(); }
    else if (action === "account-list-toggle") { state.accountListExpanded=!state.accountListExpanded; render(); }
    else if (action === "choose-profile-photo") { document.getElementById("profile-photo-input")?.click(); }
    else if (action === "toggle-phone-form") { state.phoneEditOpen=!state.phoneEditOpen; render(); }
    else if (action === "link-google") { await linkGoogleAccount(); }
    else if (action === "scan-desktop-qr") { await startDesktopQrScan(); }
    else if (action === "stop-desktop-qr") { stopDesktopQrScan(); render(); }
    else if (action === "open-target-picker") { state.targetDialogOpen=true; render(); }
    else if (action === "close-target-picker") { state.targetDialogOpen=false; render(); }
    else if (action === "select-android-device") { state.selectedAndroidDeviceId=button.dataset.id; state.commandTargetId="ANDROID"; storageSet("myn-selected-android-device",button.dataset.id); storageSet("myn-command-target","ANDROID"); showToast("Android cihaz komut hedefi olarak seçildi."); render(); }
    else if (action === "toggle-remote-touchpad") { state.remoteTouchpadEnabled=!state.remoteTouchpadEnabled; storageSet("myn-remote-touchpad",state.remoteTouchpadEnabled); render(); }
    else if (action === "toggle-remote-keyboard") { state.remoteKeyboardEnabled=!state.remoteKeyboardEnabled; storageSet("myn-remote-keyboard",state.remoteKeyboardEnabled); render(); }
    else if (action === "approve-desktop-pairing") { await approveDesktopPairing(); }
    else if (action === "toggle-theme") { setTheme(state.theme==="dark"?"light":"dark"); render(); }
    else if (action === "toggle-auth") { state.authMode=state.authMode==="register"?"login":"register"; state.feedback=""; render(); }
    else if (action === "google-login") { try { await googleLogin(); } catch(error) { state.feedback=friendlyAuthError(error,"google"); logIssue("MYN-WEB-AUTH-003","Google girişi",state.feedback,error?.code || ""); render(); } }
    else if (action === "reset-password") { await resetPassword(); }
    else if (action === "logout") {
      if (!confirm("MynAssistant hesabından çıkış yapılsın mı?")) return;
      await signOut(auth); navigate("home"); showToast("Çıkış yapıldı.");
    }
    else if (action === "verify-email") {
      if (!state.user) throw new Error("Oturum gerekli.");
      await sendAccountVerificationEmail();
    }
    else if (action === "refresh-devices") { subscribeDevices(); }
    else if (action === "select-device") {
      state.selectedDeviceId=button.dataset.id; storageSet("myn-selected-device",state.selectedDeviceId);
      showToast("Cihaz seçildi."); render();
    }
    else if (action === "rename-device") { await updateDeviceName(button.dataset.id); }
    else if (action === "speech-start") { startSpeech(); }
    else if (action === "request-microphone") { await requestPermission("microphone"); }
    else if (action === "request-camera") { await requestPermission("camera"); }
    else if (action === "request-notifications") { await requestPermission("notifications"); }
    else if (action === "toggle-screen") { state.remoteScreenEnabled=!state.remoteScreenEnabled; if (state.remoteScreenEnabled) startScreenPreview(); else stopScreenPreview(); render(); }
    else if (action === "focus-remote-keyboard") { document.getElementById("remote-keyboard-input")?.focus(); }
    else if (action === "remote-backspace") {
      const d=currentDevice(); await enqueueCommand(d,"key_backspace",{});
    }
    else if (action === "remote-type-enter") {
      const input=document.getElementById("remote-keyboard-input");
      const value=input?.value || "";
      const d=currentDevice();
      if (value.trim()) await enqueueCommand(d,"type_text",{text:value.slice(0,1000),pressEnter:true});
      else await enqueueCommand(d,"key_enter",{});
      if (input) input.value="";
    }
    else if (action === "files-list-root") { state.filesDeviceId=document.getElementById("files-device")?.value || currentDevice()?.id || ""; await listFiles(""); }
    else if (action === "files-refresh") { await listFiles(state.filePath); }
    else if (action === "files-parent") { if (state.fileListing?.parentPath != null) await listFiles(state.fileListing.parentPath); }
    else if (action === "files-open") {
      const entry=state.fileListing?.entries?.[Number(button.dataset.index)];
      if (entry?.isDirectory) await listFiles(entry.path);
    }
    else if (action === "files-zip") {
      const entry=state.fileListing?.entries?.[Number(button.dataset.index)];
      const d=pcDevices().find(x=>x.id===state.filesDeviceId) || currentDevice();
      if (entry && d) await enqueueCommand(d,"zip_folder",{path:entry.path});
    }
    else if (action === "files-download") {
      const entry=state.fileListing?.entries?.[Number(button.dataset.index)];
      if (entry) await downloadPcFile(entry);
    }
    else if (action === "files-upload") { document.getElementById("files-upload-input")?.click(); }
    else if (action === "clear-logs") {
      if (confirm("Web hata kayıtları temizlensin mi?")) { state.logs=[]; storageRemove("myn-web-logs"); render(); }
    }
    else if (action === "export-logs") { downloadTextFile("mynassistant-web-logs.json",JSON.stringify(state.logs,null,2)); }
  } catch(error) {
    const message=error?.message || "İşlem tamamlanamadı.";
    state.feedback=message; showToast(message);
    if (state.page==="auth") render();
  }
});
document.addEventListener("submit", async event => {
  if (event.target.id==="desktop-pairing-form") {
    event.preventDefault();
    state.pairingCode=String(new FormData(event.target).get("code") || "").replace(/[^A-Za-z0-9]/g,"").toUpperCase();
    await approveDesktopPairing();
  } else if (event.target.id==="phone-form") {
    event.preventDefault();
    try { await savePendingPhoneNumber(new FormData(event.target).get("phone")); }
    catch(error) { state.profileMessage=error?.message || "Telefon numarası kaydedilemedi."; render(); }
  } else if (event.target.id==="auth-form") {
    event.preventDefault();
    const button=event.target.querySelector('button[type="submit"]');
    if (button) button.disabled=true;
    try { await handleAuthForm(event.target); }
    catch(error) { state.feedback=friendlyAuthError(error,"password"); logIssue("MYN-WEB-AUTH-002","Hesap",state.feedback,error?.code || ""); render(); }
    finally { if (button) button.disabled=false; }
  } else if (event.target.id==="profile-form") {
    event.preventDefault();
    try { await saveProfile(event.target); }
    catch(error) { state.profileMessage=error?.message || "Profil kaydedilemedi."; logIssue("MYN-WEB-PROFILE-002","Profil",state.profileMessage,error?.code || ""); render(); }
  } else if (event.target.id==="command-form") {
    event.preventDefault();
    state.commandText=document.getElementById("command-input")?.value || "";
    await sendTextCommand(state.commandText);
  }
});
document.addEventListener("change", async event => {
  const el=event.target;
  if (el.id==="remote-device") {
    state.selectedDeviceId=el.value; storageSet("myn-selected-device",el.value);
    if(state.page==="remote") { stopScreenPreview(); startScreenPreview(); }
    render();
  } else if (el.id==="files-device") {
    state.filesDeviceId=el.value; state.fileListing=null; render();
  } else if (el.id==="command-target") {
    state.commandTargetId=el.value;
  } else if (el.id==="profile-photo-input") {
    const file=el.files?.[0]; if (!file) return;
    await uploadProfilePhoto(file); el.value="";
  } else if (el.id==="files-upload-input") {
    const file=el.files?.[0]; if (!file) return;
    try { await uploadPcFile(file); } catch(error) { logIssue("MYN-WEB-FILES-002","Dosya yükleme",error?.message || "Dosya yüklenemedi."); }
    el.value="";
  }
});
document.addEventListener("input", event => {
  if(event.target.id==="command-input") state.commandText=event.target.value;
  else if(event.target.id==="desktop-pairing-code") state.pairingCode=event.target.value.replace(/[^A-Za-z0-9]/g,"").toUpperCase().slice(0,10);
});

// Touchpad: single click, long-press right click, drag sends relative pointer movement.
let touchStart = null, touchMoved = false, touchTimer = null, longPressed = false;
document.addEventListener("pointerdown",event=>{
  const pad=event.target.closest("#touchpad");
  if(!pad) return;
  const d=currentDevice();
  if(!d || !isOnline(d) || d.connectionMode!=="firebase-agent" || state.busy) return;
  touchStart={x:event.clientX,y:event.clientY,deviceId:d.id};
  touchMoved=false; longPressed=false;
  pad.setPointerCapture?.(event.pointerId);
  touchTimer=setTimeout(async()=>{
    if(touchStart && !touchMoved) {
      longPressed=true;
      try { await enqueueCommand(d,"mouse_right_click",{}); } catch {}
    }
  },550);
});
document.addEventListener("pointermove",event=>{
  if(!touchStart) return;
  const dx=event.clientX-touchStart.x, dy=event.clientY-touchStart.y;
  if(Math.abs(dx)+Math.abs(dy)>7) { touchMoved=true; clearTimeout(touchTimer); }
});
document.addEventListener("pointerup",async event=>{
  if(!touchStart) return;
  clearTimeout(touchTimer);
  const start=touchStart; touchStart=null;
  const d=pcDevices().find(x=>x.id===start.deviceId);
  if(!d || !isOnline(d) || state.busy) return;
  const dx=event.clientX-start.x, dy=event.clientY-start.y;
  try {
    if(touchMoved && !longPressed) await enqueueCommand(d,"mouse_move",{dx:Math.round(dx*1.2),dy:Math.round(dy*1.2)});
    else if(!longPressed) await enqueueCommand(d,"mouse_click",{});
  } catch {}
});
document.addEventListener("pointercancel",()=>{clearTimeout(touchTimer);touchStart=null;});

window.addEventListener("error",event=>{
  if(event?.message) logIssue("MYN-WEB-RUNTIME-001","JavaScript",event.message,event.filename || "");
});
window.addEventListener("unhandledrejection",event=>{
  logIssue("MYN-WEB-RUNTIME-002","İşlem",event.reason?.message || "Beklenmeyen asenkron hata.");
});
window.addEventListener("beforeunload",()=>{ stopScreenPreview(); stopDesktopQrScan(); });

startApp().catch(error => {
  logIssue("MYN-WEB-BOOT-001","Uygulama başlatma","MynAssistant başlatılamadı. Sayfayı yenileyip tekrar dene.",error?.message || "");
  appRoot.innerHTML = '<section class="card"><h2>MynAssistant başlatılamadı</h2><p>Sayfayı yenileyip tekrar dene. Sorun sürerse Hata kayıtları bölümünü kontrol et.</p></section>';
});
if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("./service-worker.js").catch(error => {
    logIssue("MYN-WEB-PWA-001", "Çevrimdışı uygulama", "Uygulama kabuğu kaydedilemedi.", error?.message || "");
  });
}
