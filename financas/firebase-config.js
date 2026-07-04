/* ══════════════════════════════════════════════════════════════════════
   firebase-config.js — COLE AQUI a config do seu projeto Firebase
   ────────────────────────────────────────────────────────────────────
   Enquanto os campos estiverem vazios, o app funciona só neste aparelho
   (sem sincronização). Assim que você preencher, Daniel e Bruna passam a
   ver tudo atualizado em tempo real nos dois celulares.

   Como conseguir esses valores (passo a passo em financas/COMO-SINCRONIZAR.md):
   1. Crie um projeto grátis em https://console.firebase.google.com
   2. Ative o "Realtime Database" (modo de teste)
   3. Ative "Authentication" › método "Anônimo"
   4. Em "Configurações do projeto" › "Seus apps" › Web, copie o objeto
      firebaseConfig e cole abaixo (inclusive o databaseURL).
   ══════════════════════════════════════════════════════════════════════ */

window.FIN_FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",   // ex: https://SEU-PROJETO-default-rtdb.firebaseio.com
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};
