/* ══════════════════════════════════════════════════════════════════════
   App.jsx — raiz: seleção de perfil, PIN, shell e navegação
   ══════════════════════════════════════════════════════════════════════ */
const { Icon: AI, PinPad, cap } = window.FinUI;
const { AbaMes, AbaLancamentos, AbaDividas, AbaCartaoDaniel, AbaMetas, AbaCaixinhasInd, AbaChatInd } = window.FinIndividual;
const { ConjuntoApp } = window.FinConjunto;

const PERFIS = {
  daniel: { nome: "Daniel", cor: "var(--daniel)", corHex: "#2F6E63", inicial: "D" },
  bruna: { nome: "Bruna", cor: "var(--bruna)", corHex: "#A8586B", inicial: "B" },
  conjunto: { nome: "Conjunto", cor: "var(--conjunto)", corHex: "#C9A15A", inicial: "❤" },
};

// ── Tela de seleção de perfil ───────────────────────────────────────────
function SelecaoPerfil({ onPick }) {
  const cards = [
    { id: "daniel", sub: "Área individual" },
    { id: "bruna", sub: "Área individual" },
    { id: "conjunto", sub: "Casa & metas do casal" },
  ];
  return (
    <div className="app-bg" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "28px 20px", maxWidth: 480, margin: "0 auto" }}>
      <div className="fade-up" style={{ textAlign: "center", marginBottom: 34 }}>
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 60, height: 60, borderRadius: 18, background: "var(--petroleo)", marginBottom: 16 }}>
          <AI name="coin" size={30} color="var(--dourado)" />
        </div>
        <h1 className="serif" style={{ margin: 0, fontSize: 30, fontWeight: 500, color: "var(--petroleo)" }}>Nossas Finanças</h1>
        <p style={{ margin: "8px 0 0", color: "var(--tinta-suave)", fontSize: 14.5 }}>Rumo à liberdade e às viagens ✈</p>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {cards.map((c, i) => {
          const p = PERFIS[c.id];
          return (
            <button key={c.id} className="card card--stripe fade-up" onClick={() => onPick(c.id)}
              style={{ "--stripe": p.cor, textAlign: "left", padding: "18px 20px", display: "flex", alignItems: "center", gap: 16, animationDelay: `${i * 0.06}s`, cursor: "pointer" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: p.cor, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--serif)", fontSize: 24, fontWeight: 500, flexShrink: 0 }}>
                {p.inicial}
              </div>
              <div style={{ flex: 1 }}>
                <div className="serif" style={{ fontSize: 21, color: "var(--tinta)" }}>{p.nome}</div>
                <div style={{ fontSize: 13, color: "var(--tinta-suave)" }}>{c.sub}</div>
              </div>
              {c.id !== "conjunto" && <AI name={F.hasPin(c.id) ? "lock" : "plus"} size={18} color="var(--tinta-suave)" />}
              <AI name="back" size={18} color="var(--tinta-suave)" style={{ transform: "scaleX(-1)" }} />
            </button>
          );
        })}
      </div>

      <p style={{ textAlign: "center", fontSize: 11.5, color: "var(--tinta-suave)", marginTop: 28, lineHeight: 1.6 }}>
        Daniel e Bruna têm PIN próprio — privacidade entre vocês dois.<br />O Conjunto é aberto para o casal.
      </p>

      {window.FinSync && window.FinSync.user && (
        <button className="btn btn-ghost" style={{ margin: "18px auto 0", fontSize: 12.5, opacity: 0.8 }}
          onClick={() => { if (confirm("Sair da conta neste aparelho?")) window.FinSync.logout(); }}>
          Sair da conta
        </button>
      )}
    </div>
  );
}

// ── Shell da área individual ────────────────────────────────────────────
function AreaIndividual({ perfil, onSair }) {
  const p = PERFIS[perfil];
  const [aba, setAba] = useState("mes");
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((n) => n + 1);

  const isBruna = perfil === "bruna";
  const abas = [
    { id: "mes", label: "Mês", icon: "home" },
    { id: "chat", label: "Assistente", icon: "users" },
    { id: "lanc", label: "Lançar", icon: "list" },
    { id: "caixinhas", label: "Caixinhas", icon: "target" },
    isBruna
      ? { id: "dividas", label: "Dívidas", icon: "snow" }
      : { id: "cartao", label: "Cartão", icon: "card" },
    { id: "metas", label: "Metas", icon: "plane" },
  ];

  return (
    <div className="app-bg" style={{ minHeight: "100dvh" }}>
      <Header perfil={perfil} onSair={onSair} />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 16px 90px" }} key={tick}>
        {aba === "mes" && <AbaMes perfil={perfil} cor={p.cor} refresh={refresh} />}
        {aba === "chat" && <AbaChatInd perfil={perfil} refresh={refresh} />}
        {aba === "lanc" && <AbaLancamentos perfil={perfil} cor={p.cor} refresh={refresh} />}
        {aba === "caixinhas" && <AbaCaixinhasInd perfil={perfil} cor={p.cor} />}
        {aba === "dividas" && isBruna && <AbaDividas cor={p.cor} />}
        {aba === "cartao" && !isBruna && <AbaCartaoDaniel cor={p.cor} />}
        {aba === "metas" && <AbaMetas perfil={perfil} cor={p.cor} />}
      </div>
      <TabBar abas={abas} aba={aba} setAba={setAba} cor={p.cor} />
    </div>
  );
}

