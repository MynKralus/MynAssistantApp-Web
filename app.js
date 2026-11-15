import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signInWithPopup, signInWithRedirect,
  getRedirectResult, GoogleAuthProvider, signOut, updateProfile,
  sendEmailVerification, verifyBeforeUpdateEmail
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";
import {
  getFirestore, collection, query, where, onSnapshot, doc, updateDoc,
  addDoc, serverTimestamp, Timestamp, setDoc
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const APP_VERSION = "0.1.0-web";
const MAX_TRANSFER_BYTES = 500_000;
const COMMAND_TIMEOUT_MS = 90_000;
const ONLINE_WINDOW_MS = 180_000;
const SETTINGS_TABS = ["Genel", "Agent", "Hesap", "İzinler", "Eklentiler", "Başlangıç", "Hata günlükleri", "Kısayollar"];
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
  firebaseReady: false, user: null, page: "home", settingsTab: "Genel", authMode: "login",
  theme: storageGet("myn-theme", "dark"), drawerOpen: false,
  devices: [], devicesLoading: false, devicesError: "",
  profile: null, profileBusy: false, profileMessage: "",
  selectedDeviceId: storageGet("myn-selected-device", ""),
  commandTargetId: "AUTO", commandText: "", busy: false, activeCommandId: "",
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
  return state.devices.filter(d =>
    String(d.connectionMode || "") === "firebase-agent" ||
    /windows|pc/i.test(String(d.platform || d.type || d.os || ""))
  );
}
function onlinePcDevices() { return pcDevices().filter(isOnline); }
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
  if (state.page === "remote" && page !== "remote") stopScreenPreview();
  state.page = page;
  state.drawerOpen = false;
  if (page === "remote") startScreenPreview();
  render();
  window.scrollTo({top:0, behavior:"smooth"});
}

