/* ══════════════════════════════════════════════════════════════════════
   twofa.jsx — verificação em 2 passos (TOTP, compatível com Google
   Authenticator / Authy / etc.) — pedida toda vez que abre o app.
   Implementação RFC 6238 usando Web Crypto (sem bibliotecas externas).
   ══════════════════════════════════════════════════════════════════════ */

// ── Base32 (RFC 4648) ───────────────────────────────────────────────────
const B32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function base32Encode(bytes) {
  let bits = 0, val = 0, out = "";
  for (const b of bytes) {
    val = (val << 8) | b; bits += 8;
    while (bits >= 5) { out += B32_ALPHABET[(val >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32_ALPHABET[(val << (5 - bits)) & 31];
  return out;
}
function base32Decode(str) {
  str = String(str).toUpperCase().replace(/=+$/, "").replace(/\s/g, "");
  let bits = 0, val = 0; const out = [];
  for (const c of str) {
    const idx = B32_ALPHABET.indexOf(c);
    if (idx < 0) continue;
    val = (val << 5) | idx; bits += 5;
    if (bits >= 8) { out.push((val >>> (bits - 8)) & 0xff); bits -= 8; }
  }
  return new Uint8Array(out);
}

// ── HOTP / TOTP ─────────────────────────────────────────────────────────
async function hotp(secretBytes, counter) {
  const key = await crypto.subtle.importKey(
    "raw", secretBytes, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]
  );
  const buf = new ArrayBuffer(8);
  const dv = new DataView(buf);
  dv.setUint32(0, Math.floor(counter / 0x100000000));
  dv.setUint32(4, counter >>> 0);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, buf));
  const offset = sig[sig.length - 1] & 0xf;
  const bin =
    ((sig[offset] & 0x7f) << 24) |
    ((sig[offset + 1] & 0xff) << 16) |
    ((sig[offset + 2] & 0xff) << 8) |
    (sig[offset + 3] & 0xff);
  return String(bin % 1000000).padStart(6, "0");
}
async function totpAt(secretB32, timeMs) {
  const counter = Math.floor(timeMs / 1000 / 30);
  return hotp(base32Decode(secretB32), counter);
}
// aceita o código atual e ±1 janela (tolerância a relógio dessincronizado)
async function verifyTOTP(secretB32, code) {
  const c = String(code).replace(/\s/g, "");
  if (!/^\d{6}$/.test(c)) return false;
  const now = Date.now();
  for (const d of [-1, 0, 1]) {
    if ((await totpAt(secretB32, now + d * 30000)) === c) return true;
  }
  return false;
}
function gerarSecret() {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}
function agrupar(s) { return (s.match(/.{1,4}/g) || []).join(" "); }

// ── Tela de verificação em 2 passos ─────────────────────────────────────
function TwoFactorScreen({ onPass }) {
  const { Icon: TI } = window.FinUI;
  const jaTem = !!F.get2FASecret();
  const [modo] = useState(jaTem ? "verificar" : "configurar");
  const [novoSecret] = useState(() => (jaTem ? null : gerarSecret()));
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const emailUser =
    (window.FinSync && window.FinSync.user && window.FinSync.user.email) || "casal";
  const otpauth =
    "otpauth://totp/" + encodeURIComponent("Nossas Finanças:" + emailUser) +
    "?secret=" + novoSecret +
    "&issuer=" + encodeURIComponent("Nossas Finanças") +
    "&period=30&digits=6";

  const confirmar = async () => {
    setErro(""); setOcupado(true);
    try {
      const secret = jaTem ? F.get2FASecret() : novoSecret;
      const ok = await verifyTOTP(secret, codigo);
      if (!ok) {
        setErro("Código incorreto ou expirado. Tente o código atual do app.");
        setOcupado(false);
        return;
      }
      if (!jaTem) F.set2FASecret(novoSecret); // grava a chave (sincroniza)
      onPass();
    } catch (e) {
      setErro("Não foi possível verificar. Tente de novo.");
      setOcupado(false);
    }
  };

  const copiar = () => {
    try {
      navigator.clipboard.writeText(novoSecret);
      setCopiado(true); setTimeout(() => setCopiado(false), 1500);
    } catch (e) { /* alguns navegadores bloqueiam */ }
  };

  return (
    <div className="app-bg" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "26px 22px", maxWidth: 440, margin: "0 auto" }}>
      <div className="fade-up" style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 58, height: 58, borderRadius: 18, background: "var(--petroleo)", marginBottom: 14 }}>
          <TI name="lock" size={26} color="var(--dourado)" />
        </div>
        <h1 className="serif" style={{ margin: 0, fontSize: 24, fontWeight: 500, color: "var(--petroleo)" }}>Verificação em 2 passos</h1>
        <p style={{ margin: "8px 0 0", color: "var(--tinta-suave)", fontSize: 13.5 }}>
          {modo === "configurar" ? "Configure uma vez — depois é só o código." : "Digite o código do seu app autenticador"}
        </p>
      </div>

      {modo === "configurar" && (
        <div className="card fade-up" style={{ padding: "18px 18px", marginBottom: 14, fontSize: 13.5, lineHeight: 1.55 }}>
          <b style={{ color: "var(--petroleo)" }}>Como configurar (1 vez só):</b>
          <ol style={{ margin: "10px 0 14px", paddingLeft: 18, color: "var(--tinta)" }}>
            <li style={{ marginBottom: 6 }}>Instale o app <b>Google Authenticator</b> (grátis, na App Store / Play Store).</li>
            <li style={{ marginBottom: 6 }}>Nele, toque em <b>＋ › Inserir chave de configuração</b> e cole a chave abaixo (conta: "Nossas Finanças").</li>
            <li>Digite aqui o código de 6 dígitos que aparecer.</li>
          </ol>

          <div className="fin-label" style={{ marginBottom: 5 }}>Sua chave (os dois celulares usam a mesma)</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <code className="num" style={{ flex: 1, background: "var(--areia)", borderRadius: 10, padding: "10px 12px", fontSize: 15, letterSpacing: 1, wordBreak: "break-all", color: "var(--petroleo)" }}>{agrupar(novoSecret)}</code>
            <button className="btn btn-ghost" style={{ padding: "9px 12px" }} onClick={copiar}>{copiado ? "✓" : "Copiar"}</button>
          </div>
          <a href={otpauth} style={{ display: "inline-block", marginTop: 10, fontSize: 12.5, color: "var(--dourado-2)", fontWeight: 600 }}>
            Abrir direto no autenticador ›
          </a>
        </div>
      )}

      <div className="card fade-up" style={{ padding: "20px 18px", display: "grid", gap: 14 }}>
        <label style={{ display: "block" }}>
          <span className="fin-label" style={{ display: "block", marginBottom: 5 }}>Código de 6 dígitos</span>
          <input className="fin-input num" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
            placeholder="000000" value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyDown={(e) => { if (e.key === "Enter") confirmar(); }}
            style={{ fontSize: 26, letterSpacing: 8, textAlign: "center" }} autoFocus />
        </label>
        {erro && <div style={{ fontSize: 13, color: "var(--coral)", fontWeight: 600, background: "#FDEEEC", borderRadius: 10, padding: "9px 12px" }}>{erro}</div>}
        <button className="btn btn-primary" disabled={ocupado || codigo.length < 6} style={{ opacity: ocupado || codigo.length < 6 ? 0.6 : 1 }} onClick={confirmar}>
          {ocupado ? "Verificando…" : modo === "configurar" ? "Ativar e entrar" : "Verificar"}
        </button>
        <button className="btn btn-ghost" style={{ fontSize: 12.5 }} onClick={() => window.FinSync.logout()}>
          Sair da conta
        </button>
      </div>

      <p style={{ textAlign: "center", fontSize: 11.5, color: "var(--tinta-suave)", marginTop: 20, lineHeight: 1.6 }}>
        🔐 Duas camadas: senha + código que muda a cada 30s.<br />O código é pedido toda vez que o app abre.
      </p>
    </div>
  );
}

window.FinTwoFA = { TwoFactorScreen, verifyTOTP, base32Encode, base32Decode, totpAt };
