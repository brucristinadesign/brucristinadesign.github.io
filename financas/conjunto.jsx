/* ══════════════════════════════════════════════════════════════════════
   conjunto.jsx — área Conjunto (despesas da casa, acerto, metas, patrimônio)
   ══════════════════════════════════════════════════════════════════════ */
const { Icon: CI, Money: CM, Card: CardC, Field: CFld, Modal: CMdl,
  PathProgress: CPP, MiniBar: CMB, Donut: CDn, LineChart: CLC } = window.FinUI;

function ConjuntoApp() {
  const [aba, setAba] = useState("casa");
  const [, force] = useState(0);
  const reload = () => force((n) => n + 1);

  const abas = [
    { id: "casa", label: "Casa", icon: "home" },
    { id: "acerto", label: "Acerto", icon: "users" },
    { id: "metas", label: "Metas", icon: "plane" },
    { id: "patrimonio", label: "Patrimônio", icon: "chart" },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 2 }}>
        {abas.map((a) => (
          <button key={a.id} className={`chip ${aba === a.id ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: 6, flex: "0 0 auto" }} onClick={() => setAba(a.id)}>
            <CI name={a.icon} size={15} color={aba === a.id ? "#fff" : "var(--tinta-suave)"} /> {a.label}
          </button>
        ))}
      </div>
      {aba === "casa" && <AbaCasa reload={reload} />}
      {aba === "acerto" && <AbaAcerto reload={reload} />}
      {aba === "metas" && <AbaMetasConjunto reload={reload} />}
      {aba === "patrimonio" && <AbaPatrimonio />}
    </div>
  );
}

// ── Despesas da casa ────────────────────────────────────────────────────
function AbaCasa({ reload }) {
  const [, force] = useState(0);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [mes] = useState(F.currentMonth());
  const rl = () => { force((n) => n + 1); reload && reload(); };

  const tx = F.getConjTx().filter((t) => F.monthKey(t.data) === mes).sort((a, b) => (a.data < b.data ? 1 : -1));
  const r = F.resumoMes(F.getConjTx(), mes);
  const donutData = Object.entries(r.porCategoria).sort((a, b) => b[1] - a[1])
    .map(([cat, value], i) => ({ label: cat, value, color: window.FinUI.CAT_COLORS[i % window.FinUI.CAT_COLORS.length] }));

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <CardC stripe="var(--conjunto)" style={{ padding: "20px 18px" }}>
        <div style={{ fontSize: 12.5, color: "var(--tinta-suave)", fontWeight: 600 }}>DESPESAS DA CASA · {F.monthLabel(mes)}</div>
        <div style={{ marginTop: 6 }}><CM value={r.despesas} size={36} color="var(--petroleo)" /></div>
        <div style={{ display: "flex", gap: 20, marginTop: 14, fontSize: 13 }}>
          <div><span style={{ color: "var(--tinta-suave)" }}>Daniel pagou </span><b className="num" style={{ color: "var(--daniel)" }}>{F.fmt(sumPago(tx, "daniel"))}</b></div>
          <div><span style={{ color: "var(--tinta-suave)" }}>Bruna pagou </span><b className="num" style={{ color: "var(--bruna)" }}>{F.fmt(sumPago(tx, "bruna"))}</b></div>
        </div>
      </CardC>

      {donutData.length > 0 && (
        <CardC style={{ padding: 18 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 10 }}>Gastos da casa por categoria</div>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <CDn data={donutData} />
            <div style={{ flex: 1, minWidth: 150, display: "grid", gap: 8 }}>
              {donutData.map((d, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <span style={{ width: 11, height: 11, borderRadius: 3, background: d.color }} />
                  <span style={{ flex: 1 }}>{d.label}</span>
                  <span className="num">{F.fmt(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </CardC>
      )}

      <button className="btn btn-primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        onClick={() => { setEditing(null); setOpen(true); }}>
        <CI name="plus" size={18} color="#fff" /> Nova despesa da casa
      </button>

      <div style={{ display: "grid", gap: 8 }}>
        {tx.length === 0 && <div style={{ color: "var(--tinta-suave)", textAlign: "center", padding: 16, fontSize: 14 }}>Nenhuma despesa neste mês.</div>}
        {tx.map((t) => (
          <CardC key={t.id} style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
            onClick={() => { setEditing(t); setOpen(true); }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: t.pagoPor === "daniel" ? "rgba(47,110,99,.15)" : "rgba(168,88,107,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: t.pagoPor === "daniel" ? "var(--daniel)" : "var(--bruna)", flexShrink: 0 }}>
              {t.pagoPor === "daniel" ? "D" : "B"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 500 }}>{t.categoria}</div>
              <div style={{ fontSize: 12, color: "var(--tinta-suave)" }}>{F.fmtDate(t.data)} · pagou {t.pagoPor === "daniel" ? "Daniel" : "Bruna"}</div>
            </div>
            <CM value={t.valor} size={17} color="var(--petroleo)" />
          </CardC>
        ))}
      </div>

      <CMdl open={open} onClose={() => setOpen(false)} title={editing ? "Editar despesa" : "Nova despesa da casa"} accent="var(--conjunto)">
        <ConjTxForm initial={editing}
          onSave={(d) => {
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

function ConjTxForm({ initial, onSave, onDelete }) {
  const [valor, setValor] = useState(initial?.valor ?? "");
  const [categoria, setCategoria] = useState(initial?.categoria || "Moradia");
  const [data, setData] = useState(initial?.data || F.todayISO());
  const [pagoPor, setPagoPor] = useState(initial?.pagoPor || "daniel");
  const save = () => {
    const v = parseFloat(String(valor).replace(",", "."));
    if (!v || v <= 0) return;
    onSave({ tipo: "despesa", valor: v, categoria, data, pagoPor, divisao: "config" });
  };
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <CFld label="Valor (R$)"><input className="fin-input num" inputMode="decimal" placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value)} style={{ fontSize: 22 }} autoFocus /></CFld>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><CFld label="Categoria"><select className="fin-select" value={categoria} onChange={(e) => setCategoria(e.target.value)}>{["Moradia", "Mercado", "Transporte", "Lazer", "Saúde", "Assinaturas", "Outros"].map((c) => <option key={c}>{c}</option>)}</select></CFld></div>
        <div style={{ flex: 1 }}><CFld label="Data"><input type="date" className="fin-input" value={data} onChange={(e) => setData(e.target.value)} /></CFld></div>
      </div>
      <CFld label="Quem pagou">
        <div style={{ display: "flex", gap: 8 }}>
          {[["daniel", "Daniel", "var(--daniel)"], ["bruna", "Bruna", "var(--bruna)"]].map(([id, lbl, cor]) => (
            <button key={id} className="chip" style={{ flex: 1, padding: 11, background: pagoPor === id ? cor : "#fff", color: pagoPor === id ? "#fff" : "var(--tinta-suave)", borderColor: pagoPor === id ? cor : undefined }} onClick={() => setPagoPor(id)}>{lbl}</button>
          ))}
        </div>
      </CFld>
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={save}>Salvar</button>
        {onDelete && <button className="btn btn-danger" onClick={onDelete}><CI name="trash" size={18} /></button>}
      </div>
    </div>
  );
}

// ── Acerto: quem deve quem ──────────────────────────────────────────────
function AbaAcerto({ reload }) {
  const [, force] = useState(0);
  const [cfgOpen, setCfgOpen] = useState(false);
  const mes = F.currentMonth();
  const a = F.acertoConjunto(mes);
  const rl = () => { force((n) => n + 1); reload && reload(); };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <CardC stripe="var(--conjunto)" style={{ padding: "22px 18px", textAlign: "center" }}>
        <div style={{ fontSize: 12.5, color: "var(--tinta-suave)", fontWeight: 600 }}>ACERTO DO MÊS · {F.monthLabel(mes)}</div>
        {a.acerto < 0.01 ? (
          <div style={{ marginTop: 14 }}>
            <div className="serif" style={{ fontSize: 22, color: "var(--petroleo)" }}>Tudo quitado ✓</div>
            <div style={{ fontSize: 13, color: "var(--tinta-suave)", marginTop: 4 }}>Ninguém deve nada esse mês.</div>
          </div>
        ) : (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 14, color: "var(--tinta-suave)" }}>
              <b style={{ color: a.quemPaga === "daniel" ? "var(--daniel)" : "var(--bruna)" }}>{capName(a.quemPaga)}</b> deve pra <b style={{ color: a.quemRecebe === "daniel" ? "var(--daniel)" : "var(--bruna)" }}>{capName(a.quemRecebe)}</b>
            </div>
            <div style={{ marginTop: 8 }}><CM value={a.acerto} size={38} color="var(--dourado-2)" /></div>
          </div>
        )}
      </CardC>

      <CardC style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <b style={{ fontSize: 14 }}>Divisão {a.cfg.modoDivisao === "50-50" ? "50 / 50" : "proporcional"}</b>
          <button className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }} onClick={() => setCfgOpen(true)}>
            <CI name="gear" size={15} /> Ajustar
          </button>
        </div>
        <RowAcerto nome="Daniel" cor="var(--daniel)" pagou={a.pagoDaniel} devia={a.deviaDaniel} pct={a.pctD} />
        <div style={{ height: 12 }} />
        <RowAcerto nome="Bruna" cor="var(--bruna)" pagou={a.pagoBruna} devia={a.deviaBruna} pct={a.pctB} />
        <div style={{ borderTop: "1px solid rgba(31,75,68,.1)", marginTop: 14, paddingTop: 12, display: "flex", justifyContent: "space-between", fontSize: 13.5 }}>
          <span style={{ color: "var(--tinta-suave)" }}>Total gasto no mês</span>
          <b className="num">{F.fmt(a.totalGasto)}</b>
        </div>
      </CardC>

      <CMdl open={cfgOpen} onClose={() => setCfgOpen(false)} title="Como dividir as despesas" accent="var(--conjunto)">
        <ConfigForm cfg={a.cfg} onSave={(c) => { F.saveConjConfig(c); setCfgOpen(false); rl(); }} />
      </CMdl>
    </div>
  );
}

function RowAcerto({ nome, cor, pagou, devia, pct }) {
  const saldo = pagou - devia;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 13.5 }}>
        <b style={{ color: cor }}>{nome}</b>
        <span style={{ color: "var(--tinta-suave)" }}>arca com {Math.round(pct * 100)}%</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--tinta-suave)", margin: "6px 0" }}>
        <span>pagou <b className="num" style={{ color: "var(--tinta)" }}>{F.fmt(pagou)}</b></span>
        <span>devia <b className="num" style={{ color: "var(--tinta)" }}>{F.fmt(devia)}</b></span>
        <span style={{ color: saldo >= 0 ? "var(--petroleo)" : "var(--coral)" }}>{saldo >= 0 ? "recebe" : "paga"} <b className="num">{F.fmt(Math.abs(saldo))}</b></span>
      </div>
      <CMB pct={devia > 0 ? Math.min(100, (pagou / devia) * 100) : 100} color={cor} />
    </div>
  );
}

function ConfigForm({ cfg, onSave }) {
  const [modo, setModo] = useState(cfg.modoDivisao);
  const [pctD, setPctD] = useState(cfg.percentualDaniel);
  const save = () => {
    if (modo === "50-50") onSave({ modoDivisao: "50-50", percentualDaniel: 50, percentualBruna: 50 });
    else {
      const d = Math.max(0, Math.min(100, Number(pctD) || 50));
      onSave({ modoDivisao: "proporcional", percentualDaniel: d, percentualBruna: 100 - d });
    }
  };
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button className={`chip ${modo === "50-50" ? "active" : ""}`} style={{ flex: 1, padding: 12 }} onClick={() => setModo("50-50")}>50 / 50</button>
        <button className={`chip ${modo === "proporcional" ? "active" : ""}`} style={{ flex: 1, padding: 12 }} onClick={() => setModo("proporcional")}>Proporcional à renda</button>
      </div>
      {modo === "proporcional" && (
        <div>
          <CFld label={`Daniel arca com ${pctD}% · Bruna ${100 - pctD}%`}>
            <input type="range" min="0" max="100" value={pctD} onChange={(e) => setPctD(Number(e.target.value))} style={{ width: "100%", accentColor: "var(--petroleo)" }} />
          </CFld>
        </div>
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

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <button className="btn btn-primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        onClick={() => { setEditing(null); setOpen(true); }}>
        <CI name="plus" size={18} color="#fff" /> Nova meta conjunta
      </button>

      {metas.length === 0 && <div style={{ color: "var(--tinta-suave)", textAlign: "center", padding: 12, fontSize: 14 }}>Nenhuma meta conjunta ainda.</div>}

      {metas.map((meta) => {
        const cd = Number(meta.contribuicaoDaniel) || 0;
        const cb = Number(meta.contribuicaoBruna) || 0;
        const atual = cd + cb;
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

            {/* contribuição de cada um */}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <ContribBox nome="Daniel" cor="var(--daniel)" valor={cd} onAdd={() => setAporte({ meta, quem: "daniel" })} />
              <ContribBox nome="Bruna" cor="var(--bruna)" valor={cb} onAdd={() => setAporte({ meta, quem: "bruna" })} />
            </div>
            {!p.batida && p.porMes != null && (
              <div style={{ fontSize: 12.5, color: "var(--tinta-suave)", marginTop: 10, textAlign: "center" }}>
                Faltam <b className="num" style={{ color: "var(--petroleo)" }}>{F.fmt(p.falta)}</b> · guardem <b className="num">{F.fmt(p.porMes)}</b>/mês juntos
              </div>
            )}
          </CardC>
        );
      })}

      <CMdl open={open} onClose={() => setOpen(false)} title={editing ? "Editar meta" : "Nova meta conjunta"} accent="var(--conjunto)">
        <MetaConjForm initial={editing}
          onSave={(d) => {
            let list = F.getConjMetas();
            if (editing) list = list.map((x) => x.id === editing.id ? { ...x, ...d } : x);
            else list.push({ id: F.uid(), contribuicaoDaniel: 0, contribuicaoBruna: 0, ...d });
            F.saveConjMetas(list); setOpen(false); rl();
          }}
          onDelete={editing ? () => { F.saveConjMetas(F.getConjMetas().filter((x) => x.id !== editing.id)); setOpen(false); rl(); } : null} />
      </CMdl>

      <CMdl open={!!aporte} onClose={() => setAporte(null)} title={`${capName(aporte?.quem)} guarda em "${aporte?.meta?.nome || ""}"`} accent={aporte?.quem === "daniel" ? "var(--daniel)" : "var(--bruna)"}>
        <AporteConjForm onSave={(v) => {
          const list = F.getConjMetas().map((x) => {
            if (x.id !== aporte.meta.id) return x;
            const key = aporte.quem === "daniel" ? "contribuicaoDaniel" : "contribuicaoBruna";
            return { ...x, [key]: (Number(x[key]) || 0) + v };
          });
          F.saveConjMetas(list); setAporte(null); rl();
        }} />
      </CMdl>
    </div>
  );
}

function ContribBox({ nome, cor, valor, onAdd }) {
  return (
    <div style={{ flex: 1, background: "var(--areia)", borderRadius: 12, padding: "10px 12px" }}>
      <div style={{ fontSize: 11.5, color: cor, fontWeight: 700 }}>{nome}</div>
      <div className="num" style={{ fontSize: 17, color: "var(--tinta)" }}>{F.fmt(valor)}</div>
      <button className="btn btn-gold" style={{ width: "100%", marginTop: 6, padding: "5px", fontSize: 12 }} onClick={onAdd}>+ Guardar</button>
    </div>
  );
}

function MetaConjForm({ initial, onSave, onDelete }) {
  const [nome, setNome] = useState(initial?.nome || "");
  const [valorAlvo, setAlvo] = useState(initial?.valorAlvo ?? "");
  const [dataAlvo, setData] = useState(initial?.dataAlvo || "");
  const save = () => {
    const a = parseFloat(String(valorAlvo).replace(",", "."));
    if (!nome.trim() || !a) return;
    onSave({ nome: nome.trim(), valorAlvo: a, dataAlvo });
  };
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

// ── Patrimônio ao longo do tempo ────────────────────────────────────────
function AbaPatrimonio() {
  const serie = F.seriePatrimonio();
  const metas = F.getConjMetas();
  const guardado = metas.reduce((s, m) => s + (Number(m.contribuicaoDaniel) || 0) + (Number(m.contribuicaoBruna) || 0), 0);
  const atual = serie.length ? serie[serie.length - 1].patrimonio : 0;
  const totalD = metas.reduce((s, m) => s + (Number(m.contribuicaoDaniel) || 0), 0);
  const totalB = metas.reduce((s, m) => s + (Number(m.contribuicaoBruna) || 0), 0);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <CardC stripe="var(--conjunto)" style={{ padding: "20px 18px" }}>
        <div style={{ fontSize: 12.5, color: "var(--tinta-suave)", fontWeight: 600 }}>PATRIMÔNIO DO CASAL</div>
        <div style={{ marginTop: 6 }}><CM value={atual} size={40} color="var(--petroleo)" /></div>
        <div style={{ fontSize: 12.5, color: "var(--tinta-suave)", marginTop: 6 }}>saldo conjunto acumulado + guardado nas metas</div>
      </CardC>

      <CardC style={{ padding: 18 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 12 }}>Evolução ao longo do tempo</div>
        <CLC serie={serie} />
      </CardC>

      <CardC style={{ padding: 18 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 12 }}>Quanto cada um contribuiu pras metas</div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1, background: "rgba(47,110,99,.08)", borderRadius: 12, padding: 14, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "var(--daniel)", fontWeight: 700 }}>DANIEL</div>
            <div className="num" style={{ fontSize: 22, color: "var(--tinta)", marginTop: 4 }}>{F.fmt(totalD)}</div>
          </div>
          <div style={{ flex: 1, background: "rgba(168,88,107,.08)", borderRadius: 12, padding: 14, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "var(--bruna)", fontWeight: 700 }}>BRUNA</div>
            <div className="num" style={{ fontSize: 22, color: "var(--tinta)", marginTop: 4 }}>{F.fmt(totalB)}</div>
          </div>
        </div>
        {guardado > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", height: 12, borderRadius: 999, overflow: "hidden" }}>
              <div style={{ width: `${(totalD / guardado) * 100}%`, background: "var(--daniel)" }} />
              <div style={{ width: `${(totalB / guardado) * 100}%`, background: "var(--bruna)" }} />
            </div>
          </div>
        )}
      </CardC>
    </div>
  );
}

// helpers
function sumPago(tx, quem) {
  return tx.filter((t) => t.pagoPor === quem && t.tipo !== "receita").reduce((s, t) => s + (Number(t.valor) || 0), 0);
}
function capName(q) { return q === "daniel" ? "Daniel" : q === "bruna" ? "Bruna" : "—"; }

window.FinConjunto = { ConjuntoApp };
