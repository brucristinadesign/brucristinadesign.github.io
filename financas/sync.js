/* ══════════════════════════════════════════════════════════════════════
   sync.js — sincronização em tempo real + login (Firebase)
   ────────────────────────────────────────────────────────────────────
   • Sem config do Firebase → modo local (só neste aparelho).
   • Com config → exige LOGIN com email e senha. Só depois de logado os
     dados são lidos/escritos na nuvem, em tempo real.
   • A nuvem é a fonte da verdade: ao logar, o cache local é substituído
     pelo que está na nuvem (evita misturar dados de exemplo antigos).

   Estados (window.FinSync.phase):
     "local"   → sem nuvem, roda local
     "login"   → precisa entrar (email/senha)
     "loading" → logado, baixando os dados
     "ready"   → tudo pronto e sincronizado
   ══════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  const LS_PREFIX = "bc.financas.";
  const cfg = window.FIN_FIREBASE_CONFIG || {};
  const temConfig = !!(cfg.apiKey && cfg.databaseURL);
  const temSDK = typeof window.firebase !== "undefined";

  const S = {
    enabled: false,
    phase: !temConfig || !temSDK ? "local" : "login",
    status: !temConfig ? "local" : !temSDK ? "sem-sdk" : "conectando",
    requiresAuth: temConfig && temSDK,
    user: null,
    push: function () {},
    login: function () { return Promise.reject(new Error("indisponível")); },
    signup: function () { return Promise.reject(new Error("indisponível")); },
    logout: function () {},
  };
  window.FinSync = S;
  const emit = (name) => window.dispatchEvent(new Event(name));

  if (!temConfig) return;                 // modo local puro
  if (!temSDK) {                          // config existe mas SDK não carregou
    console.warn("[sync] SDK do Firebase não carregou (offline?). Rodando local.");
    return;
  }

  // Firebase não aceita '.', '#', '$', '[', ']', '/' nas chaves
  const enc = (k) => k.replace(/\./g, "~d~");
  const dec = (k) => k.replace(/~d~/g, ".");
  const soLocal = (k) => k.indexOf("bc.financas.") === 0;

  let root = null;
  let listenersOn = false;

  function push(key, value) {
    if (!root || !S.enabled || soLocal(key)) return;
    try {
      root.child(enc(key)).set(value === undefined ? null : value);
    } catch (e) {
      console.warn("[sync] push falhou:", key, e);
    }
  }

  function wipeLocalData() {
    const rm = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf(LS_PREFIX) === 0) rm.push(k);
    }
    rm.forEach((k) => localStorage.removeItem(k));
  }

  function aplicarSnapshot(data) {
    // a nuvem é a fonte da verdade: substitui o cache local inteiro
    wipeLocalData();
    Object.keys(data || {}).forEach((k) => {
      try {
        localStorage.setItem(LS_PREFIX + dec(k), JSON.stringify(data[k]));
      } catch (e) { /* ignora item inválido */ }
    });
    emit("fin-remote-update");
  }

  function startListeners() {
    if (listenersOn) return;
    listenersOn = true;
    const db = window.firebase.database();
    root = db.ref("financas");
    let first = true;
    root.on(
      "value",
      (snap) => {
        aplicarSnapshot(snap.val() || {});
        if (first) {
          first = false;
          S.enabled = true;
          S.push = push;
          S.phase = "ready";
          S.status = "sincronizado";
          emit("fin-auth-changed");
        }
        S.status = "sincronizado";
        emit("fin-sync-status");
      },
      (err) => {
        console.warn("[sync] erro ao ouvir:", err && err.code);
        S.status = "erro";
        emit("fin-sync-status");
      }
    );
  }

  function stopListeners() {
    if (root) { try { root.off(); } catch (e) {} }
    root = null;
    listenersOn = false;
    S.enabled = false;
    S.push = function () {};
  }

  try { window.firebase.initializeApp(cfg); } catch (e) {
    console.warn("[sync] initializeApp:", e && e.message);
  }

  const auth = window.firebase.auth();
  try {
    auth.setPersistence(window.firebase.auth.Auth.Persistence.LOCAL);
  } catch (e) { /* mantém padrão */ }

  S.login = (email, senha) => auth.signInWithEmailAndPassword(String(email).trim(), senha);
  S.signup = (email, senha) => auth.createUserWithEmailAndPassword(String(email).trim(), senha);
  S.logout = () => auth.signOut();

  auth.onAuthStateChanged((user) => {
    S.user = user;
    if (user) {
      S.phase = "loading";
      S.status = "conectando";
      emit("fin-auth-changed");
      startListeners();
    } else {
      stopListeners();
      S.phase = "login";
      S.status = "login";
      emit("fin-auth-changed");
      emit("fin-sync-status");
    }
  });
})();