function renderDrawer() {
  const activeLabel = ({
    home:"Ana sayfa",account:"Hesabım",devices:"Cihazlarım",settings:"Ayarlar",remote:"PC Kumandası",files:"PcFiles"
  })[state.page];
  const user = state.user;
  return `
    <div class="drawer-backdrop ${state.drawerOpen ? "" : "hidden"}" data-action="drawer-close"></div>
    <aside class="drawer ${state.drawerOpen ? "open" : ""}" aria-label="Uygulama menüsü">
      <div class="drawer-account">
        ${user?.photoURL ? `<img class="avatar" src="${esc(user.photoURL)}" alt="Profil fotoğrafı" referrerpolicy="no-referrer">` : `<img class="avatar" src="./mynassistant-mark.svg" alt="MynAssistant logosu">`}
        <div class="drawer-account-copy">
          <strong>${esc(user?.displayName || (user?.email ? user.email.split("@")[0] : "MynAssistant"))}</strong>
          <span>${esc(user?.email || "Giriş yap veya kayıt ol")}</span>
        </div>
        <button class="icon-button" data-action="drawer-close" aria-label="Menüyü kapat">${icon("close")}</button>
      </div>
      ${NAV.map(([id,label,ic]) => `<button class="nav-item ${activeLabel === label ? "active" : ""}" data-page="${id}">${icon(ic)}<span>${label}</span></button>`).join("")}
      <button class="nav-item ${state.page === "diagnostics" ? "active" : ""}" data-page="diagnostics">${icon("alert")}<span>Hata kayıtları</span></button>
      <div class="drawer-footer">
        ${user ? '<button class="button danger full" data-action="logout">Çıkış yap</button>' : '<button class="button full" data-page="auth">Giriş yap / Kayıt ol</button>'}
        <p class="muted tiny" style="text-align:center;margin:12px 0 0">MynAssistant Web • ${APP_VERSION}</p>
      </div>
    </aside>`;
}
function renderHeader() {
  const online = onlinePcDevices().length;
  return `
    <header class="topbar">
      <button class="icon-button" data-action="drawer-open" aria-label="Menüyü aç">${icon("menu")}</button>
      <div class="brand"><img src="./mynassistant-mark.svg" alt=""><div class="brand-copy"><strong>MynAssistant</strong><small>PERSONAL ASSISTANT</small></div></div>
      <div class="topbar-spacer"></div>
      <div class="header-status" title="${online} çevrimiçi bilgisayar"><span class="status-dot ${online ? "online" : ""}"></span><span>${online ? online + " cihaz çevrimiçi" : "Cihazlar bekleniyor"}</span></div>
      <button class="icon-button" data-action="toggle-theme" aria-label="Temayı değiştir">${icon(state.theme === "dark" ? "sun" : "moon")}</button>
    </header>`;
}
function renderHeading(title, subtitle = "") {
  return `<div class="page-heading"><div><h1>${esc(title)}</h1>${subtitle ? `<p>${esc(subtitle)}</p>` : ""}</div></div>`;
}
function renderDeviceCard(device, showActions = true) {
  const online = isOnline(device);
  const pc = String(device.connectionMode || "") === "firebase-agent" || /windows|pc/i.test(String(device.platform || device.os || ""));
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
  const target = currentDevice();
  const canSend = !!state.user && !!target && isOnline(target);
  return `
    <section class="hero-identity" aria-label="MynAssistant">
      <div class="hero-avatar-shell">
        <img class="hero-avatar" src="./mynassistant-mark.svg" alt="MynAssistant asistan logosu">
      </div>
      <div class="hero-identity-copy">
        <span class="hero-kicker"><span class="status-dot online"></span> KİŞİSEL ASİSTAN</span>
        <h1>MynAssistant</h1>
        <p>Kişisel asistanın. Komutların, cihazların ve araçların tek merkezde.</p>
      </div>
    </section>
    <section class="card hero-card">
      <div class="eyebrow">KOMUT MERKEZİ</div>
      <h2>Sana nasıl yardımcı olabilirim?</h2>
      <p>Telefonuna veya bilgisayarına komut ver; hedefi sen seç veya otomatik yönlendirmeyi kullan.</p>
    </section>
    ${!state.firebaseReady ? '<div class="notice warning">Firebase Web uygulaması yapılandırılmadı. Sayfaları önizleyebilirsin; giriş, canlı cihazlar ve komut gönderimi Web SDK yapılandırmasını tamamlayınca etkinleşir.</div>' : ""}
    <section class="section-stack">
      <div class="section-heading"><h2>Hızlı erişim</h2><span class="muted tiny">MynAssistant</span></div>
      <div class="grid-2">
        <button class="card compact" data-page="devices" style="text-align:left;cursor:pointer"><div class="row">${icon("devices")}<strong>Cihazlarım</strong></div><p>${state.devicesLoading ? "Cihazlar aranıyor…" : pcDevices().length + " kayıtlı cihaz"}</p></button>
        <button class="card compact" data-page="remote" style="text-align:left;cursor:pointer"><div class="row">${icon("remote")}<strong>PC Kumandası</strong></div><p>Bilgisayarını uzaktan kontrol et.</p></button>
        <button class="card compact" data-page="files" style="text-align:left;cursor:pointer"><div class="row">${icon("folder")}<strong>PcFiles</strong></div><p>Bilgisayar dosyalarını görüntüle.</p></button>
        <button class="card compact" data-page="settings" style="text-align:left;cursor:pointer"><div class="row">${icon("settings")}<strong>Ayarlar</strong></div><p>Hesap ve uygulama tercihleri.</p></button>
      </div>
    </section>
    <section class="card compact">
      <div class="section-heading"><h3>Komut hedefi</h3><span class="pill ${canSend ? "success" : "warning"}">${canSend ? "Hazır" : "Bağlantı bekleniyor"}</span></div>
      <p>${esc(target?.name || "Henüz çevrimiçi Windows bilgisayarı bulunamadı.")}</p>
      ${!state.user ? '<button class="button full" data-page="auth" style="margin-top:12px">Giriş yap / Kayıt ol</button>' : ""}
      ${state.devicesError ? `<p class="text-danger">${esc(state.devicesError)}</p><button class="button secondary small-button" data-action="refresh-devices">Yeniden dene</button>` : ""}
    </section>
    ${state.feedback ? `<p class="muted small">${esc(state.feedback)}</p>` : ""}
  `;
}

