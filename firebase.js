import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc,
  query, collection, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDtRj126ONxAH6dn0FQularkKC6upPZoJo",
  authDomain: "goal2goat.firebaseapp.com",
  projectId: "goal2goat",
  storageBucket: "goal2goat.firebasestorage.app",
  messagingSenderId: "566382525133",
  appId: "1:566382525133:web:7de499fc2d467680350784"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

/* ─── VALIDATION ─────────────────────────────────────────── */
const V = {
  username: v => {
    if (!v)           return "Nombre de usuario obligatorio.";
    if (v.length < 3) return "Mínimo 3 caracteres.";
    if (v.length > 20)return "Máximo 20 caracteres.";
    if (!/^[a-zA-Z0-9_]+$/.test(v)) return "Solo letras, números y _ (guión bajo).";
    return "";
  },
  email: v => {
    if (!v) return "Correo obligatorio.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Formato de correo no válido.";
    return "";
  },
  password: v => {
    if (!v)           return "Contraseña obligatoria.";
    if (v.length < 8) return "Mínimo 8 caracteres.";
    return "";
  },
};

function $id(id){ return document.getElementById(id); }
function setErr(id, msg){
  const el = $id(id);
  if (!el) return;
  el.textContent = msg || "";
  el.style.display = msg ? "block" : "none";
}
function clearAll(){
  ["loginIdentifierErr","loginPasswordErr","loginGlobalErr",
   "regUsernameErr","regEmailErr","regPasswordErr","regPassword2Err","regGlobalErr"]
  .forEach(id => setErr(id, ""));
}
function setBtnLoading(id, loading){
  const btn = $id(id);
  if (!btn) return;
  btn.disabled = loading;
  const labels = { loginSubmitBtn:"ENTRAR", regSubmitBtn:"CREAR CUENTA" };
  btn.textContent = loading ? "..." : labels[id];
}

/* ─── FIREBASE ERROR MESSAGES ────────────────────────────── */
function fbErr(code){
  return ({
    "auth/email-already-in-use":   "Este correo ya está registrado.",
    "auth/invalid-email":          "Correo no válido.",
    "auth/weak-password":          "Contraseña demasiado débil.",
    "auth/user-not-found":         "Usuario o contraseña incorrectos.",
    "auth/wrong-password":         "Usuario o contraseña incorrectos.",
    "auth/invalid-credential":     "Usuario o contraseña incorrectos.",
    "auth/too-many-requests":      "Demasiados intentos. Espera un momento.",
    "auth/network-request-failed": "Sin conexión. Comprueba tu red.",
  })[code] || "Error inesperado. Inténtalo de nuevo.";
}

/* ─── MODAL ──────────────────────────────────────────────── */
function showAuthModal(tab){
  const overlay = $id("authOverlay");
  if (overlay){ overlay.style.display = "flex"; }
  switchAuthTab(tab || "login");
  clearAll();
}
function closeAuthModal(){
  const overlay = $id("authOverlay");
  if (overlay) overlay.style.display = "none";
  clearAll();
}
function switchAuthTab(tab){
  $id("authLogin").style.display    = tab === "login"    ? "block" : "none";
  $id("authRegister").style.display = tab === "register" ? "block" : "none";
  $id("tabLogin").classList.toggle("auth-tab-active",    tab === "login");
  $id("tabRegister").classList.toggle("auth-tab-active", tab === "register");
}

/* ─── REGISTER ───────────────────────────────────────────── */
async function submitRegister(){
  const username = $id("regUsername").value.trim();
  const email    = $id("regEmail").value.trim();
  const pass     = $id("regPassword").value;
  const pass2    = $id("regPassword2").value;

  const uErr  = V.username(username);
  const eErr  = V.email(email);
  const pErr  = V.password(pass);
  const p2Err = pass !== pass2 ? "Las contraseñas no coinciden." : "";

  setErr("regUsernameErr", uErr);
  setErr("regEmailErr",    eErr);
  setErr("regPasswordErr", pErr);
  setErr("regPassword2Err",p2Err);
  setErr("regGlobalErr",   "");

  if (uErr || eErr || pErr || p2Err) return;

  setBtnLoading("regSubmitBtn", true);
  try {
    // Check username uniqueness
    const q = query(collection(db,"users"), where("username_lower","==",username.toLowerCase()));
    const snap = await getDocs(q);
    if (!snap.empty){
      setErr("regUsernameErr","Este nombre de usuario ya está en uso.");
      setBtnLoading("regSubmitBtn", false);
      return;
    }
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await setDoc(doc(db,"users", cred.user.uid),{
      username,
      username_lower: username.toLowerCase(),
      email,
      createdAt: new Date().toISOString(),
      stats:{ gamesPlayed:0, wins:0, bestScore:0 }
    });
    closeAuthModal();
  } catch(err){
    setErr("regGlobalErr", fbErr(err.code));
    setBtnLoading("regSubmitBtn", false);
  }
}

/* ─── LOGIN ──────────────────────────────────────────────── */
async function submitLogin(){
  const identifier = $id("loginIdentifier").value.trim();
  const pass       = $id("loginPassword").value;

  setErr("loginIdentifierErr",""); setErr("loginPasswordErr",""); setErr("loginGlobalErr","");

  if (!identifier){ setErr("loginIdentifierErr","Campo obligatorio."); return; }
  if (!pass)       { setErr("loginPasswordErr","Campo obligatorio."); return; }

  setBtnLoading("loginSubmitBtn", true);
  try {
    let email = identifier;
    if (!identifier.includes("@")){
      const q = query(collection(db,"users"), where("username_lower","==",identifier.toLowerCase()));
      const snap = await getDocs(q);
      if (snap.empty){
        setErr("loginIdentifierErr","Usuario no encontrado.");
        setBtnLoading("loginSubmitBtn", false);
        return;
      }
      email = snap.docs[0].data().email;
    }
    await signInWithEmailAndPassword(auth, email, pass);
    closeAuthModal();
  } catch(err){
    setErr("loginGlobalErr", fbErr(err.code));
    setBtnLoading("loginSubmitBtn", false);
  }
}

/* ─── LOGOUT ─────────────────────────────────────────────── */
async function authLogout(){ await signOut(auth); }

/* ─── AUTH STATE ─────────────────────────────────────────── */
onAuthStateChanged(auth, async user => {
  const authBtn    = $id("authBtn");
  const userInfo   = $id("headerUserInfo");
  const usernameEl = $id("headerUsername");
  if (user){
    const snap = await getDoc(doc(db,"users", user.uid));
    const username = snap.exists() ? snap.data().username : user.email;
    if (authBtn)    authBtn.style.display    = "none";
    if (userInfo)   userInfo.style.display   = "flex";
    if (usernameEl) usernameEl.textContent   = "👤 " + username;
    window.currentUsername = username;
  } else {
    if (authBtn)    authBtn.style.display    = "";
    if (userInfo)   userInfo.style.display   = "none";
    window.currentUsername = null;
  }
});

/* ─── EXPOSE TO HTML (onclick handlers) ──────────────────── */
window.showAuthModal   = showAuthModal;
window.closeAuthModal  = closeAuthModal;
window.switchAuthTab   = switchAuthTab;
window.submitLogin     = submitLogin;
window.submitRegister  = submitRegister;
window.authLogout      = authLogout;

/* ─── CLOSE ON BACKDROP CLICK ────────────────────────────── */
document.addEventListener("click", e => {
  const overlay = $id("authOverlay");
  if (overlay && e.target === overlay) closeAuthModal();
});