function AreaConjunto({ onSair }) {
  return (
    <div className="app-bg" style={{ minHeight: "100dvh" }}>
      <Header perfil="conjunto" onSair={onSair} />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 16px 40px" }}>
        <ConjuntoApp />
      </div>
    </div>
  );
}

function Header({ perfil, onSair }) {
  const p = PERFIS[perfil];
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(246,241,233,.85)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(31,75,68,.08)" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button className="btn btn-ghost" style={{ padding: 8, borderRadius: 10 }} onClick={onSair} aria-label="trocar perfil">
          <AI name="back" size={18} />
        </button>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: p.cor, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--serif)", fontSize: 16, flexShrink: 0 }}>{p.inicial}</div>
        <div style={{ flex: 1 }}>
          <div className="serif" style={{ fontSize: 17, lineHeight: 1 }}>{p.nome}</div>
          <div style={{ fontSize: 11.5, color: "var(--tinta-suave)" }}>{perfil === "conjunto" ? "Casal" : "Área individual"}</div>
        </div>
        <SyncBadge />
      </div>
    </div>
  );
}

// selo de status da sincronização
function SyncBadge() {
  const [status, setStatus] = useState(() => (window.FinSync && window.FinSync.status) || "local");
  useEffect(() => {
    const h = () => setStatus((window.FinSync && window.FinSync.status) || "local");
    window.addEventListener("fin-sync-status", h);
    return () => window.removeEventListener("fin-sync-status", h);
  }, []);
  const map = {
    sincronizado: { cor: "var(--petroleo-2)", txt: "sincronizado", dot: true },
    conectando: { cor: "var(--dourado-2)", txt: "conectando…", dot: true },
    local: { cor: "var(--tinta-suave)", txt: "só neste aparelho", dot: false },
    "sem-sdk": { cor: "var(--tinta-suave)", txt: "offline", dot: false },
    erro: { cor: "var(--coral)", txt: "erro de conexão", dot: false },
  };
  const s = map[status] || map.local;
  return (
    <div title={s.txt} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, color: s.cor, fontWeight: 600, flexShrink: 0 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.cor, boxShadow: s.dot ? `0 0 0 3px ${s.cor}22` : "none" }} />
      <span style={{ whiteSpace: "nowrap" }} className="sync-badge-txt">{s.txt}</span>
    </div>
  );
}