function renderAuth() {
  if (state.user) return renderAccount();
  if (!state.firebaseReady) return `${renderHeading("Hesap bağlantısını etkinleştir", "Google ile giriş arayüzü hazır; Firebase Web uygulaması yapılandırması henüz tamamlanmadı.")}
    <section class="card">
      <div class="row"><img class="avatar" src="./mynassistant-mark.svg" alt="MynAssistant logosu"><div><h3>Google ile MynAssistant</h3><p>Android uygulamasıyla aynı Firebase projesine bağlanır.</p></div></div>
      <button class="button secondary full" disabled style="margin-top:14px">Google ile devam et · Kurulum bekleniyor</button>
      <p>Google girişini etkinleştirmek için Firebase Console'da <strong>myncloud-24</strong> projesine bir Web uygulaması kaydet ve Web SDK yapılandırmasını aşağıdaki dosyaya aktar.</p>
      <a class="button full" href="https://console.firebase.google.com/project/myncloud-24/settings/general" target="_blank" rel="noopener">Firebase Web uygulamasını yapılandır</a>
    </section>
    <div class="notice warning">Bu web sitesi Render yönetim sunucusuna bağlı değildir. Hesap ve cihaz kimliği Firebase Authentication; cihaz durumu ve komut kuyruğu Cloud Firestore üzerinden yürür.</div>`;
  const register = state.authMode === "register";
  return `
    ${renderHeading(register ? "MynAssistant hesabı oluştur" : "Tekrar hoş geldin", register ? "Hesabını oluştur ve cihazlarını bağla." : "Hesabına giriş yaparak devam et.")}
    <section class="card">
      <form id="auth-form" class="form-stack">
        ${register ? '<div class="field"><label for="auth-name">Ad soyad</label><input class="input" id="auth-name" name="name" autocomplete="name" maxlength="80" required></div>' : ""}
        <div class="field"><label for="auth-email">E-posta</label><input class="input" id="auth-email" name="email" type="email" autocomplete="email" maxlength="254" required></div>
        <div class="field"><label for="auth-password">Şifre</label><input class="input" id="auth-password" name="password" type="password" autocomplete="${register ? "new-password" : "current-password"}" minlength="8" maxlength="128" required></div>
        <button class="button full" type="submit">${register ? "Hesap oluştur" : "Giriş yap"}</button>
      </form>
      <div class="row" style="margin:15px 0"><span style="height:1px;background:var(--border);flex:1"></span><span class="muted tiny">veya</span><span style="height:1px;background:var(--border);flex:1"></span></div>
      <button class="button secondary full" data-action="google-login">Google ile devam et</button>
      <p class="muted small" style="margin-top:15px">${register ? "Zaten hesabın var mı?" : "Henüz hesabın yok mu?"} <button class="link-button" data-action="toggle-auth">${register ? "Giriş yap" : "Kayıt ol"}</button></p>
      ${state.feedback ? `<div class="notice" role="status">${esc(state.feedback)}</div>` : ""}
    </section>
    <div class="notice">Web sürümü, Android uygulamanla aynı Firebase hesabını kullanır. Giriş için Firebase Console'da web alan adının yetkili alan adları listesinde bulunması gerekir.</div>`;
}
function renderAccount() {
  if (!state.user) return renderAuth();
  const u = state.user;
  return `
    ${renderHeading("Hesabım", "MynAssistant profil bilgilerin.")}
    <section class="card">
      <div class="row" style="margin-bottom:18px">
        ${u.photoURL ? `<img class="avatar" src="${esc(u.photoURL)}" alt="Profil fotoğrafı">` : '<img class="avatar" src="./mynassistant-mark.svg" alt="MynAssistant logosu">'}
        <div class="device-info"><strong>${esc(u.displayName || u.email?.split("@")[0] || "MynAssistant kullanıcısı")}</strong><span>${esc(u.email || "")}</span></div>
        <span class="pill ${u.emailVerified ? "success" : "warning"}">${u.emailVerified ? "E-posta doğrulandı" : "E-posta bekliyor"}</span>
      </div>
      <form id="profile-form" class="form-stack">
        <div class="field"><label for="profile-name">Görünen ad</label><input class="input" id="profile-name" name="name" maxlength="80" value="${esc(u.displayName || "")}"></div>
        <div class="field"><label>E-posta adresi</label><input class="input" value="${esc(u.email || "")}" disabled></div>
        <div class="field"><label for="profile-email">Yeni e-posta adresi</label><input class="input" id="profile-email" name="email" type="email" maxlength="254" placeholder="yeni@ornek.com"></div>
        <div class="form-actions"><button class="button" type="submit">Profil bilgilerini kaydet</button><button class="button secondary" type="button" data-action="verify-email" ${u.emailVerified ? "disabled" : ""}>Doğrulama e-postası gönder</button></div>
      </form>
      ${state.profileMessage ? `<p class="muted small" role="status">${esc(state.profileMessage)}</p>` : ""}
    </section>
    <section class="card compact">
      <h3>Hesap bağlantısı</h3><p>Android MynAssistant ile Windows Agent aynı Google/Firebase UID'sini kullanır. Aynı e-posta ile giriş yaptığında cihazlar otomatik görünür.</p>
      <div class="form-actions" style="margin-top:14px"><button class="button secondary" data-page="devices">Cihazlarımı gör</button><button class="button danger" data-action="logout">Çıkış yap</button></div>
    </section>
    <div class="notice warning">Profil fotoğrafı yükleme ve SMS doğrulama Android sürümünde yapılandırılmış sağlayıcı gerektiriyor. Web sürümünde henüz etkin değil; burada çalışıyor gibi gösterilmez.</div>`;
}

