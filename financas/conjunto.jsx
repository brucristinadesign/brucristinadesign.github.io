/* ══════════════════════════════════════════════════════════════════════
   conjunto.jsx — área Conjunto (conta ÚNICA do casal, modelo Noh)
   Início · Lançamentos · Caixinhas · Metas · Patrimônio
   Caixinhas = potes de organização (Aluguel, Água, Cartão Noh...), com
   valor planejado no mês → rateio de quanto cada um envia.
   ══════════════════════════════════════════════════════════════════════ */
const { Icon: CI, Money: CM, Card: CardC, Field: CFld, Modal: CMdl,
  PathProgress: CPP, MiniBar: CMB, Donut: CDn, LineChart: CLC } = window.FinUI;

const EMOJIS = ["🏠", "💧", "⚡", "🌐", "🛒", "💳", "🐾", "🛡️", "🚗", "🎉", "❤️", "📦", "🍽️", "📱", "🎓", "🎁", "✈️", "⛽", "🏥", "👕", "💄", "🧾", "🔧", "📚", "🎬", "☕", "🏋️", "💊"];
const CORES = ["#18211D", "#CDEA46", "#D9D3F7", "#F5CDA8", "#8FD3B3", "#DD7E9C", "#6B62C6", "#F6E488", "#9AD9C9", "#EC6A54", "#B6D62F"];
const CAIXINHAS_SUGERIDAS = [
  { nome: "Aluguel", emoji: "🏠", cor: "#18211D" },
  { nome: "Água", emoji: "💧", cor: "#9AD9C9" },
  { nome: "Energia", emoji: "⚡", cor: "#F6E488" },
  { nome: "Internet", emoji: "🌐", cor: "#6B62C6" },
  { nome: "Mercado", emoji: "🛒", cor: "#CDEA46" },
  { nome: "Cartão Noh", emoji: "💳", cor: "#DD7E9C" },
  { nome: "Pets", emoji: "🐾", cor: "#F5CDA8" },
  { nome: "Segurança", emoji: "🛡️", cor: "#8FD3B3" },
  { nome: "Transporte", emoji: "🚗", cor: "#D9D3F7" },
  { nome: "Lazer", emoji: "🎉", cor: "#F6E488" },
  { nome: "Saúde", emoji: "❤️", cor: "#EC6A54" },
  { nome: "Outros", emoji: "📦", cor: "#7A847F" },
];

function CaixaBadge({ cx, size = 38 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.3, background: (cx?.cor || "#5C6B67") + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.5, flexShrink: 0 }}>
      {cx?.emoji || "📦"}
    </div>
  );
}
function fullMonthC(mk) { const [y, m] = mk.split("-"); const n = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]; return `${n[Number(m) - 1]} ${y}`; }
function nextMonthC(mk) { let [y, m] = mk.split("-").map(Number); m++; if (m === 13) { m = 1; y++; } return `${y}-${String(m).padStart(2, "0")}`; }
const somaV = (arr) => arr.reduce((s, t) => s + (Number(t.valor) || 0), 0);
function shiftMonthISO(iso, n) { const d = new Date(iso + "T00:00:00"); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0, 10); }

// mapa de caixinhas por id e por nome (fallback p/ dados sem id)
function mapaCaixas() {
  const caixas = F.getCaixinhas();
  const byId = {}, byNome = {};
  caixas.forEach((c) => { byId[c.id] = c; byNome[c.nome] = c; });
  return { caixas, byId, byNome };
}
function resolveCaixa(t, m) { return (t.caixinha && m.byId[t.caixinha]) || m.byNome[t.categoria] || null; }

// ── App do Conjunto ─────────────────────────────────────────────────────
function ConjuntoApp() {
  const [aba, setAba] = useState("inicio");
  const [mes, setMes] = useState(F.currentMonth());
  const [, force] = useState(0);
  const reload = () => force((n) => n + 1);

  const abas = [
    { id: "inicio", label: "Início", icon: "home" },
    { id: "chat", label: "Assistente", icon: "users" },
    { id: "lancamentos", label: "Lançamentos", icon: "list" },
    { id: "caixinhas", label: "Caixinhas", icon: "target" },
    { id: "metas", label: "Metas", icon: "plane" },
    { id: "patrimonio", label: "Patrimônio", icon: "coin" },
  ];
  const temMes = aba === "inicio" || aba === "lancamentos";

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 2 }}>
        {abas.map((a) => (
          <button key={a.id} className={`chip ${aba === a.id ? "active" : ""}`} style={{ display: "flex", alignItems: "center", gap: 6, flex: "0 0 auto" }} onClick={() => setAba(a.id)}>
            <CI name={a.icon} size={15} color={aba === a.id ? "#fff" : "var(--tinta-suave)"} /> {a.label}
          </button>
        ))}
      </div>

      {temMes && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <button className="btn btn-ghost" style={{ padding: "6px 12px" }} onClick={() => setMes(F.prevMonthKey(mes))}>‹</button>
          <span className="serif" style={{ fontSize: 16, textTransform: "capitalize" }}>{fullMonthC(mes)}</span>
          <button className="btn btn-ghost" style={{ padding: "6px 12px", opacity: mes >= F.currentMonth() ? 0.35 : 1 }} disabled={mes >= F.currentMonth()} onClick={() => setMes(nextMonthC(mes))}>›</button>
        </div>
      )}

      {aba === "inicio" && <AbaInicio mes={mes} reload={reload} />}
      {aba === "chat" && window.FinAssist && <window.FinAssist.ChatAssistente reload={reload} />}
      {aba === "lancamentos" && <AbaLancamentosConj mes={mes} reload={reload} />}
      {aba === "caixinhas" && <AbaCaixinhas reload={reload} />}
      {aba === "metas" && <AbaMetasConjunto reload={reload} />}
      {aba === "patrimonio" && <AbaPatrimonio />}
    </div>
  );
}