function TabBar({ abas, aba, setAba, cor }) {
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30, background: "rgba(255,255,255,.92)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(31,75,68,.08)" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", padding: "8px 6px calc(8px + env(safe-area-inset-bottom))", overflowX: "auto" }}>
        {abas.map((a) => {
          const active = aba === a.id;
          return (
            <button key={a.id} onClick={() => setAba(a.id)}
              style={{ flex: "1 0 auto", minWidth: 58, background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 4px", color: active ? cor : "var(--tinta-suave)" }}>
              <AI name={a.icon} size={20} color={active ? cor : "var(--tinta-suave)"} />
              <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 500 }}>{a.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Tela de login (email + senha) — só no modo nuvem ────────────────────
function LoginScreen() {
  const [modo, setModo] = useState("entrar"); // "entrar" | "criar"
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const traduzErro = (code) => ({
    "auth/invalid-email": "Email inválido.",
    "auth/user-not-found": "Email ou senha incorretos.",
    "auth/wrong-password": "Email ou senha incorretos.",
    "auth/invalid-credential": "Email ou senha incorretos.",
    "auth/email-already-in-use": "Esse email já tem acesso — use “Entrar”.",
    "auth/weak-password": "A senha precisa de pelo menos 6 caracteres.",
    "auth/missing-password": "Digite a senha.",
    "auth/network-request-failed": "Sem conexão com a internet.",
    "auth/too-many-requests": "Muitas tentativas. Espere um pouco e tente de novo.",
    "auth/operation-not-allowed": "Login por email/senha não está ativado no Firebase.",
  }[code] || "Não foi possível entrar. Tente de novo.");

  const enviar = () => {
    setErro("");
    if (!email.trim()) return setErro("Digite o email.");
    if (senha.length < 6) return setErro("A senha precisa de pelo menos 6 caracteres.");
    setCarregando(true);
    const acao = modo === "criar" ? window.FinSync.signup : window.FinSync.login;
    acao(email, senha)
      .catch((e) => { setErro(traduzErro(e && e.code)); setCarregando(false); });
    // sucesso: onAuthStateChanged troca a tela sozinho
  };

  return (
    <div className="app-bg" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "28px 22px", maxWidth: 440, margin: "0 auto" }}>
      <div className="fade-up" style={{ textAlign: "center", marginBottom: 26 }}>
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 60, height: 60, borderRadius: 18, background: "var(--petroleo)", marginBottom: 16 }}>
          <AI name="lock" size={28} color="var(--dourado)" />
        </div>
        <h1 className="serif" style={{ margin: 0, fontSize: 27, fontWeight: 500, color: "var(--petroleo)" }}>Nossas Finanças</h1>
        <p style={{ margin: "8px 0 0", color: "var(--tinta-suave)", fontSize: 14 }}>
          {modo === "criar" ? "Crie o acesso do casal" : "Entre para acessar seus dados"}
        </p>
      </div>

      <div className="card fade-up" style={{ padding: "22px 20px", display: "grid", gap: 14 }}>
        <label style={{ display: "block" }}>
          <span className="fin-label" style={{ display: "block", marginBottom: 5 }}>Email</span>
          <input className="fin-input" type="email" inputMode="email" autoComplete="username"
            placeholder="voces@email.com" value={email}
            onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label style={{ display: "block" }}>
          <span className="fin-label" style={{ display: "block", marginBottom: 5 }}>Senha</span>
          <input className="fin-input" type="password" autoComplete={modo === "criar" ? "new-password" : "current-password"}
            placeholder="mínimo 6 caracteres" value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") enviar(); }} />
        </label>

        {erro && (
          <div style={{ fontSize: 13, color: "var(--coral)", fontWeight: 600, background: "#FDEEEC", borderRadius: 10, padding: "9px 12px" }}>{erro}</div>
        )}

        <button className="btn btn-primary" style={{ opacity: carregando ? 0.7 : 1 }} disabled={carregando} onClick={enviar}>
          {carregando ? "Aguarde…" : modo === "criar" ? "Criar acesso" : "Entrar"}
        </button>

        <button className="btn btn-ghost" style={{ fontSize: 13.5 }} onClick={() => { setErro(""); setModo(modo === "criar" ? "entrar" : "criar"); }}>
          {modo === "criar" ? "Já temos acesso — entrar" : "Primeira vez? Criar acesso"}
        </button>
      </div>

      <p style={{ textAlign: "center", fontSize: 11.5, color: "var(--tinta-suave)", marginTop: 22, lineHeight: 1.6 }}>
        🔒 Só quem tem a senha acessa os dados na nuvem.<br />Dentro do app, o PIN separa a área de cada um.
      </p>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="app-bg" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <div style={{ width: 46, height: 46, borderRadius: "50%", border: "4px solid rgba(31,75,68,.15)", borderTopColor: "var(--petroleo)", animation: "spin 0.9s linear infinite" }} />
      <div style={{ color: "var(--tinta-suave)", fontSize: 14 }}>Carregando seus dados…</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── App raiz ────────────────────────────────────────────────────────────
function App() {
  const [phase, setPhase] = useState(() => (window.FinSync && window.FinSync.phase) || "local");
  const [ativo, setAtivo] = useState(null);       // perfil liberado
  const [pinFor, setPinFor] = useState(null);      // perfil aguardando PIN
  const [, setDataV] = useState(0);                // bump para re-render em update remoto

  // fases de autenticação/nuvem
  useEffect(() => {
    const h = () => setPhase((window.FinSync && window.FinSync.phase) || "local");
    window.addEventListener("fin-auth-changed", h);
    return () => window.removeEventListener("fin-auth-changed", h);
  }, []);

  // quando a nuvem envia mudanças, re-renderiza a árvore (sem perder a
  // navegação atual: os componentes re-leem o cache local já atualizado)
  useEffect(() => {
    const h = () => setDataV((n) => n + 1);
    window.addEventListener("fin-remote-update", h);
    return () => window.removeEventListener("fin-remote-update", h);
  }, []);

  if (phase === "login") return <LoginScreen />;
  if (phase === "loading" || phase === "conectando") return <LoadingScreen />;

  const pick = (id) => {
    if (id === "conjunto") { setAtivo("conjunto"); return; }
    setPinFor(id);
  };

  return (
    <>
      {!ativo && <SelecaoPerfil onPick={pick} />}
      {ativo === "conjunto" && <AreaConjunto onSair={() => setAtivo(null)} />}
      {ativo && ativo !== "conjunto" && <AreaIndividual perfil={ativo} onSair={() => setAtivo(null)} />}

      {pinFor && (
        <PinPad
          perfil={pinFor}
          cor={PERFIS[pinFor].corHex}
          mode="verify-or-create"
          onSuccess={() => { setAtivo(pinFor); setPinFor(null); }}
          onCancel={() => setPinFor(null)}
        />
      )}
    </>
  );
}

// ── Mount ───────────────────────────────────────────────────────────────
F.seedDemo();
ReactDOM.createRoot(document.getElementById("app")).render(<App />);