function renderDevices() {
  if (!state.user) return `${renderHeading("Cihazlarım","Cihazlarını görmek için hesabına giriş yap.")}<section class="card"><button class="button full" data-page="auth">Giriş yap / Kayıt ol</button></section>`;
  const list = pcDevices();
  return `
    ${renderHeading("Cihazlarım","Yalnızca bu MynAssistant hesabına ait cihazlar görünür.")}
    <section class="row between"><span class="muted small">${list.length} Windows cihazı</span><button class="button secondary small-button" data-action="refresh-devices">${icon("refresh")} Yenile</button></section>
    ${state.devicesLoading ? '<div class="progress"><span></span></div>' : ""}
    ${state.devicesError ? `<div class="notice danger">${esc(state.devicesError)}</div>` : ""}
    ${list.length ? list.map(d=>renderDeviceCard(d)).join("") : `<div class="empty-state"><div class="empty-icon">${icon("monitor")}</div><strong>Henüz bilgisayar bağlanmamış</strong><p>Windows MynAssistant uygulamasını açıp bu hesapla giriş yaptığında bilgisayarın burada otomatik görünür.</p></div>`}
    ${state.devices.filter(d=>!list.includes(d)).length ? `<section class="section-stack"><h3>Diğer cihazlar</h3>${state.devices.filter(d=>!list.includes(d)).map(d=>renderDeviceCard(d)).join("")}</section>` : ""}
  `;
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
  const online = device && isOnline(device) && device.connectionMode === "firebase-agent";
  const hasFrame = !!device?.screenJpegBase64;
  return `
    <div class="section-heading"><h1 style="font-size:22px;margin:0">PC Kumandası</h1><div class="row">
      <button class="icon-button" title="Ekran önizlemesi" data-action="toggle-screen">${icon("monitor")}</button>
      <button class="icon-button" title="Klavye" data-action="focus-remote-keyboard">${icon("keyboard")}</button>
    </div></div>
    ${!state.user ? `
      <div class="notice">
        <strong>Yerel kullanım ile bulut bağlantısı farklıdır.</strong><br>
        Bu ekranı ve kumanda düzenini oturum açmadan görüntüleyebilirsin. Kendi Windows cihazını internet üzerinden güvenli biçimde bulmak ve komut göndermek için MynAssistant hesabın gerekir; cihaz ve komut kayıtları Firebase'de hesap UID'siyle eşleştirilir.
        <div style="margin-top:10px"><button class="button secondary small-button" data-page="auth">Bulut cihazını bağlamak için giriş yap</button></div>
      </div>` : ""}
    <section class="card compact">
      <div class="row"><div class="device-icon">${icon("monitor")}</div><div class="device-info"><strong>${esc(device?.name || "Windows bilgisayar")}</strong><span>${online ? "Çevrimiçi • son heartbeat güncel" : "Çevrimdışı • Windows Agent bekleniyor"}</span></div><span class="status-dot ${online ? "online" : ""}"></span></div>
      <div class="row wrap" style="margin-top:12px">
        <label class="muted tiny" for="remote-device">Kontrol edilecek cihaz</label>
        <select class="select" id="remote-device" style="flex:1;min-width:170px">
          ${pcDevices().map(d=>`<option value="${esc(d.id)}" ${device?.id===d.id?"selected":""}>${esc(d.name || "Windows bilgisayar")} • ${isOnline(d)?"Çevrimiçi":"Çevrimdışı"}</option>`).join("")}
        </select>
      </div>
    </section>
    ${state.remoteScreenEnabled ? `<section class="section-stack"><div class="section-heading"><h3>Windows masaüstü</h3><span class="muted tiny">Sayfa açıkken güncellenir</span></div><div id="remote-screen-content">${renderRemoteScreenContent(device)}</div></section>` : ""}
    <section class="card">
      <div class="eyebrow">PC KUMANDASI</div>
      <div class="remote-grid">
        <button class="remote-control" data-command="mute" ${online?"":"disabled"}>${icon("mute")}Sesi kapat / aç</button>
        <button class="remote-control" data-command="volume_up" ${online?"":"disabled"}>${icon("volume")}Sesi artır</button>
        <button class="remote-control" data-command="volume_down" ${online?"":"disabled"}>${icon("volume")}Sesi kıs</button>
        <button class="remote-control" data-command="home" ${online?"":"disabled"}>${icon("home")}Masaüstünü göster</button>
      </div>
      <p class="muted tiny" style="margin-top:12px">Bilgisayarın kilitlenmesi ve uygulama kapatma komutları mevcut Windows Agent sürümünde etkin değil, bu nedenle gönderilmiyor.</p>
    </section>
    <section class="section-stack">
      <div class="section-heading"><h3>Touchpad</h3><span class="muted tiny">Sürükle: hareket • Dokun: sol tık • Basılı tut: sağ tık</span></div>
      <div class="touchpad" id="touchpad" aria-label="Bilgisayar dokunmatik yüzeyi"><span class="touchpad-label">Touchpad</span></div>
    </section>
    <section class="card compact">
      <h3>Klavye</h3>
      <div class="row" style="margin-top:12px">
        <input class="input" id="remote-keyboard-input" maxlength="1000" placeholder="Bilgisayara yaz…" ${online?"":"disabled"}>
        <button class="icon-button" data-action="remote-backspace" title="Backspace" ${online?"":"disabled"}>${icon("close")}</button>
        <button class="button" data-action="remote-type-enter" ${online?"":"disabled"}>Enter</button>
      </div>
      <p class="muted tiny">Metin, Windows bilgisayarında seçili alana yazılır. En fazla 1.000 karakter.</p>
    </section>
    ${!online ? '<div class="notice warning">Uzaktan kontrol için Windows Agent açık olmalı, aynı Firebase hesabıyla giriş yapmalı ve son 3 dakika içinde heartbeat göndermiş olmalı.</div>' : ""}
  `;
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
    body = `
      <section class="card">
        <h3>Otomatik bilgisayar bağlantısı</h3>
        <p>Windows MynAssistant uygulamasında Android ile aynı Google hesabıyla oturum aç. Cihaz Firestore üzerinden otomatik listelenir.</p>
        <div class="row between" style="margin-top:15px"><strong>Windows Agent durumu</strong><span class="pill ${online.length?"success":"warning"}">${online.length?"Çevrimiçi":"Bağlı cihaz bekleniyor"}</span></div>
        <p>${online.length ? online.map(d=>esc(d.name||"Windows bilgisayar")).join(", ") : "Bu hesaba ait çevrimiçi Windows Agent bulunamadı."}</p>
        <button class="button secondary full" data-page="devices" style="margin-top:12px">Cihazlarımı gör</button>
      </section>
      <section class="card">
        <h3>Telefon-PC bağlantısı</h3>
        <p>Web sürümü aynı Firebase cihaz kayıtlarını okur. Bilgisayarın Agent heartbeat'i 3 dakika içinde gelmiyorsa çevrimdışı kabul edilir.</p>
        <button class="button secondary full" data-action="refresh-devices" style="margin-top:12px">Bağlantıyı yenile</button>
      </section>`;
  } else if (tab === "Hesap") {
    body = `<section class="card"><h3>Hesap ve profil</h3><p>${state.user ? "MynAssistant hesabın etkin." : "Şu anda giriş yapılmamış."}</p><button class="button full" data-page="${state.user?"account":"auth"}" style="margin-top:12px">${state.user?"Hesap ve profil ayarları":"Giriş yap / Kayıt ol"}</button></section>`;
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
  } else if (tab === "Kısayollar") {
    body = `<section class="card"><h3>Hızlı erişim</h3><div class="form-actions" style="margin-top:13px"><button class="button secondary" data-page="home">Ana sayfa</button><button class="button secondary" data-page="devices">Cihazlarım</button><button class="button secondary" data-page="remote">PC Kumandası</button><button class="button secondary" data-page="files">PcFiles</button></div></section>`;
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
  const device = currentDevice();
  const disabled = !state.user || !device || !isOnline(device) || state.busy;
  return `
    <div class="composer-wrap">
      <form class="composer" id="command-form">
        <div class="composer-top">
          <select class="composer-target" id="command-target" aria-label="Komut hedefi">
            <option value="AUTO" ${state.commandTargetId==="AUTO"?"selected":""}>＋ Otomatik hedef</option>
            ${pcDevices().map(d=>`<option value="${esc(d.id)}" ${state.commandTargetId===d.id?"selected":""}>${esc(d.name || "Windows cihazı")}</option>`).join("")}
          </select>
          <span class="muted tiny">${device ? esc(device.name || "Windows PC") : "Bilgisayar bekleniyor"}</span>
        </div>
        <div class="composer-input-row">
          <input class="composer-input" id="command-input" maxlength="1000" autocomplete="off" placeholder="Bir şey iste…" value="${esc(state.commandText)}" ${disabled?"":" "}>
          <button type="button" class="round-action" data-action="speech-start" title="Sesli komut" ${"SpeechRecognition" in window || "webkitSpeechRecognition" in window ? "" : "disabled"}>${icon("mic")}</button>
          <button type="submit" class="round-action primary" aria-label="Komutu gönder" ${disabled?"disabled":""}>${icon("send")}</button>
        </div>
      </form>
      ${!state.user ? '<p class="muted tiny" style="text-align:center;margin:7px 0 0">Komut göndermek için hesabına giriş yap.</p>' : ""}
      ${state.feedback ? `<p class="muted tiny" role="status" style="text-align:center;margin:7px 0 0">${esc(state.feedback)}</p>` : ""}
    </div>`;
}

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
  }, error => logIssue("MYN-WEB-PROFILE-001","Profil", "Profil bilgisi okunamadı.",error?.code || ""));
}

