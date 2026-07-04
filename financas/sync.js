/* ══════════════════════════════════════════════════════════════════════
   sync.js — sincronização em tempo real via Firebase Realtime Database
   ────────────────────────────────────────────────────────────────────
   Estratégia: o localStorage continua sendo o cache local síncrono (tudo
   que já existe lê dele sem mudar). Este módulo:
     • espelha cada gravação (store.set) para a nuvem;
     • ouve mudanças da nuvem e escreve no cache local, disparando o
       evento "fin-remote-update" para o app re-renderizar na hora.
   Se não houver config do Firebase, fica desligado e o app roda local.
   ══════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  const LS_PREFIX = "bc.financas.";
  const cfg = window.FIN_FIREBASE_CONFIG || {};
  const temConfig = !!(cfg.apiKey && cfg.databaseURL);
  const temSDK = typeof window.firebase !== "undefined";

  // API pública mínima (fica sempre disponível)
  window.FinSync = {
    enabled: false,
    status: temConfig ? (temSDK ? "conectando" : "sem-sdk") : "local",
    push: function () {},
    onReady: function () {},
  };

  if (!temConfig) return;            // modo local puro
  if (!temSDK) {                     // config existe mas SDK não carregou
    console.warn("[sync] Config do Firebase presente, mas o SDK não carregou (offline?). Rodando local.");
    return;
  }

  // ── codificação de chaves (Firebase não aceita '.', '#', '$', '[', ']', '/') ──
  const enc = (k) => k.replace(/\./g, "~d~");
  const dec = (k) => k.replace(/~d~/g, ".");
  // chaves puramente locais (flags de UI) não vão pra nuvem
  const soLocal = (k) => k.indexOf("bc.financas.") === 0;

  let root = null;
  let aplicandoRemoto = false;

  function push(key, value) {
    if (!root || soLocal(key)) return;
    try {
      root.child(enc(key)).set(value === undefined ? null : value);
    } catch (e) {
      console.warn("[sync] push falhou:", key, e);
    }
  }

  function aplicarSnapshot(data) {
    aplicandoRemoto = true;
    try {
      Object.keys(data || {}).forEach((k) => {
        try {
          localStorage.setItem(LS_PREFIX + dec(k), JSON.stringify(data[k]));
        } catch (e) { /* ignora item inválido */ }
      });
    } finally {
      aplicandoRemoto = false;
    }
    window.dispatchEvent(new Event("fin-remote-update"));
  }

  function iniciarListeners() {
    const db = window.firebase.database();
    root = db.ref("financas");

    // 1ª carga + tempo real: qualquer mudança na nuvem reflete aqui
    root.on(
      "value",
      (snap) => {
        aplicarSnapshot(snap.val() || {});
        window.FinSync.status = "sincronizado";
        window.dispatchEvent(new Event("fin-sync-status"));
      },
      (err) => {
        console.warn("[sync] erro ao ouvir:", err);
        window.FinSync.status = "erro";
        window.dispatchEvent(new Event("fin-sync-status"));
      }
    );

    // empurra o que já existe localmente para a nuvem na primeira vez
    // (só chaves de dados; conflitos são resolvidos pelo snapshot acima)
    empurrarCacheLocalUmaVez();

    window.FinSync.enabled = true;
    window.FinSync.push = push;
    window.FinSync.status = "sincronizado";
    window.dispatchEvent(new Event("fin-sync-status"));
  }

  function empurrarCacheLocalUmaVez() {
    // Só semeia a nuvem se ela ainda não tiver nada, para não sobrescrever
    // dados já sincronizados do outro aparelho.
    root.once("value").then((snap) => {
      if (snap.exists()) return; // nuvem já tem dados → não empurra nada
      for (let i = 0; i < localStorage.length; i++) {
        const full = localStorage.key(i);
        if (!full || full.indexOf(LS_PREFIX) !== 0) continue;
        const key = full.slice(LS_PREFIX.length);
        if (soLocal(key)) continue;
        try {
          root.child(enc(key)).set(JSON.parse(localStorage.getItem(full)));
        } catch (e) { /* ignora */ }
      }
    }).catch(() => {});
  }

  try {
    window.firebase.initializeApp(cfg);
  } catch (e) {
    // initializeApp pode reclamar se chamado 2x; segue mesmo assim
    console.warn("[sync] initializeApp:", e && e.message);
  }

  // Autenticação anônima (se ativada no projeto) protege a leitura contra
  // curiosos aleatórios na internet. Se não estiver ativa, segue sem auth.
  const auth = window.firebase.auth ? window.firebase.auth() : null;
  if (auth) {
    auth
      .signInAnonymously()
      .then(iniciarListeners)
      .catch((e) => {
        console.warn("[sync] auth anônima indisponível, seguindo sem auth:", e && e.code);
        iniciarListeners();
      });
  } else {
    iniciarListeners();
  }
})();
