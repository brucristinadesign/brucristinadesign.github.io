/* ══════════════════════════════════════════════════════════════════════
   conjunto.jsx — área Conjunto (conta ÚNICA do casal, modelo Noh)
   Tudo é pago do bolso comum: não há "quem pagou". O foco é o controle
   do que ENTROU × SAIU, organizado por categoria, tags e status.
   Abas: Início · Lançamentos · Metas · Patrimônio
   ══════════════════════════════════════════════════════════════════════ */
const { Icon: CI, Money: CM, Card: CardC, Field: CFld, Modal: CMdl,
  PathProgress: CPP, MiniBar: CMB, Donut: CDn, LineChart: CLC } = window.FinUI;

function CatBadge({ cat, size = 38 }) {
  const m = F.catMeta(cat);
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.3, background: m.cor + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <CI name={m.icon} size={size * 0.5} color={m.cor} />
    </div>
  );
}
function fullMonthC(mk) {
  const [y, m] = mk.split("-");
  const n = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  return `${n[Number(m) - 1]} ${y}`;
}
function nextMonthC(mk) { let [y, m] = mk.split("-").map(Number); m++; if (m === 13) { m = 1; y++; } return `${y}-${String(m).padStart(2, "0")}`; }
const somaV = (arr) => arr.reduce((s, t) => s + (Number(t.valor) || 0), 0);