// ── Início ──────────────────────────────────────────────────────────────
function AbaInicio({ mes, reload }) {
  const [, force] = useState(0);
  const rl = () => { force((n) => n + 1); reload && reload(); };
  const geral = F.saldoConjuntoGeral();
  const m = mapaCaixas();

  const doMes = F.getConjTx().filter((t) => F.monthKey(t.data) === mes);
  const recPagas = doMes.filter((t) => t.tipo === "receita" && t.status !== "pendente");
  const despPagas = doMes.filter((t) => t.tipo !== "receita" && t.status !== "pendente");
  const pendentes = doMes.filter((t) => t.tipo !== "receita" && t.status === "pendente").sort((a, b) => (a.data < b.data ? -1 : 1));
  const entrouMes = somaV(recPagas), saiuMes = somaV(despPagas);

  // donut por caixinha
  const porCaixa = {};
  despPagas.forEach((t) => {
    const cx = resolveCaixa(t, m);
    const nome = cx ? cx.nome : "Sem caixinha";
    if (!porCaixa[nome]) porCaixa[nome] = { value: 0, color: cx ? cx.cor : "#9AA6A2", emoji: cx ? cx.emoji : "📦" };
    porCaixa[nome].value += Number(t.valor) || 0;
  });
  const catData = Object.entries(porCaixa).sort((a, b) => b[1].value - a[1].value).map(([label, o]) => ({ label, value: o.value, color: o.color, emoji: o.emoji }));

  const marcarPago = (id) => { F.saveConjTx(F.getConjTx().map((t) => (t.id === id ? { ...t, status: "pago" } : t))); rl(); };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <CardC stripe="var(--conjunto)" style={{ padding: "20px 18px" }}>
        <div style={{ fontSize: 12, color: "var(--tinta-suave)", fontWeight: 600 }}>SALDO DO CASAL</div>
        <div style={{ marginTop: 5 }}><CM value={geral.saldo} size={38} sign color={geral.saldo >= 0 ? "var(--petroleo)" : "var(--coral)"} /></div>
        <div style={{ fontSize: 11.5, color: "var(--tinta-suave)", marginTop: 4 }}>tudo que entrou − tudo que saiu (conta conjunta)</div>
      </CardC>

      <div style={{ display: "flex", gap: 12 }}>
        <CardC style={{ flex: 1, padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--tinta-suave)" }}><span style={{ width: 8, height: 8, borderRadius: 8, background: "var(--petroleo-2)" }} /> Entrou</div>
          <CM value={entrouMes} size={20} color="var(--petroleo-2)" />
        </CardC>
        <CardC style={{ flex: 1, padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--tinta-suave)" }}><span style={{ width: 8, height: 8, borderRadius: 8, background: "var(--coral)" }} /> Saiu</div>
          <CM value={saiuMes} size={20} color="var(--coral)" />
        </CardC>
      </div>

      {pendentes.length > 0 && (
        <CardC style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 600, marginBottom: 10 }}>
            <CI name="bell" size={16} color="var(--coral)" /> A pagar
            <span style={{ marginLeft: "auto", color: "var(--coral)" }} className="num">{F.fmt(somaV(pendentes))}</span>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {pendentes.map((t) => {
              const cx = resolveCaixa(t, m);
              return (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <CaixaBadge cx={cx} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{cx ? cx.nome : t.categoria || "Despesa"}</div>
                    <div style={{ fontSize: 11, color: "var(--tinta-suave)" }}>{F.fmtDate(t.data)}</div>
                  </div>
                  <span className="num" style={{ color: "var(--coral)", fontSize: 14 }}>{F.fmt(t.valor)}</span>
                  <button className="btn btn-gold" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => marcarPago(t.id)}>paguei</button>
                </div>
              );
            })}
          </div>
        </CardC>
      )}

      <CardC style={{ padding: 18 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 10 }}>Para onde foi o dinheiro</div>
        {catData.length ? (
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <CDn data={catData} />
            <div style={{ flex: 1, minWidth: 150, display: "grid", gap: 8 }}>
              {catData.map((d, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <span style={{ fontSize: 15 }}>{d.emoji}</span>
                  <span style={{ flex: 1 }}>{d.label}</span>
                  <span className="num">{F.fmt(d.value)}</span>
                  <span style={{ fontSize: 11, color: "var(--tinta-suave)", width: 32, textAlign: "right" }}>{Math.round((d.value / saiuMes) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : <div style={{ color: "var(--tinta-suave)", fontSize: 13.5, padding: "8px 0" }}>Nenhuma despesa neste mês ainda.</div>}
      </CardC>
    </div>
  );
}

// ── Lançamentos ─────────────────────────────────────────────────────────
function AbaLancamentosConj({ mes, reload }) {
  const [, force] = useState(0);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [fTipo, setFTipo] = useState(null);
  const [fCaixa, setFCaixa] = useState(null);
  const [fTag, setFTag] = useState(null);
  const rl = () => { force((n) => n + 1); reload && reload(); };
  const m = mapaCaixas();

  const todas = F.getConjTx().filter((t) => F.monthKey(t.data) === mes).sort((a, b) => (a.data < b.data ? 1 : -1));
  const caixasPresentes = Array.from(new Set(todas.filter((t) => t.tipo !== "receita").map((t) => { const c = resolveCaixa(t, m); return c ? c.id : null; }).filter(Boolean)));
  const tagsPresentes = Array.from(new Set(todas.flatMap((t) => t.tags || [])));

  let lista = todas;
  if (fTipo) lista = lista.filter((t) => (t.tipo || "despesa") === fTipo);
  if (fCaixa) lista = lista.filter((t) => { const c = resolveCaixa(t, m); return c && c.id === fCaixa; });
  if (fTag) lista = lista.filter((t) => (t.tags || []).includes(fTag));

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <button className="btn btn-primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => { setEditing(null); setOpen(true); }}>
        <CI name="plus" size={18} color="#fff" /> Novo lançamento
      </button>

      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
        <button className={`chip ${!fTipo && !fCaixa ? "active" : ""}`} style={{ flex: "0 0 auto" }} onClick={() => { setFTipo(null); setFCaixa(null); }}>Tudo</button>
        <button className={`chip ${fTipo === "receita" ? "active" : ""}`} style={{ flex: "0 0 auto" }} onClick={() => { setFTipo(fTipo === "receita" ? null : "receita"); setFCaixa(null); }}>Entrou</button>
        <button className={`chip ${fTipo === "despesa" ? "active" : ""}`} style={{ flex: "0 0 auto" }} onClick={() => { setFTipo(fTipo === "despesa" ? null : "despesa"); }}>Saiu</button>
        {caixasPresentes.map((cid) => { const c = m.byId[cid]; if (!c) return null; return (
          <button key={cid} className={`chip ${fCaixa === cid ? "active" : ""}`} style={{ flex: "0 0 auto", display: "flex", alignItems: "center", gap: 5 }} onClick={() => { setFCaixa(fCaixa === cid ? null : cid); setFTipo(null); }}>
            <span>{c.emoji}</span> {c.nome}
          </button>
        ); })}
      </div>
      {tagsPresentes.length > 0 && (
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          {tagsPresentes.map((tg) => (
            <button key={tg} className={`chip ${fTag === tg ? "active" : ""}`} style={{ flex: "0 0 auto", display: "flex", alignItems: "center", gap: 5 }} onClick={() => setFTag(fTag === tg ? null : tg)}>
              <CI name="tag" size={12} color={fTag === tg ? "#fff" : "var(--dourado-2)"} /> {tg}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gap: 8 }}>
        {lista.length === 0 && <div style={{ color: "var(--tinta-suave)", textAlign: "center", padding: 16, fontSize: 14 }}>Nada por aqui.</div>}
        {lista.map((t) => {
          const receita = t.tipo === "receita";
          const pend = t.status === "pendente";
          const cx = resolveCaixa(t, m);
          return (
            <CardC key={t.id} style={{ padding: "11px 13px", display: "flex", alignItems: "center", gap: 11, cursor: "pointer", opacity: pend ? 0.72 : 1 }} onClick={() => { setEditing(t); setOpen(true); }}>
              {receita
                ? <div style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(46,101,92,.14)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><CI name="coin" size={19} color="var(--petroleo-2)" /></div>
                : <CaixaBadge cx={cx} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 500, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  {receita ? "Entrada" : (cx ? cx.nome : t.categoria || "Despesa")}
                  {t.parcela && <span style={{ fontSize: 9.5, background: "rgba(31,75,68,.1)", color: "var(--tinta-suave)", padding: "1px 6px", borderRadius: 6, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3 }}><CI name="card" size={9} color="var(--tinta-suave)" />{t.parcela}</span>}
                  {pend && <span style={{ fontSize: 9.5, background: "rgba(232,106,92,.16)", color: "var(--coral)", padding: "1px 6px", borderRadius: 6, fontWeight: 700 }}>A PAGAR</span>}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--tinta-suave)", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
                  <span>{F.fmtDate(t.data)}</span>
                  {(t.tags || []).map((tg) => (
                    <span key={tg} style={{ background: "rgba(201,161,90,.16)", color: "var(--dourado-2)", padding: "0px 6px", borderRadius: 6, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3 }}>
                      <CI name="tag" size={9} color="var(--dourado-2)" />{tg}
                    </span>
                  ))}
                </div>
              </div>
              <CM value={t.valor} size={17} sign={false} color={receita ? "var(--petroleo-2)" : "var(--petroleo)"} />
            </CardC>
          );
        })}
      </div>

      <CMdl open={open} onClose={() => setOpen(false)} title={editing ? "Editar lançamento" : "Novo lançamento"} accent="var(--conjunto)">
        <ConjTxForm initial={editing} dataMes={mes}
          onSave={(d) => {
            const arr = Array.isArray(d) ? d : [d];
            F.registrarTags(arr[0] && arr[0].tags);
            let list = F.getConjTx();
            if (editing && !Array.isArray(d)) list = list.map((x) => x.id === editing.id ? { ...x, ...d } : x);
            else arr.forEach((it) => list.push({ id: F.uid(), ...it }));
            F.saveConjTx(list); setOpen(false); rl();
          }}
          onDelete={editing ? () => { F.saveConjTx(F.getConjTx().filter((x) => x.id !== editing.id)); setOpen(false); rl(); } : null} />
      </CMdl>
    </div>
  );
}

// ── Formulário rico (com seleção de caixinha) ───────────────────────────
function ConjTxForm({ initial, dataMes, onSave, onDelete }) {
  const [tipo, setTipo] = useState(initial?.tipo || "despesa");
  const [valor, setValor] = useState(initial?.valor ?? "");
  const [data, setData] = useState(initial?.data || (dataMes ? dataMes + "-" + String(new Date().getDate()).padStart(2, "0") : F.todayISO()));
  const [status, setStatus] = useState(initial?.status || "pago");
  const [tags, setTags] = useState(initial?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const existentesInit = F.getCaixinhas();
  const [caixaSel, setCaixaSel] = useState(initial?.caixinha || (existentesInit.find((c) => c.nome === initial?.categoria)?.id) || null);
  const [novaOpen, setNovaOpen] = useState(false);
  const [novaNome, setNovaNome] = useState("");
  const [novaEmoji, setNovaEmoji] = useState("📦");
  const [parcelado, setParcelado] = useState(false);
  const [nParc, setNParc] = useState("2");

  const existentes = F.getCaixinhas();
  const nomesEx = new Set(existentes.map((c) => c.nome));
  const sugeridas = CAIXINHAS_SUGERIDAS.filter((s) => !nomesEx.has(s.nome));

  const sugestoesTag = F.getConjTags().filter((t) => !tags.includes(t)).slice(0, 8);
  const addTag = (raw) => { const v = String(raw).trim().replace(/,$/, ""); if (v && !tags.includes(v)) setTags([...tags, v]); setTagInput(""); };

  const criarNova = () => {
    const nome = novaNome.trim();
    if (!nome) return;
    const nova = { id: F.uid(), nome, emoji: novaEmoji, cor: CORES[F.getCaixinhas().length % CORES.length], planejado: 0 };
    F.saveCaixinhas([...F.getCaixinhas(), nova]);
    setCaixaSel(nova.id); setNovaOpen(false); setNovaNome(""); setNovaEmoji("📦");
  };

  const save = () => {
    const v = parseFloat(String(valor).replace(",", "."));
    if (!v || v <= 0) return;
    let caixinhaId = null, nomeCat = "Entrada";
    if (tipo === "despesa") {
      let sel = caixaSel;
      // se for sugerida ainda não criada, cria agora
      if (typeof sel === "string" && sel.startsWith("sug:")) {
        const s = CAIXINHAS_SUGERIDAS.find((x) => x.nome === sel.slice(4));
        const nova = { id: F.uid(), nome: s.nome, emoji: s.emoji, cor: s.cor, planejado: 0 };
        F.saveCaixinhas([...F.getCaixinhas(), nova]);
        sel = nova.id;
      }
      const cx = F.getCaixinhas().find((c) => c.id === sel);
      caixinhaId = cx ? cx.id : null;
      nomeCat = cx ? cx.nome : "Outros";
    }
    // compra parcelada: cria uma despesa por mês (as futuras como "a pagar")
    if (tipo === "despesa" && parcelado && !initial) {
      const n = Math.min(48, Math.max(2, parseInt(nParc, 10) || 2));
      const centavos = Math.round(v * 100);
      const base = Math.floor(centavos / n);
      const grupo = F.uid();
      const items = [];
      for (let i = 0; i < n; i++) {
        const val = (i === n - 1 ? centavos - base * (n - 1) : base) / 100;
        items.push({ tipo: "despesa", valor: val, caixinha: caixinhaId, categoria: nomeCat, data: shiftMonthISO(data, i), status: i === 0 ? status : "pendente", tags, parcela: `${i + 1}/${n}`, grupoParcela: grupo });
      }
      onSave(items);
      return;
    }
    onSave({ tipo, valor: v, caixinha: caixinhaId, categoria: nomeCat, data, status: tipo === "receita" ? "pago" : status, tags });
  };

  return (
    <div style={{ display: "grid", gap: 15 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {[["despesa", "Saiu (despesa)"], ["receita", "Entrou (receita)"]].map(([id, lbl]) => (
          <button key={id} className={`chip ${tipo === id ? "active" : ""}`} style={{ flex: 1, padding: 10 }} onClick={() => setTipo(id)}>{lbl}</button>
        ))}
      </div>

      <CFld label="Valor (R$)">
        <input className="fin-input num" inputMode="decimal" placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value)} style={{ fontSize: 24 }} autoFocus />
      </CFld>

      {tipo === "despesa" && (
        <div>
          <span className="fin-label" style={{ display: "block", marginBottom: 8 }}>Caixinha</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {existentes.map((c) => {
              const sel = caixaSel === c.id;
              return (
                <button key={c.id} onClick={() => setCaixaSel(c.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 12, border: `1.5px solid ${sel ? c.cor : "rgba(31,75,68,.14)"}`, background: sel ? c.cor + "18" : "#fff", fontSize: 13, fontWeight: sel ? 600 : 500, cursor: "pointer" }}>
                  <span style={{ fontSize: 16 }}>{c.emoji}</span> {c.nome}
                </button>
              );
            })}
            {sugeridas.map((s) => {
              const key = "sug:" + s.nome;
              const sel = caixaSel === key;
              return (
                <button key={key} onClick={() => setCaixaSel(key)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 12, border: `1.5px dashed ${sel ? s.cor : "rgba(31,75,68,.18)"}`, background: sel ? s.cor + "18" : "transparent", fontSize: 13, color: "var(--tinta-suave)", cursor: "pointer" }}>
                  <span style={{ fontSize: 16 }}>{s.emoji}</span> {s.nome}
                </button>
              );
            })}
            <button onClick={() => setNovaOpen(!novaOpen)} className="chip" style={{ padding: "8px 12px", borderStyle: "dashed" }}>+ nova</button>
          </div>

          {novaOpen && (
            <div style={{ marginTop: 10, background: "var(--areia)", borderRadius: 12, padding: 12, display: "grid", gap: 10 }}>
              <input className="fin-input" placeholder="Nome da caixinha (ex: Farmácia)" value={novaNome} onChange={(e) => setNovaNome(e.target.value)} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 96, overflowY: "auto" }}>
                {EMOJIS.map((e) => (
                  <button key={e} onClick={() => setNovaEmoji(e)} style={{ fontSize: 20, width: 38, height: 38, borderRadius: 10, border: novaEmoji === e ? "2px solid var(--petroleo)" : "1px solid rgba(31,75,68,.12)", background: "#fff", cursor: "pointer" }}>{e}</button>
                ))}
              </div>
              <button className="btn btn-primary" onClick={criarNova}>Criar caixinha</button>
            </div>
          )}
        </div>
      )}

      {/* tags */}
      <div>
        <span className="fin-label" style={{ display: "block", marginBottom: 6 }}>Tags (opcional)</span>
        {tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {tags.map((tg) => (
              <span key={tg} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(201,161,90,.18)", color: "var(--dourado-2)", padding: "4px 8px", borderRadius: 8, fontSize: 12.5, fontWeight: 600 }}>
                <CI name="tag" size={11} color="var(--dourado-2)" />{tg}
                <button onClick={() => setTags(tags.filter((x) => x !== tg))} style={{ background: "none", border: "none", color: "var(--dourado-2)", cursor: "pointer", padding: 0, display: "flex" }}><CI name="close" size={12} /></button>
              </span>
            ))}
          </div>
        )}
        <input className="fin-input" placeholder="digite e aperte Enter" value={tagInput}
          onChange={(e) => { const v = e.target.value; if (v.endsWith(",")) addTag(v); else setTagInput(v); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(tagInput); } }} />
        {sugestoesTag.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {sugestoesTag.map((tg) => <button key={tg} className="chip" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => addTag(tg)}>+ {tg}</button>)}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><CFld label="Data"><input type="date" className="fin-input" value={data} onChange={(e) => setData(e.target.value)} /></CFld></div>
        {tipo === "despesa" && (
          <div style={{ flex: 1 }}>
            <CFld label="Status">
              <div style={{ display: "flex", gap: 8 }}>
                {[["pago", "Pago"], ["pendente", "A pagar"]].map(([id, lbl]) => (
                  <button key={id} className={`chip ${status === id ? "active" : ""}`} style={{ flex: 1, padding: 10 }} onClick={() => setStatus(id)}>{lbl}</button>
                ))}
              </div>
            </CFld>
          </div>
        )}
      </div>

      {/* compra parcelada (cartão) */}
      {tipo === "despesa" && !initial && (
        <div style={{ background: "var(--areia)", borderRadius: 12, padding: "12px 14px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input type="checkbox" checked={parcelado} onChange={(e) => setParcelado(e.target.checked)} style={{ width: 18, height: 18, accentColor: "var(--petroleo)" }} />
            <CI name="card" size={17} color="var(--petroleo)" />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Compra parcelada no cartão</span>
          </label>
          {parcelado && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 13, color: "var(--tinta-suave)" }}>Nº de parcelas</span>
                <input className="fin-input num" inputMode="numeric" value={nParc} onChange={(e) => setNParc(e.target.value.replace(/\D/g, "").slice(0, 2))} style={{ width: 72, textAlign: "center", fontSize: 18 }} />
              </div>
              <div style={{ fontSize: 12.8, color: "var(--petroleo)", marginTop: 10, fontWeight: 600 }}>
                {(() => { const n = Math.min(48, Math.max(2, parseInt(nParc, 10) || 2)); const v = parseFloat(String(valor).replace(",", ".")) || 0; return v > 0 ? `${n}× de ${F.fmt(v / n)}` : "Digite o valor total da compra acima"; })()}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--tinta-suave)", marginTop: 4 }}>
                A 1ª parcela na data escolhida; as próximas entram como “A pagar” nos meses seguintes.
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 2 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={save}>Salvar</button>
        {onDelete && <button className="btn btn-danger" onClick={onDelete}><CI name="trash" size={18} /></button>}
      </div>
    </div>
  );
}

// ── Caixinhas: planejado do mês + rateio (quanto cada um envia) ─────────
function AbaCaixinhas({ reload }) {
  const [, force] = useState(0);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [cfgOpen, setCfgOpen] = useState(false);
  const rl = () => { force((n) => n + 1); reload && reload(); };
  const mes = F.currentMonth();

  const caixas = F.getCaixinhas();
  const rateio = F.rateioMensal();

  const addSugerida = (s) => {
    F.saveCaixinhas([...F.getCaixinhas(), { id: F.uid(), nome: s.nome, emoji: s.emoji, cor: s.cor, planejado: 0 }]);
    rl();
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {/* rateio */}
      <CardC stripe="var(--conjunto)" style={{ padding: "18px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--tinta-suave)", fontWeight: 600 }}>PLANEJADO DO MÊS</div>
            <CM value={rateio.total} size={30} color="var(--petroleo)" />
          </div>
          <button className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }} onClick={() => setCfgOpen(true)}><CI name="gear" size={15} /> Divisão</button>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <div style={{ flex: 1, background: "rgba(168,88,107,.09)", borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontSize: 11.5, color: "var(--bruna)", fontWeight: 700 }}>BRUNA ENVIA</div>
            <div className="num" style={{ fontSize: 19, color: "var(--tinta)" }}>{F.fmt(rateio.enviaBruna)}</div>
          </div>
          <div style={{ flex: 1, background: "rgba(47,110,99,.09)", borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontSize: 11.5, color: "var(--daniel)", fontWeight: 700 }}>DANIEL ENVIA</div>
            <div className="num" style={{ fontSize: 19, color: "var(--tinta)" }}>{F.fmt(rateio.enviaDaniel)}</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: "var(--tinta-suave)", marginTop: 8, textAlign: "center" }}>
          divisão {rateio.cfg.modoDivisao === "50-50" ? "50 / 50" : `${rateio.cfg.percentualBruna}% Bruna · ${rateio.cfg.percentualDaniel}% Daniel`}
        </div>
      </CardC>

      {caixas.length === 0 && (
        <CardC style={{ padding: 16 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 10 }}>Comece pelas caixinhas de vocês:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {CAIXINHAS_SUGERIDAS.map((s) => (
              <button key={s.nome} className="chip" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px" }} onClick={() => addSugerida(s)}>
                <span style={{ fontSize: 16 }}>{s.emoji}</span> + {s.nome}
              </button>
            ))}
          </div>
        </CardC>
      )}

      {/* grade de caixinhas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {caixas.map((c) => {
          const gasto = F.gastoCaixinha(c.id, mes);
          const plan = Number(c.planejado) || 0;
          const pct = plan > 0 ? Math.min(100, (gasto / plan) * 100) : 0;
          const estourou = plan > 0 && gasto > plan;
          return (
            <CardC key={c.id} style={{ padding: 14, cursor: "pointer" }} onClick={() => { setEditing(c); setOpen(true); }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CaixaBadge cx={c} size={34} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.nome}</div>
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 10.5, color: "var(--tinta-suave)" }}>planejado</div>
                <div className="num" style={{ fontSize: 17, color: "var(--petroleo)" }}>{plan > 0 ? F.fmt(plan) : "—"}</div>
              </div>
              {plan > 0 && (
                <div style={{ marginTop: 8 }}>
                  <CMB pct={pct} color={estourou ? "var(--coral)" : "var(--conjunto)"} height={6} />
                  <div style={{ fontSize: 10.5, color: estourou ? "var(--coral)" : "var(--tinta-suave)", marginTop: 4 }}>gasto {F.fmt(gasto)}</div>
                </div>
              )}
            </CardC>
          );
        })}
        <button onClick={() => { setEditing(null); setOpen(true); }} style={{ border: "1.5px dashed rgba(31,75,68,.25)", borderRadius: 18, background: "transparent", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 110, color: "var(--tinta-suave)", cursor: "pointer" }}>
          <CI name="plus" size={22} /> <span style={{ fontSize: 12.5 }}>Nova caixinha</span>
        </button>
      </div>

      <CMdl open={open} onClose={() => setOpen(false)} title={editing ? "Editar caixinha" : "Nova caixinha"} accent="var(--conjunto)">
        <CaixinhaForm initial={editing}
          onSave={(d) => {
            let list = F.getCaixinhas();
            if (editing) list = list.map((x) => x.id === editing.id ? { ...x, ...d } : x);
            else list.push({ id: F.uid(), ...d });
            F.saveCaixinhas(list); setOpen(false); rl();
          }}
          onDelete={editing ? () => { F.saveCaixinhas(F.getCaixinhas().filter((x) => x.id !== editing.id)); setOpen(false); rl(); } : null} />
      </CMdl>

      <CMdl open={cfgOpen} onClose={() => setCfgOpen(false)} title="Como dividir o que cada um envia" accent="var(--conjunto)">
        <ConfigForm cfg={rateio.cfg} onSave={(c) => { F.saveConjConfig(c); setCfgOpen(false); rl(); }} />
      </CMdl>
    </div>
  );
}

function CaixinhaForm({ initial, onSave, onDelete }) {
  const [nome, setNome] = useState(initial?.nome || "");
  const [emoji, setEmoji] = useState(initial?.emoji || "📦");
  const [cor, setCor] = useState(initial?.cor || CORES[0]);
  const [planejado, setPlan] = useState(initial?.planejado ?? "");
  const save = () => { if (!nome.trim()) return; onSave({ nome: nome.trim(), emoji, cor, planejado: parseFloat(String(planejado).replace(",", ".")) || 0 }); };
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <CFld label="Nome"><input className="fin-input" placeholder="Ex: Aluguel" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus /></CFld>
      <CFld label="Valor planejado no mês (R$)"><input className="fin-input num" inputMode="decimal" placeholder="0,00" value={planejado} onChange={(e) => setPlan(e.target.value)} style={{ fontSize: 20 }} /></CFld>
      <div>
        <span className="fin-label" style={{ display: "block", marginBottom: 6 }}>Ícone</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 100, overflowY: "auto" }}>
          {EMOJIS.map((e) => (
            <button key={e} onClick={() => setEmoji(e)} style={{ fontSize: 20, width: 38, height: 38, borderRadius: 10, border: emoji === e ? "2px solid var(--petroleo)" : "1px solid rgba(31,75,68,.12)", background: "#fff", cursor: "pointer" }}>{e}</button>
          ))}
        </div>
      </div>
      <div>
        <span className="fin-label" style={{ display: "block", marginBottom: 6 }}>Cor</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {CORES.map((c) => (
            <button key={c} onClick={() => setCor(c)} style={{ width: 30, height: 30, borderRadius: "50%", background: c, border: cor === c ? "3px solid var(--tinta)" : "2px solid #fff", boxShadow: "0 0 0 1px rgba(0,0,0,.1)", cursor: "pointer" }} />
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={save}>Salvar</button>
        {onDelete && <button className="btn btn-danger" onClick={onDelete}><CI name="trash" size={18} /></button>}
      </div>
    </div>
  );
}

function ConfigForm({ cfg, onSave }) {
  const [modo, setModo] = useState(cfg.modoDivisao);
  const [pctD, setPctD] = useState(cfg.percentualDaniel);
  const save = () => {
    if (modo === "50-50") onSave({ modoDivisao: "50-50", percentualDaniel: 50, percentualBruna: 50 });
    else { const d = Math.max(0, Math.min(100, Number(pctD) || 50)); onSave({ modoDivisao: "proporcional", percentualDaniel: d, percentualBruna: 100 - d }); }
  };
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button className={`chip ${modo === "50-50" ? "active" : ""}`} style={{ flex: 1, padding: 12 }} onClick={() => setModo("50-50")}>50 / 50</button>
        <button className={`chip ${modo === "proporcional" ? "active" : ""}`} style={{ flex: 1, padding: 12 }} onClick={() => setModo("proporcional")}>Proporcional</button>
      </div>
      {modo === "proporcional" && (
        <CFld label={`Daniel ${pctD}% · Bruna ${100 - pctD}%`}>
          <input type="range" min="0" max="100" value={pctD} onChange={(e) => setPctD(Number(e.target.value))} style={{ width: "100%", accentColor: "var(--petroleo)" }} />
        </CFld>
      )}
      <button className="btn btn-primary" onClick={save}>Salvar divisão</button>
    </div>
  );
}

// ── Metas conjuntas ─────────────────────────────────────────────────────
function AbaMetasConjunto({ reload }) {
  const [, force] = useState(0);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [aporte, setAporte] = useState(null);
  const metas = F.getConjMetas();
  const rl = () => { force((n) => n + 1); reload && reload(); };
  const guardadoDe = (m) => (m.valorAtual != null ? Number(m.valorAtual) || 0 : (Number(m.contribuicaoDaniel) || 0) + (Number(m.contribuicaoBruna) || 0));

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <button className="btn btn-primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => { setEditing(null); setOpen(true); }}>
        <CI name="plus" size={18} color="#fff" /> Nova meta do casal
      </button>
      {metas.length === 0 && <div style={{ color: "var(--tinta-suave)", textAlign: "center", padding: 12, fontSize: 14 }}>Nenhuma meta conjunta ainda.</div>}
      {metas.map((meta) => {
        const atual = guardadoDe(meta);
        const p = F.planoMeta({ valorAlvo: meta.valorAlvo, valorAtual: atual, dataAlvo: meta.dataAlvo });
        return (
          <CardC key={meta.id} stripe={p.batida ? "var(--dourado)" : "var(--conjunto)"} style={{ padding: "18px 18px 12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="serif" style={{ fontSize: 18 }}>{meta.nome} {p.batida && "🏆"}</div>
                <div style={{ fontSize: 12.5, color: "var(--tinta-suave)", marginTop: 2 }}>{F.fmt(atual)} de {F.fmt(meta.valorAlvo)} {meta.dataAlvo && `· até ${F.fmtDate(meta.dataAlvo)}`}</div>
              </div>
              <button className="btn btn-ghost" style={{ padding: 8 }} onClick={() => { setEditing(meta); setOpen(true); }}><CI name="edit" size={16} /></button>
            </div>
            <div style={{ margin: "6px 0" }}>
              <CPP pct={p.pct} milestones={[{ pct: 25, label: "" }, { pct: 50, label: "½" }, { pct: 75, label: "" }]} color={p.batida ? "var(--dourado)" : "var(--conjunto)"} travelerIcon="plane" height={100} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
              {p.batida ? <div style={{ color: "var(--dourado-2)", fontWeight: 600, fontSize: 13.5 }}>Meta batida! 🎉</div> : (
                <div style={{ fontSize: 13 }}>
                  <span style={{ color: "var(--tinta-suave)" }}>Faltam </span><b className="num" style={{ color: "var(--conjunto)" }}>{F.fmt(p.falta)}</b>
                  {p.porMes != null && <span style={{ color: "var(--tinta-suave)" }}> · guardem <b className="num">{F.fmt(p.porMes)}</b>/mês</span>}
                </div>
              )}
              <button className="btn btn-gold" style={{ padding: "7px 14px", fontSize: 13 }} onClick={() => setAporte(meta)}>+ Guardar</button>
            </div>
          </CardC>
        );
      })}

      <CMdl open={open} onClose={() => setOpen(false)} title={editing ? "Editar meta" : "Nova meta do casal"} accent="var(--conjunto)">
        <MetaConjForm initial={editing}
          onSave={(d) => { let list = F.getConjMetas(); if (editing) list = list.map((x) => x.id === editing.id ? { ...x, ...d } : x); else list.push({ id: F.uid(), valorAtual: 0, ...d }); F.saveConjMetas(list); setOpen(false); rl(); }}
          onDelete={editing ? () => { F.saveConjMetas(F.getConjMetas().filter((x) => x.id !== editing.id)); setOpen(false); rl(); } : null} />
      </CMdl>
      <CMdl open={!!aporte} onClose={() => setAporte(null)} title={`Guardar em "${aporte?.nome || ""}"`} accent="var(--conjunto)">
        <AporteConjForm onSave={(v) => { const list = F.getConjMetas().map((x) => x.id === aporte.id ? { ...x, valorAtual: guardadoDe(x) + v } : x); F.saveConjMetas(list); setAporte(null); rl(); }} />
      </CMdl>
    </div>
  );
}

function MetaConjForm({ initial, onSave, onDelete }) {
  const [nome, setNome] = useState(initial?.nome || "");
  const [valorAlvo, setAlvo] = useState(initial?.valorAlvo ?? "");
  const [dataAlvo, setData] = useState(initial?.dataAlvo || "");
  const save = () => { const a = parseFloat(String(valorAlvo).replace(",", ".")); if (!nome.trim() || !a) return; onSave({ nome: nome.trim(), valorAlvo: a, dataAlvo }); };
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <CFld label="Nome da meta"><input className="fin-input" placeholder="Ex: Viagem Europa" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus /></CFld>
      <CFld label="Valor alvo (R$)"><input className="fin-input num" inputMode="decimal" value={valorAlvo} onChange={(e) => setAlvo(e.target.value)} style={{ fontSize: 20 }} /></CFld>
      <CFld label="Data desejada (opcional)"><input type="date" className="fin-input" value={dataAlvo} onChange={(e) => setData(e.target.value)} /></CFld>
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={save}>Salvar</button>
        {onDelete && <button className="btn btn-danger" onClick={onDelete}><CI name="trash" size={18} /></button>}
      </div>
    </div>
  );
}

function AporteConjForm({ onSave }) {
  const [v, setV] = useState("");
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <CFld label="Quanto guardar agora (R$)"><input className="fin-input num" inputMode="decimal" placeholder="0,00" value={v} onChange={(e) => setV(e.target.value)} style={{ fontSize: 22 }} autoFocus /></CFld>
      <button className="btn btn-gold" onClick={() => { const n = parseFloat(String(v).replace(",", ".")); if (n > 0) onSave(n); }}>Guardar</button>
    </div>
  );
}

// ── Patrimônio ──────────────────────────────────────────────────────────
function AbaPatrimonio() {
  const serie = F.seriePatrimonio();
  const geral = F.saldoConjuntoGeral();
  const metas = F.getConjMetas();
  const guardado = metas.reduce((s, m) => s + (m.valorAtual != null ? Number(m.valorAtual) || 0 : (Number(m.contribuicaoDaniel) || 0) + (Number(m.contribuicaoBruna) || 0)), 0);
  const atual = serie.length ? serie[serie.length - 1].patrimonio : 0;
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <CardC stripe="var(--conjunto)" style={{ padding: "20px 18px" }}>
        <div style={{ fontSize: 12.5, color: "var(--tinta-suave)", fontWeight: 600 }}>PATRIMÔNIO DO CASAL</div>
        <div style={{ marginTop: 6 }}><CM value={atual} size={40} color="var(--petroleo)" /></div>
        <div style={{ fontSize: 12.5, color: "var(--tinta-suave)", marginTop: 6 }}>saldo conjunto acumulado + guardado nas metas</div>
      </CardC>
      <div style={{ display: "flex", gap: 12 }}>
        <CardC style={{ flex: 1, padding: "14px 16px" }}><div style={{ fontSize: 11.5, color: "var(--tinta-suave)" }}>Já guardado (metas)</div><CM value={guardado} size={19} color="var(--dourado-2)" /></CardC>
        <CardC style={{ flex: 1, padding: "14px 16px" }}><div style={{ fontSize: 11.5, color: "var(--tinta-suave)" }}>Saldo em conta</div><CM value={geral.saldo} size={19} color={geral.saldo >= 0 ? "var(--petroleo)" : "var(--coral)"} /></CardC>
      </div>
      <CardC style={{ padding: 18 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 12 }}>Evolução ao longo do tempo</div>
        <CLC serie={serie} />
      </CardC>
    </div>
  );
}

window.FinConjunto = { ConjuntoApp };