function normalizeText(value) {
  return String(value || "").toLocaleLowerCase("tr-TR")
    .replaceAll("ı","i").replaceAll("ş","s").replaceAll("ğ","g")
    .replaceAll("ü","u").replaceAll("ö","o").replaceAll("ç","c")
    .replace(/\s+/g," ").trim();
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
  if (!device || device.connectionMode !== "firebase-agent" || !isOnline(device)) {
    throw new Error("Seçili Windows Agent çevrimiçi değil. Komut gönderilmedi.");
  }
  if (state.busy) throw new Error("Önceki işlem tamamlanmalı. Yinelenen komut gönderilmedi.");
  state.busy = true;
  state.feedback = "Komut bilgisayara gönderiliyor…";
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
    state.feedback = "Komut bilgisayara iletildi; işlem sonucu bekleniyor.";
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
    if (result.status !== "completed") logIssue("MYN-WEB-COMMAND-002","Windows komutu",state.feedback,String(result.status));
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
  const text = String(raw || "").trim();
  if (!text) { showToast("Önce bir komut yaz."); return; }
  if (text.length > 1000) { showToast("Komut en fazla 1.000 karakter olabilir."); return; }
  if (!isAllowedTextCommand(text)) {
    showToast("Bu komut mevcut Windows Agent izin listesinde bulunmuyor. Desteklenen komutları kullan.");
    state.feedback = "Güvenlik nedeniyle desteklenmeyen komut gönderilmedi.";
    render();
    return;
  }
  const device = state.commandTargetId === "AUTO"
    ? currentDevice() : pcDevices().find(d=>d.id===state.commandTargetId);
  if (!device) { showToast("Bağlı Windows bilgisayarı bulunamadı."); return; }
  state.commandText = "";
  try { await enqueueCommand(device,"text_command",{text}); }
  catch {}
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
      showToast(kind === "microphone" ? "Mikrofon izni verildi." : "Kamera izni verildi.");
    } else if (kind === "notifications") {
      if (!("Notification" in window)) throw new Error("Bu tarayıcı bildirimleri desteklemiyor.");
      const result = await Notification.requestPermission();
      showToast("Bildirim izni: " + result);
    }
  } catch(error) {
    const message = error?.name === "NotAllowedError" ? "İzin reddedildi veya tarayıcı tarafından engellendi." : error?.message || "İzin alınamadı.";
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
  recognition.onerror = event => logIssue("MYN-WEB-SPEECH-001","Ses tanıma","Ses tanıma tamamlanamadı: "+(event.error || "bilinmeyen hata"));
  recognition.onend = () => { state.speechBusy=false; state.speechRecognition=null; };
  try { recognition.start(); } catch(error) { logIssue("MYN-WEB-SPEECH-002","Ses tanıma",error.message || "Mikrofon başlatılamadı."); }
}
function downloadTextFile(name, content, type = "application/json") {
  const blob = new Blob([content],{type});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href=url; a.download=name; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
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
async function googleLogin() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({prompt:"select_account"});
  try { await signInWithPopup(auth,provider); }
  catch(error) {
    if (["auth/popup-blocked","auth/popup-closed-by-user","auth/cancelled-popup-request"].includes(error?.code)) {
      await signInWithRedirect(auth,provider);
    } else throw error;
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
      await verifyBeforeUpdateEmail(state.user,newEmail);
      state.profileMessage = "Yeni e-posta adresine doğrulama bağlantısı gönderildi. Adres doğrulamadan değişmez.";
    } else state.profileMessage = "Profil bilgileri kaydedildi.";
  } finally { state.profileBusy=false; render(); }
}