// ── App do Conjunto ─────────────────────────────────────────────────────
function ConjuntoApp() {
  const [aba, setAba] = useState("inicio");
  const [mes, setMes] = useState(F.currentMonth());
  const [, force] = useState(0);
  const reload = () => force((n) => n + 1);

  const abas = [
    { id: "inicio", label: "Início", icon: "home" },
    { id: "lancamentos", label: "Lançamentos", icon: "list" },
    { id: "metas", label: "Metas", icon: "plane" },
    { id: "patrimonio", label: "Patrimônio", icon: "coin" },
  ];
  const temMes = aba === "inicio" || aba === "lancamentos";

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 2 }}>
        {abas.map((a) => (
          <button key={a.id} className={`chip ${aba === a.id ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: 6, flex: "0 0 auto" }} onClick={() => setAba(a.id)}>
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
      {aba === "lancamentos" && <AbaLancamentosConj mes={mes} reload={reload} />}
      {aba === "metas" && <AbaMetasConjunto reload={reload} />}
      {aba === "patrimonio" && <AbaPatrimonio />}
    </div>
  );
}

// ── Início: saldo do casal, entrou × saiu, a pagar, por categoria ──────
function AbaInicio({ mes, reload }) {
  const [, force] = useState(0);
  const rl = () => { force((n) => n + 1); reload && reload(); };
  const geral = F.saldoConjuntoGeral();

  const doMes = F.getConjTx().filter((t) => F.monthKey(t.data) === mes);
  const recPagas = doMes.filter((t) => t.tipo === "receita" && t.status !== "pendente");
  const despPagas = doMes.filter((t) => t.tipo !== "receita" && t.status !== "pendente");
  const pendentes = doMes.filter((t) => t.tipo !== "receita" && t.status === "pendente")
    .sort((a, b) => (a.data < b.data ? -1 : 1));
  const entrouMes = somaV(recPagas), saiuMes = somaV(despPagas);

  const porCat = {};
  despPagas.forEach((t) => { porCat[t.categoria] = (porCat[t.categoria] || 0) + (Number(t.valor) || 0); });
  const catData = Object.entries(porCat).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value, color: F.catMeta(label).cor }));

  const marcarPago = (id) => {
    F.saveConjTx(F.getConjTx().map((t) => (t.id === id ? { ...t, status: "pago" } : t)));
    rl();
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {/* saldo do casal (conta única) */}
      <CardC stripe="var(--conjunto)" style={{ padding: "20px 18px" }}>
        <div style={{ fontSize: 12, color: "var(--tinta-suave)", fontWeight: 600 }}>SALDO DO CASAL</div>
        <div style={{ marginTop: 5 }}><CM value={geral.saldo} size={38} sign color={geral.saldo >= 0 ? "var(--petroleo)" : "var(--coral)"} /></div>
        <div style={{ fontSize: 11.5, color: "var(--tinta-suave)", marginTop: 4 }}>tudo que entrou − tudo que saiu (conta conjunta)</div>
      </CardC>

      {/* entrou × saiu no mês */}
      <div style={{ display: "flex", gap: 12 }}>
        <CardC style={{ flex: 1, padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--tinta-suave)" }}>
            <span style={{ width: 8, height: 8, borderRadius: 8, background: "var(--petroleo-2)" }} /> Entrou
          </div>
          <CM value={entrouMes} size={20} color="var(--petroleo-2)" />
        </CardC>
        <CardC style={{ flex: 1, padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--tinta-suave)" }}>
            <span style={{ width: 8, height: 8, borderRadius: 8, background: "var(--coral)" }} /> Saiu
          </div>
          <CM value={saiuMes} size={20} color="var(--coral)" />
        </CardC>
      </div>

      {/* a pagar (pendentes) */}
      {pendentes.length > 0 && (
        <CardC style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 600, marginBottom: 10 }}>
            <CI name="bell" size={16} color="var(--coral)" /> A pagar
            <span style={{ marginLeft: "auto", color: "var(--coral)" }} className="num">{F.fmt(somaV(pendentes))}</span>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {pendentes.map((t) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CatBadge cat={t.categoria} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{t.categoria}</div>
                  <div style={{ fontSize: 11, color: "var(--tinta-suave)" }}>{F.fmtDate(t.data)}</div>
                </div>
                <span className="num" style={{ color: "var(--coral)", fontSize: 14 }}>{F.fmt(t.valor)}</span>
                <button className="btn btn-gold" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => marcarPago(t.id)}>paguei</button>
              </div>
            ))}
          </div>
        </CardC>
      )}

      {/* por categoria */}
      <CardC style={{ padding: 18 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 10 }}>Para onde foi o dinheiro</div>
        {catData.length ? (
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <CDn data={catData} />
            <div style={{ flex: 1, minWidth: 150, display: "grid", gap: 8 }}>
              {catData.map((d, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <CI name={F.catMeta(d.label).icon} size={15} color={d.color} />
                  <span style={{ flex: 1 }}>{d.label}</span>
                  <span className="num">{F.fmt(d.value)}</span>
                  <span style={{ fontSize: 11, color: "var(--tinta-suave)", width: 32, textAlign: "right" }}>{Math.round((d.value / saiuMes) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ color: "var(--tinta-suave)", fontSize: 13.5, padding: "8px 0" }}>Nenhuma despesa neste mês ainda.</div>
        )}
      </CardC>
    </div>
  );
}

// ── Lançamentos: lista completa, filtros, tags, status ──────────────────
function AbaLancamentosConj({ mes, reload }) {
  const [, force] = useState(0);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [fTipo, setFTipo] = useState(null);      // receita | despesa
  const [fCat, setFCat] = useState(null);
  const [fTag, setFTag] = useState(null);
  const rl = () => { force((n) => n + 1); reload && reload(); };

  const todas = F.getConjTx().filter((t) => F.monthKey(t.data) === mes).sort((a, b) => (a.data < b.data ? 1 : -1));
  const catsPresentes = Array.from(new Set(todas.filter((t) => t.tipo !== "receita").map((t) => t.categoria)));
  const tagsPresentes = Array.from(new Set(todas.flatMap((t) => t.tags || [])));

  let lista = todas;
  if (fTipo) lista = lista.filter((t) => (t.tipo || "despesa") === fTipo);
  if (fCat) lista = lista.filter((t) => t.categoria === fCat);
  if (fTag) lista = lista.filter((t) => (t.tags || []).includes(fTag));

  const relatorioTag = () => {
    const porTag = {};
    todas.filter((t) => t.tipo !== "receita").forEach((t) => (t.tags || []).forEach((tg) => { porTag[tg] = (porTag[tg] || 0) + (Number(t.valor) || 0); }));
    return Object.entries(porTag).sort((a, b) => b[1] - a[1]);
  };
  const tagData = relatorioTag();
  const maxTag = tagData.length ? tagData[0][1] : 1;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <button className="btn btn-primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        onClick={() => { setEditing(null); setOpen(true); }}>
        <CI name="plus" size={18} color="#fff" /> Novo lançamento
      </button>

      {/* filtros */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
        <button className={`chip ${!fTipo && !fCat ? "active" : ""}`} style={{ flex: "0 0 auto" }} onClick={() => { setFTipo(null); setFCat(null); }}>Tudo</button>
        <button className={`chip ${fTipo === "receita" ? "active" : ""}`} style={{ flex: "0 0 auto" }} onClick={() => { setFTipo(fTipo === "receita" ? null : "receita"); setFCat(null); }}>Entrou</button>
        <button className={`chip ${fTipo === "despesa" ? "active" : ""}`} style={{ flex: "0 0 auto" }} onClick={() => { setFTipo(fTipo === "despesa" ? null : "despesa"); }}>Saiu</button>
        {catsPresentes.map((c) => (
          <button key={c} className={`chip ${fCat === c ? "active" : ""}`} style={{ flex: "0 0 auto", display: "flex", alignItems: "center", gap: 6 }} onClick={() => { setFCat(fCat === c ? null : c); setFTipo(null); }}>
            <CI name={F.catMeta(c).icon} size={13} color={fCat === c ? "#fff" : F.catMeta(c).cor} /> {c}
          </button>
        ))}
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

      {/* lista */}
      <div style={{ display: "grid", gap: 8 }}>
        {lista.length === 0 && <div style={{ color: "var(--tinta-suave)", textAlign: "center", padding: 16, fontSize: 14 }}>Nada por aqui.</div>}
        {lista.map((t) => {
          const receita = t.tipo === "receita";
          const pend = t.status === "pendente";
          return (
            <CardC key={t.id} style={{ padding: "11px 13px", display: "flex", alignItems: "center", gap: 11, cursor: "pointer", opacity: pend ? 0.72 : 1 }}
              onClick={() => { setEditing(t); setOpen(true); }}>
              {receita
                ? <div style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(46,101,92,.14)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><CI name="coin" size={19} color="var(--petroleo-2)" /></div>
                : <CatBadge cat={t.categoria} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 500, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  {receita ? (t.categoria || "Receita") : t.categoria}
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

      {/* relatório por tag */}
      {tagData.length > 0 && (
        <CardC style={{ padding: 18 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <CI name="tag" size={15} color="var(--dourado-2)" /> Gastos por tag
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            {tagData.map(([tg, val]) => (
              <div key={tg}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                  <span style={{ color: "var(--dourado-2)", fontWeight: 600 }}>{tg}</span>
                  <b className="num">{F.fmt(val)}</b>
                </div>
                <CMB pct={(val / maxTag) * 100} color="var(--dourado)" />
              </div>
            ))}
          </div>
        </CardC>
      )}

      <CMdl open={open} onClose={() => setOpen(false)} title={editing ? "Editar lançamento" : "Novo lançamento"} accent="var(--conjunto)">
        <ConjTxForm initial={editing} dataMes={mes}
          onSave={(d) => {
            F.registrarTags(d.tags);
            let list = F.getConjTx();
            if (editing) list = list.map((x) => x.id === editing.id ? { ...x, ...d } : x);
            else list.push({ id: F.uid(), ...d });
            F.saveConjTx(list); setOpen(false); rl();
          }}
          onDelete={editing ? () => { F.saveConjTx(F.getConjTx().filter((x) => x.id !== editing.id)); setOpen(false); rl(); } : null} />
      </CMdl>
    </div>
  );
}

// ── Formulário rico (sem "quem pagou" — conta única) ────────────────────
function ConjTxForm({ initial, dataMes, onSave, onDelete }) {
  const [tipo, setTipo] = useState(initial?.tipo || "despesa");
  const [valor, setValor] = useState(initial?.valor ?? "");
  const [categoria, setCategoria] = useState(initial?.categoria || "Mercado");
  const [data, setData] = useState(initial?.data || (dataMes ? dataMes + "-" + String(new Date().getDate()).padStart(2, "0") : F.todayISO()));
  const [status, setStatus] = useState(initial?.status || "pago");
  const [tags, setTags] = useState(initial?.tags || []);
  const [tagInput, setTagInput] = useState("");

  const sugestoes = F.getConjTags().filter((t) => !tags.includes(t)).slice(0, 8);
  const addTag = (raw) => { const v = String(raw).trim().replace(/,$/, ""); if (v && !tags.includes(v)) setTags([...tags, v]); setTagInput(""); };
  const save = () => {
    const v = parseFloat(String(valor).replace(",", "."));
    if (!v || v <= 0) return;
    onSave({ tipo, valor: v, categoria: tipo === "receita" ? (categoria || "Extra") : categoria, data, status: tipo === "receita" ? "pago" : status, tags });
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
          <span className="fin-label" style={{ display: "block", marginBottom: 8 }}>Categoria</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {F.CATEGORIAS_CASA.map((c) => {
              const m = F.catMeta(c); const sel = categoria === c;
              return (
                <button key={c} onClick={() => setCategoria(c)}
                  style={{ background: sel ? m.cor + "18" : "transparent", border: `1.5px solid ${sel ? m.cor : "rgba(31,75,68,.12)"}`, borderRadius: 12, padding: "9px 4px", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, cursor: "pointer" }}>
                  <CI name={m.icon} size={20} color={m.cor} />
                  <span style={{ fontSize: 10.5, color: sel ? "var(--tinta)" : "var(--tinta-suave)", fontWeight: sel ? 600 : 500, lineHeight: 1.1, textAlign: "center" }}>{c}</span>
                </button>
              );
            })}
          </div>
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
        <input className="fin-input" placeholder="digite e aperte Enter (ex: mercado, viagem)"
          value={tagInput}
          onChange={(e) => { const v = e.target.value; if (v.endsWith(",")) addTag(v); else setTagInput(v); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(tagInput); } }} />
        {sugestoes.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {sugestoes.map((tg) => (
              <button key={tg} className="chip" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => addTag(tg)}>+ {tg}</button>
            ))}
          </div>
        )}
      </div>

      {/* data + status */}
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

      <div style={{ display: "flex", gap: 10, marginTop: 2 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={save}>Salvar</button>
        {onDelete && <button className="btn btn-danger" onClick={onDelete}><CI name="trash" size={18} /></button>}
      </div>
    </div>
  );
}

// ── Metas conjuntas (guardado único — sem separar por pessoa) ───────────
function AbaMetasConjunto({ reload }) {
  const [, force] = useState(0);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [aporte, setAporte] = useState(null);
  const metas = F.getConjMetas();
  const rl = () => { force((n) => n + 1); reload && reload(); };

  const guardadoDe = (m) => {
    if (m.valorAtual != null) return Number(m.valorAtual) || 0;
    return (Number(m.contribuicaoDaniel) || 0) + (Number(m.contribuicaoBruna) || 0); // compatível com dados antigos
  };

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
          onSave={(d) => {
            let list = F.getConjMetas();
            if (editing) list = list.map((x) => x.id === editing.id ? { ...x, ...d } : x);
            else list.push({ id: F.uid(), valorAtual: 0, ...d });
            F.saveConjMetas(list); setOpen(false); rl();
          }}
          onDelete={editing ? () => { F.saveConjMetas(F.getConjMetas().filter((x) => x.id !== editing.id)); setOpen(false); rl(); } : null} />
      </CMdl>

      <CMdl open={!!aporte} onClose={() => setAporte(null)} title={`Guardar em "${aporte?.nome || ""}"`} accent="var(--conjunto)">
        <AporteConjForm onSave={(v) => {
          const list = F.getConjMetas().map((x) => x.id === aporte.id ? { ...x, valorAtual: guardadoDe(x) + v } : x);
          F.saveConjMetas(list); setAporte(null); rl();
        }} />
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

// ── Patrimônio do casal ─────────────────────────────────────────────────
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
        <CardC style={{ flex: 1, padding: "14px 16px" }}>
          <div style={{ fontSize: 11.5, color: "var(--tinta-suave)" }}>Já guardado (metas)</div>
          <CM value={guardado} size={19} color="var(--dourado-2)" />
        </CardC>
        <CardC style={{ flex: 1, padding: "14px 16px" }}>
          <div style={{ fontSize: 11.5, color: "var(--tinta-suave)" }}>Saldo em conta</div>
          <CM value={geral.saldo} size={19} color={geral.saldo >= 0 ? "var(--petroleo)" : "var(--coral)"} />
        </CardC>
      </div>
      <CardC style={{ padding: 18 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 12 }}>Evolução ao longo do tempo</div>
        <CLC serie={serie} />
      </CardC>
    </div>
  );
}

window.FinConjunto = { ConjuntoApp };