function startApp() {
  appRoot.innerHTML = '<div class="boot-screen"><img src="./mynassistant-mark.svg" alt="" width="58" height="58"><strong>MynAssistant</strong><span>Firebase bağlantısı kuruluyor…</span><div class="progress" style="width:150px"><span></span></div></div>';
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
  } catch(error) {
    appRoot.className = "app-main";
    appRoot.innerHTML = '<section class="card"><h2>Firebase yapılandırması yüklenemedi</h2><p>firebase-config.js dosyasındaki Web uygulaması bilgilerini kontrol et.</p><p class="muted small">' + esc(error?.message || "") + '</p></section>';
    return;
  }
  getRedirectResult(auth).catch(error=>logIssue("MYN-WEB-AUTH-003","Google girişi","Google giriş yönlendirmesi tamamlanamadı.",error?.code || ""));
  onAuthStateChanged(auth, user => {
    state.user=user;
    if (!user) {
      state.devices=[]; state.profile=null;
      state.deviceUnsubscribe?.(); state.profileUnsubscribe?.();
      state.deviceUnsubscribe=null; state.profileUnsubscribe=null;
    }
    subscribeDevices();
    subscribeProfile();
    render();
  },error=>{
    logIssue("MYN-WEB-AUTH-001","Oturum", "Firebase oturum durumu okunamadı.",error?.code || "");
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
  const button = event.target.closest("[data-page],[data-action],[data-tab],[data-command]");
  if (!button || button.disabled) return;
  const page = button.dataset.page, action = button.dataset.action, tab = button.dataset.tab;
  try {
    if (page) {
      if (page === "auth" && !state.user) state.authMode="login";
      navigate(page);
    } else if (tab) { state.settingsTab=tab; render(); }
    else if (button.dataset.command) {
      const device=currentDevice();
      if (!device || !isOnline(device)) throw new Error("Windows Agent çevrimdışı.");
      await enqueueCommand(device,button.dataset.command,{});
    } else if (action === "drawer-open") { state.drawerOpen=true; render(); }
    else if (action === "drawer-close") { state.drawerOpen=false; render(); }
    else if (action === "toggle-theme") { setTheme(state.theme==="dark"?"light":"dark"); render(); }
    else if (action === "toggle-auth") { state.authMode=state.authMode==="register"?"login":"register"; state.feedback=""; render(); }
    else if (action === "google-login") { await googleLogin(); }
    else if (action === "logout") {
      if (!confirm("MynAssistant hesabından çıkış yapılsın mı?")) return;
      await signOut(auth); navigate("home"); showToast("Çıkış yapıldı.");
    }
    else if (action === "verify-email") {
      if (!state.user) throw new Error("Oturum gerekli.");
      await sendEmailVerification(state.user); state.profileMessage="Doğrulama e-postası gönderildi."; render();
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
  if (event.target.id==="auth-form") {
    event.preventDefault();
    const button=event.target.querySelector('button[type="submit"]');
    if (button) button.disabled=true;
    try { await handleAuthForm(event.target); }
    catch(error) { state.feedback=error?.message || "Giriş yapılamadı."; logIssue("MYN-WEB-AUTH-002","Hesap",state.feedback,error?.code || ""); render(); }
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
  } else if (el.id==="files-upload-input") {
    const file=el.files?.[0]; if (!file) return;
    try { await uploadPcFile(file); } catch(error) { logIssue("MYN-WEB-FILES-002","Dosya yükleme",error?.message || "Dosya yüklenemedi."); }
    el.value="";
  }
});
document.addEventListener("input", event => {
  if(event.target.id==="command-input") state.commandText=event.target.value;
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
window.addEventListener("beforeunload",()=>stopScreenPreview());

startApp();
if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("./service-worker.js").catch(error => {
    logIssue("MYN-WEB-PWA-001", "Çevrimdışı uygulama", "Uygulama kabuğu kaydedilemedi.", error?.message || "");
  });
}
