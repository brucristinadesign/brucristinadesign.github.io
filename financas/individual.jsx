/* ══════════════════════════════════════════════════════════════════════
   individual.jsx — área individual (Daniel / Bruna)
   Abas: Mês · Lançamentos · Dívidas(Bruna)/Cartão(Daniel) · Metas
   ══════════════════════════════════════════════════════════════════════ */
const { Icon: I, Money: M, MoneyInput: MInput, Card: C, Field: Fld, Modal: Mdl, PathProgress: PP,
  MiniBar: MB, Donut: Dn, CompareBars: CB, LineChart: LC, Confetti: Cf,
  CAT_COLORS: CC, cap: capz } = window.FinUI;

// ── Formulário de transação ─────────────────────────────────────────────
function TxForm({ initial, onSave, onCancel, onDelete }) {
  const [tipo, setTipo] = useState(initial?.tipo || "despesa");
  const [valor, setValor] = useState(initial?.valor ?? "");
  const [categoria, setCategoria] = useState(initial?.categoria || "Mercado");
  const [data, setData] = useState(initial?.data || F.todayISO());
  const [recorrente, setRecorrente] = useState(initial?.recorrente || false);

  const cats = tipo === "receita" ? ["Salário", "Extra", "Outros"] : F.CATEGORIAS.filter((c) => !["Salário"].includes(c));

  const save = () => {
    const v = parseFloat(String(valor).replace(",", "."));
    if (!v || v <= 0) return;
    onSave({ tipo, valor: v, categoria, data, recorrente });
  };
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {["despesa", "receita"].map((t) => (
          <button key={t} className={`chip ${tipo === t ? "active" : ""}`} style={{ flex: 1, padding: "10px" }}
            onClick={() => { setTipo(t); setCategoria(t === "receita" ? "Salário" : "Mercado"); }}>
            {t === "despesa" ? "Despesa" : "Receita"}
          </button>
        ))}
      </div>
      <Fld label="Valor (R$)">
        <MInput value={valor} onChange={setValor} style={{ fontSize: 22 }} autoFocus />
      </Fld>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Fld label="Categoria">
            <select className="fin-select" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              {cats.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Fld>
        </div>
        <div style={{ flex: 1 }}>
          <Fld label="Data">
            <input type="date" className="fin-input" value={data} onChange={(e) => setData(e.target.value)} />
          </Fld>
        </div>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
        <input type="checkbox" checked={recorrente} onChange={(e) => setRecorrente(e.target.checked)} style={{ width: 18, height: 18, accentColor: "var(--petroleo)" }} />
        <span style={{ fontSize: 14 }}>Recorrente (repete todo mês)</span>
      </label>
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={save}>Salvar</button>
        {onDelete && <button className="btn btn-danger" onClick={onDelete}><I name="trash" size={18} /></button>}
      </div>
    </div>
  );
}

// ── Aba: Mês (dashboard) ────────────────────────────────────────────────
function AbaMes({ perfil, cor, refresh }) {
  const [mes, setMes] = useState(F.currentMonth());
  const tx = F.getTx(perfil);
  const r = F.resumoMes(tx, mes);
  const rPrev = F.resumoMes(tx, F.prevMonthKey(mes));
  const budgets = F.getBudgets(perfil);
  const recs = F.recorrentesProximas(perfil);

  const donutData = Object.entries(r.porCategoria)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, value], i) => ({ label: cat, value, color: CC[i % CC.length] }));

  const estouros = Object.entries(budgets)
    .map(([cat, lim]) => ({ cat, lim: Number(lim), gasto: r.porCategoria[cat] || 0 }))
    .filter((b) => b.lim > 0 && b.gasto > b.lim);

  const debito = perfil === "daniel" ? F.getDebito() : null;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* seletor de mês */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button className="btn btn-ghost" style={{ padding: "6px 12px" }} onClick={() => setMes(F.prevMonthKey(mes))}>‹</button>
        <span className="serif" style={{ fontSize: 17, textTransform: "capitalize" }}>{fullMonth(mes)}</span>
        <button className="btn btn-ghost" style={{ padding: "6px 12px", opacity: mes >= F.currentMonth() ? 0.35 : 1 }}
          disabled={mes >= F.currentMonth()} onClick={() => setMes(nextMonth(mes))}>›</button>
      </div>

      {/* saldo do mês */}
      <C stripe={cor} style={{ padding: "22px 20px" }}>
        <div style={{ fontSize: 12.5, color: "var(--tinta-suave)", fontWeight: 600, letterSpacing: ".02em" }}>SALDO DO MÊS</div>
        <div style={{ marginTop: 6 }}>
          <M value={r.saldo} size={40} sign color={r.saldo >= 0 ? "var(--petroleo)" : "var(--coral)"} />
        </div>
        <div style={{ display: "flex", gap: 22, marginTop: 16 }}>
          <div>
            <div style={{ fontSize: 11.5, color: "var(--tinta-suave)" }}>Entrou</div>
            <M value={r.receitas} size={19} color="var(--petroleo-2)" />
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: "var(--tinta-suave)" }}>Saiu</div>
            <M value={r.despesas} size={19} color="var(--coral)" />
          </div>
        </div>
      </C>

      {/* a pagar este mês (inclui sua parte da casa) */}
      <APagarInd perfil={perfil} mes={mes} cor={cor} refresh={refresh} onChange={refresh} />

      {/* alertas de recorrente + estouro */}
      {recs.length > 0 && (
        <C style={{ padding: "14px 16px", background: "#FFF9EE", border: "1px solid rgba(201,161,90,.4)" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <I name="bell" size={18} color="var(--dourado-2)" />
            <div style={{ fontSize: 13.5 }}>
              <b>Vencendo em breve:</b>{" "}
              {recs.map((t) => `${t.categoria} (dia ${t.diaVenc})`).join(", ")}
            </div>
          </div>
        </C>
      )}
      {estouros.length > 0 && (
        <C style={{ padding: "14px 16px", background: "#FDEEEC", border: "1px solid rgba(232,106,92,.4)" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <I name="bell" size={18} color="var(--coral)" />
            <div style={{ fontSize: 13.5 }}>
              <b>Orçamento estourado:</b>{" "}
              {estouros.map((b) => `${b.cat} (${F.fmt(b.gasto)} de ${F.fmt(b.lim)})`).join(", ")}
            </div>
          </div>
        </C>
      )}

      {/* compromisso fixo do Daniel */}
      {debito && (
        <C stripe="var(--coral)" style={{ padding: "16px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <I name="card" size={18} color="var(--coral)" />
              <b style={{ fontSize: 14.5 }}>{debito.nome}</b>
            </div>
            <M value={debito.valorParcela} size={20} color="var(--coral)" />
          </div>
          <div style={{ fontSize: 12.5, color: "var(--tinta-suave)", marginTop: 6 }}>
            {debito.parcelasRestantes} parcela(s) · quitação prevista {F.fmtDate(debito.dataQuitacaoPrevista)}
          </div>
        </C>
      )}

      {/* gráfico por categoria */}
      <C style={{ padding: 18 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 10 }}>Para onde o dinheiro foi</div>
        {donutData.length ? (
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <Dn data={donutData} />
            <div style={{ flex: 1, minWidth: 150, display: "grid", gap: 8 }}>
              {donutData.slice(0, 6).map((d, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <span style={{ width: 11, height: 11, borderRadius: 3, background: d.color }} />
                  <span style={{ flex: 1 }}>{d.label}</span>
                  <span className="num" style={{ color: "var(--tinta)" }}>{F.fmt(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ color: "var(--tinta-suave)", fontSize: 13.5, padding: "10px 0" }}>Nenhuma despesa neste mês ainda.</div>
        )}
      </C>

      {/* comparação com mês anterior */}
      <C style={{ padding: 18 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>Comparação com o mês anterior</div>
        <CB atual={r} anterior={rPrev} labelAtual={F.monthLabel(mes)} labelAnterior={F.monthLabel(F.prevMonthKey(mes))} />
      </C>
    </div>
  );
}

// ── Aba: Lançamentos ────────────────────────────────────────────────────
function AbaLancamentos({ perfil, cor, refresh }) {
  const [, force] = useState(0);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filtro, setFiltro] = useState("todos");
  const tx = F.getTx(perfil).slice().sort((a, b) => (a.data < b.data ? 1 : -1));
  const list = filtro === "todos" ? tx : tx.filter((t) => t.tipo === filtro);

  const reload = () => { force((n) => n + 1); refresh && refresh(); };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {["todos", "receita", "despesa"].map((f) => (
          <button key={f} className={`chip ${filtro === f ? "active" : ""}`} onClick={() => setFiltro(f)}>
            {f === "todos" ? "Todos" : f === "receita" ? "Receitas" : "Despesas"}
          </button>
        ))}
      </div>

      <button className="btn btn-primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        onClick={() => { setEditing(null); setOpen(true); }}>
        <I name="plus" size={18} color="#fff" /> Novo lançamento
      </button>

      <div style={{ display: "grid", gap: 8 }}>
        {list.length === 0 && <div style={{ color: "var(--tinta-suave)", textAlign: "center", padding: 20, fontSize: 14 }}>Nenhum lançamento.</div>}
        {list.map((t) => (
          <C key={t.id} style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
            onClick={() => { setEditing(t); setOpen(true); }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", background: t.tipo === "receita" ? "rgba(46,101,92,.12)" : "rgba(232,106,92,.12)", flexShrink: 0 }}>
              <I name={t.tipo === "receita" ? "coin" : "card"} size={18} color={t.tipo === "receita" ? "var(--petroleo-2)" : "var(--coral)"} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                {t.categoria}
                {t.recorrente && <span style={{ fontSize: 10, background: "rgba(201,161,90,.2)", color: "var(--dourado-2)", padding: "1px 6px", borderRadius: 6, fontWeight: 600 }}>fixo</span>}
              </div>
              <div style={{ fontSize: 12, color: "var(--tinta-suave)" }}>{F.fmtDate(t.data)}</div>
            </div>
            <M value={t.valor} size={17} sign={false} color={t.tipo === "receita" ? "var(--petroleo-2)" : "var(--coral)"} />
          </C>
        ))}
      </div>

      <Mdl open={open} onClose={() => setOpen(false)} title={editing ? "Editar lançamento" : "Novo lançamento"} accent={cor}>
        <TxForm initial={editing}
          onSave={(d) => { editing ? F.updateTx(perfil, editing.id, d) : F.addTx(perfil, d); setOpen(false); reload(); }}
          onDelete={editing ? () => { F.removeTx(perfil, editing.id); setOpen(false); reload(); } : null}
          onCancel={() => setOpen(false)} />
      </Mdl>
    </div>
  );
}

// ── Aba: Dívidas da Bruna (bola de neve) ────────────────────────────────
function AbaDividas({ cor }) {
  const [, force] = useState(0);
  const [extra, setExtra] = useState(() => Number(F.store.get("individual:bruna:extra", 300)));
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [celebrate, setCelebrate] = useState(false);

  const reload = () => force((n) => n + 1);
  const dividas = F.getDividas();
  const snow = F.snowball(dividas, extra);
  const totalInicial = useMemo(() => Number(F.store.get("individual:bruna:dividaInicial", snow.totalDevido || 1)), []);
  const pagoPct = totalInicial > 0 ? Math.max(0, Math.min(100, (1 - snow.totalDevido / totalInicial) * 100)) : 0;

  const saveExtra = (v) => { setExtra(v); F.store.set("individual:bruna:extra", v); };

  const quitar = (d) => {
    // marca dívida como quitada → sai da lista, celebração
    const rest = F.getDividas().filter((x) => x.id !== d.id);
    F.saveDividas(rest);
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 1400);
    reload();
  };

  // marcos = cada dívida quitada, distribuída no caminho pelo momento de quitação
  const milestones = snow.mesesTotais
    ? snow.quitacaoPorDivida
        .filter((q) => q.quitadaEm != null)
        .sort((a, b) => a.quitadaEm - b.quitadaEm)
        .map((q) => ({
          pct: (q.quitadaEm / snow.mesesTotais) * 100,
          label: q.nome.length > 8 ? q.nome.slice(0, 7) + "…" : q.nome,
        }))
    : [];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Cf show={celebrate} />

      {/* caminho até dívida zero */}
      <C stripe={cor} style={{ padding: "18px 18px 8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
          <div style={{ fontSize: 13, color: "var(--tinta-suave)", fontWeight: 600 }}>CAMINHO ATÉ A DÍVIDA ZERO</div>
          <div className="num" style={{ fontSize: 14, color: cor }}>{Math.round(pagoPct)}%</div>
        </div>
        <PP pct={pagoPct} milestones={milestones} color={cor} travelerIcon="coin" height={110} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 13 }}>
          <div>
            <span style={{ color: "var(--tinta-suave)" }}>Faltam </span>
            <b className="num" style={{ color: "var(--coral)" }}>{F.fmt(snow.totalDevido)}</b>
          </div>
          {snow.dataQuitacaoTotal && (
            <div style={{ color: "var(--tinta-suave)" }}>
              livre em <b style={{ color: "var(--petroleo)" }}>{F.fmtDate(snow.dataQuitacaoTotal)}</b>
            </div>
          )}
        </div>
      </C>

      {/* estratégia bola de neve */}
      <C style={{ padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <I name="snow" size={18} color={cor} />
          <b style={{ fontSize: 14.5 }}>Bola de neve</b>
        </div>
        <p style={{ fontSize: 12.8, color: "var(--tinta-suave)", margin: "0 0 14px", lineHeight: 1.5 }}>
          Pague o mínimo de todas e jogue o extra inteiro na <b>menor</b> dívida. Ao quitá-la, esse valor rola pra próxima.
        </p>
        <Fld label="Quanto sobra esse mês pra pagar extra (R$)">
          <MInput value={extra} onChange={(n) => saveExtra(n || 0)} style={{ fontSize: 20 }} />
        </Fld>
        {dividas.length > 0 && (
          <div style={{ marginTop: 14, background: "var(--areia)", borderRadius: 12, padding: "12px 14px", fontSize: 13.5 }}>
            {snow.travado ? (
              <span style={{ color: "var(--coral)" }}>O valor não cobre nem os pagamentos mínimos ({F.fmt(snow.totalMinimo)}/mês). Aumente o extra.</span>
            ) : snow.alvo ? (
              <>
                <div style={{ marginBottom: 4 }}>
                  Pague o mínimo em todas <b className="num">({F.fmt(snow.totalMinimo)})</b> e mais{" "}
                  <b className="num" style={{ color: cor }}>{F.fmt(extra)}</b> em:
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: cor, fontWeight: 600 }}>
                  <I name="target" size={16} color={cor} /> {snow.alvo.nome}
                </div>
              </>
            ) : null}
          </div>
        )}
      </C>

      <button className="btn btn-primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        onClick={() => { setEditing(null); setOpen(true); }}>
        <I name="plus" size={18} color="#fff" /> Adicionar dívida
      </button>

      {/* lista ordenada da menor pra maior */}
      <div style={{ display: "grid", gap: 10 }}>
        {snow.dividas.length === 0 && (
          <C style={{ padding: 24, textAlign: "center" }}>
            <div className="serif" style={{ fontSize: 19, color: "var(--dourado-2)" }}>Sem dívidas 🎉</div>
            <div style={{ fontSize: 13, color: "var(--tinta-suave)", marginTop: 4 }}>Você está livre. Bora pra viagem.</div>
          </C>
        )}
        {snow.dividas.map((d) => {
          const q = snow.quitacaoPorDivida.find((x) => x.id === d.id);
          const isAlvo = snow.alvo && d.id === snow.alvo.id;
          return (
            <C key={d.id} stripe={isAlvo ? cor : "rgba(31,75,68,.15)"} style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", background: isAlvo ? cor : "rgba(31,75,68,.12)", color: isAlvo ? "#fff" : "var(--tinta-suave)", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{d.ordem}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {d.nome} {isAlvo && <span style={{ fontSize: 10, color: cor, fontWeight: 700 }}>◄ FOCO</span>}
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--tinta-suave)" }}>
                      mín {F.fmt(d.parcelaMinima)}{d.juros ? ` · ${d.juros}% a.m.` : ""}
                    </div>
                  </div>
                </div>
                <M value={d.saldoDevedor} size={18} color="var(--coral)" />
              </div>
              {q?.data && (
                <div style={{ fontSize: 11.5, color: "var(--tinta-suave)", marginTop: 8 }}>
                  quitação prevista {F.fmtDate(q.data)}
                </div>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button className="btn btn-gold" style={{ flex: 1, padding: "8px", fontSize: 13 }} onClick={() => quitar(d)}>
                  <I name="check" size={15} color="#2b230f" style={{ verticalAlign: "-2px" }} /> Quitei!
                </button>
                <button className="btn btn-ghost" style={{ padding: "8px 12px" }} onClick={() => { setEditing(d); setOpen(true); }}>
                  <I name="edit" size={16} />
                </button>
              </div>
            </C>
          );
        })}
      </div>

      <Mdl open={open} onClose={() => setOpen(false)} title={editing ? "Editar dívida" : "Nova dívida"} accent={cor}>
        <DividaForm initial={editing}
          onSave={(d) => {
            let list = F.getDividas();
            if (editing) list = list.map((x) => (x.id === editing.id ? { ...x, ...d } : x));
            else list.push({ id: F.uid(), ...d });
            F.saveDividas(list);
            // guarda o total inicial p/ a barra de progresso, se ainda não houver
            if (!F.store.get("individual:bruna:dividaInicial", null)) {
              F.store.set("individual:bruna:dividaInicial", list.reduce((s, x) => s + Number(x.saldoDevedor || 0), 0));
            }
            setOpen(false); reload();
          }}
          onDelete={editing ? () => { F.saveDividas(F.getDividas().filter((x) => x.id !== editing.id)); setOpen(false); reload(); } : null} />
      </Mdl>
    </div>
  );
}

function DividaForm({ initial, onSave, onDelete }) {
  const [nome, setNome] = useState(initial?.nome || "");
  const [saldoDevedor, setSaldo] = useState(initial?.saldoDevedor ?? "");
  const [parcelaMinima, setMin] = useState(initial?.parcelaMinima ?? "");
  const [juros, setJuros] = useState(initial?.juros ?? "");
  const save = () => {
    const s = parseFloat(String(saldoDevedor).replace(",", "."));
    if (!nome.trim() || !s || s <= 0) return;
    onSave({ nome: nome.trim(), saldoDevedor: s, parcelaMinima: parseFloat(String(parcelaMinima).replace(",", ".")) || 0, juros: parseFloat(String(juros).replace(",", ".")) || 0 });
  };
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Fld label="Nome da dívida"><input className="fin-input" placeholder="Ex: Cartão Nubank" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus /></Fld>
      <Fld label="Saldo devedor (R$)"><MInput value={saldoDevedor} onChange={setSaldo} style={{ fontSize: 20 }} /></Fld>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Fld label="Parcela mínima (R$)"><MInput value={parcelaMinima} onChange={setMin} /></Fld></div>
        <div style={{ flex: 1 }}><Fld label="Juros % ao mês"><input className="fin-input num" inputMode="decimal" placeholder="opcional" value={juros} onChange={(e) => setJuros(e.target.value)} /></Fld></div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={save}>Salvar</button>
        {onDelete && <button className="btn btn-danger" onClick={onDelete}><I name="trash" size={18} /></button>}
      </div>
    </div>
  );
}

// ── Aba: Cartão do Daniel (débito fixo simplificado) ────────────────────
function AbaCartaoDaniel({ cor }) {
  const [, force] = useState(0);
  const [open, setOpen] = useState(false);
  const debito = F.getDebito();
  const reload = () => force((n) => n + 1);

  const totalRestante = debito ? (Number(debito.valorParcela) || 0) * (Number(debito.parcelasRestantes) || 0) : 0;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <C style={{ padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <I name="card" size={18} color={cor} />
          <b style={{ fontSize: 14.5 }}>Compromisso fixo</b>
        </div>
        <p style={{ fontSize: 12.8, color: "var(--tinta-suave)", margin: 0, lineHeight: 1.5 }}>
          Sua única pendência é a renegociação do cartão — sem o módulo completo de dívidas, só o essencial.
        </p>
      </C>

      {debito ? (
        <C stripe="var(--coral)" style={{ padding: "20px 18px" }}>
          <div style={{ fontSize: 12.5, color: "var(--tinta-suave)", fontWeight: 600 }}>{debito.nome.toUpperCase()}</div>
          <div style={{ marginTop: 8, display: "flex", alignItems: "baseline", gap: 8 }}>
            <M value={debito.valorParcela} size={34} color="var(--coral)" />
            <span style={{ color: "var(--tinta-suave)", fontSize: 13 }}>/ mês</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 18 }}>
            <div style={{ background: "var(--areia)", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: 11.5, color: "var(--tinta-suave)" }}>Parcelas restantes</div>
              <div className="num" style={{ fontSize: 22, color: "var(--petroleo)" }}>{debito.parcelasRestantes}</div>
            </div>
            <div style={{ background: "var(--areia)", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: 11.5, color: "var(--tinta-suave)" }}>Total restante</div>
              <div className="num" style={{ fontSize: 18, color: "var(--coral)" }}>{F.fmt(totalRestante)}</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: "var(--tinta-suave)", marginTop: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <I name="flag" size={15} color="var(--dourado-2)" />
            Quitação prevista: <b style={{ color: "var(--petroleo)" }}>{F.fmtDate(debito.dataQuitacaoPrevista)}</b>
          </div>
          <button className="btn btn-ghost" style={{ width: "100%", marginTop: 16 }} onClick={() => setOpen(true)}>Editar</button>
        </C>
      ) : (
        <button className="btn btn-primary" onClick={() => setOpen(true)}>Cadastrar renegociação</button>
      )}

      <Mdl open={open} onClose={() => setOpen(false)} title="Renegociação do cartão" accent={cor}>
        <DebitoForm initial={debito}
          onSave={(d) => { F.saveDebito(d); setOpen(false); reload(); }}
          onDelete={debito ? () => { F.saveDebito(null); setOpen(false); reload(); } : null} />
      </Mdl>
    </div>
  );
}

function DebitoForm({ initial, onSave, onDelete }) {
  const [nome, setNome] = useState(initial?.nome || "Renegociação cartão");
  const [valorParcela, setVal] = useState(initial?.valorParcela ?? "");
  const [parcelasRestantes, setParc] = useState(initial?.parcelasRestantes ?? "");
  const [dataQuitacaoPrevista, setData] = useState(initial?.dataQuitacaoPrevista || "");
  const save = () => {
    const v = parseFloat(String(valorParcela).replace(",", "."));
    const p = parseInt(parcelasRestantes, 10);
    if (!v || !p) return;
    const data = dataQuitacaoPrevista || F.dateInMonths(p);
    onSave({ nome: nome.trim() || "Renegociação cartão", valorParcela: v, parcelasRestantes: p, dataQuitacaoPrevista: data });
  };
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Fld label="Nome"><input className="fin-input" value={nome} onChange={(e) => setNome(e.target.value)} /></Fld>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Fld label="Valor da parcela (R$)"><MInput value={valorParcela} onChange={setVal} /></Fld></div>
        <div style={{ flex: 1 }}><Fld label="Parcelas restantes"><input className="fin-input num" inputMode="numeric" value={parcelasRestantes} onChange={(e) => setParc(e.target.value)} /></Fld></div>
      </div>
      <Fld label="Data de quitação prevista (opcional)"><input type="date" className="fin-input" value={dataQuitacaoPrevista} onChange={(e) => setData(e.target.value)} /></Fld>
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={save}>Salvar</button>
        {onDelete && <button className="btn btn-danger" onClick={onDelete}><I name="trash" size={18} /></button>}
      </div>
    </div>
  );
}

// ── Aba: Metas ──────────────────────────────────────────────────────────
function AbaMetas({ perfil, cor }) {
  const [, force] = useState(0);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [aporteFor, setAporteFor] = useState(null);
  const metas = F.getMetas(perfil);
  const reload = () => force((n) => n + 1);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <C style={{ padding: 16, background: "linear-gradient(180deg,#fff, #FFFBF3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <I name="plane" size={20} color="var(--dourado-2)" />
          <b style={{ fontSize: 14.5 }}>Metas de viagem & liberdade</b>
        </div>
        <p style={{ fontSize: 12.8, color: "var(--tinta-suave)", margin: "6px 0 0" }}>Cada meta é um caminho com marcos até seu objetivo.</p>
      </C>

      <button className="btn btn-primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        onClick={() => { setEditing(null); setOpen(true); }}>
        <I name="plus" size={18} color="#fff" /> Nova meta
      </button>

      {metas.length === 0 && <div style={{ color: "var(--tinta-suave)", textAlign: "center", padding: 10, fontSize: 14 }}>Nenhuma meta ainda.</div>}

      {metas.map((meta) => {
        const p = F.planoMeta(meta);
        const marcos = [25, 50, 75].map((m) => ({ pct: m, label: `${m}%` }));
        return (
          <C key={meta.id} stripe={p.batida ? "var(--dourado)" : cor} style={{ padding: "18px 18px 10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="serif" style={{ fontSize: 18 }}>{meta.nome} {p.batida && <span className="celebrate" style={{ display: "inline-block" }}>🏆</span>}</div>
                <div style={{ fontSize: 12.5, color: "var(--tinta-suave)", marginTop: 2 }}>
                  {F.fmt(p.atual)} de {F.fmt(p.alvo)} {meta.dataAlvo && `· até ${F.fmtDate(meta.dataAlvo)}`}
                </div>
              </div>
              <button className="btn btn-ghost" style={{ padding: 8 }} onClick={() => { setEditing(meta); setOpen(true); }}><I name="edit" size={16} /></button>
            </div>

            <div style={{ margin: "6px 0" }}>
              <PP pct={p.pct} milestones={marcos} color={p.batida ? "var(--dourado)" : cor} travelerIcon="plane" height={100} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
              {p.batida ? (
                <div style={{ color: "var(--dourado-2)", fontWeight: 600, fontSize: 13.5 }}>Meta batida! 🎉</div>
              ) : (
                <div style={{ fontSize: 13 }}>
                  <span style={{ color: "var(--tinta-suave)" }}>Faltam </span>
                  <b className="num" style={{ color: cor }}>{F.fmt(p.falta)}</b>
                  {p.porMes != null && <span style={{ color: "var(--tinta-suave)" }}> · guarde <b className="num">{F.fmt(p.porMes)}</b>/mês</span>}
                </div>
              )}
              <button className="btn btn-gold" style={{ padding: "7px 14px", fontSize: 13 }} onClick={() => setAporteFor(meta)}>+ Guardar</button>
            </div>
          </C>
        );
      })}

      <Mdl open={open} onClose={() => setOpen(false)} title={editing ? "Editar meta" : "Nova meta"} accent={cor}>
        <MetaForm initial={editing}
          onSave={(d) => {
            let list = F.getMetas(perfil);
            if (editing) list = list.map((x) => (x.id === editing.id ? { ...x, ...d } : x));
            else list.push({ id: F.uid(), valorAtual: 0, ...d });
            F.saveMetas(perfil, list); setOpen(false); reload();
          }}
          onDelete={editing ? () => { F.saveMetas(perfil, F.getMetas(perfil).filter((x) => x.id !== editing.id)); setOpen(false); reload(); } : null} />
      </Mdl>

      <Mdl open={!!aporteFor} onClose={() => setAporteFor(null)} title={`Guardar em "${aporteFor?.nome || ""}"`} accent={cor}>
        <AporteForm onSave={(v) => {
          const list = F.getMetas(perfil).map((x) => x.id === aporteFor.id ? { ...x, valorAtual: (Number(x.valorAtual) || 0) + v } : x);
          F.saveMetas(perfil, list); setAporteFor(null); reload();
        }} />
      </Mdl>
    </div>
  );
}

function MetaForm({ initial, onSave, onDelete }) {
  const [nome, setNome] = useState(initial?.nome || "");
  const [valorAlvo, setAlvo] = useState(initial?.valorAlvo ?? "");
  const [valorAtual, setAtual] = useState(initial?.valorAtual ?? 0);
  const [dataAlvo, setData] = useState(initial?.dataAlvo || "");
  const save = () => {
    const a = parseFloat(String(valorAlvo).replace(",", "."));
    if (!nome.trim() || !a) return;
    onSave({ nome: nome.trim(), valorAlvo: a, valorAtual: parseFloat(String(valorAtual).replace(",", ".")) || 0, dataAlvo });
  };
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Fld label="Nome da meta"><input className="fin-input" placeholder="Ex: Viagem Chile" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus /></Fld>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Fld label="Valor alvo (R$)"><MInput value={valorAlvo} onChange={setAlvo} /></Fld></div>
        <div style={{ flex: 1 }}><Fld label="Já guardado (R$)"><MInput value={valorAtual} onChange={setAtual} /></Fld></div>
      </div>
      <Fld label="Data desejada (opcional)"><input type="date" className="fin-input" value={dataAlvo} onChange={(e) => setData(e.target.value)} /></Fld>
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={save}>Salvar</button>
        {onDelete && <button className="btn btn-danger" onClick={onDelete}><I name="trash" size={18} /></button>}
      </div>
    </div>
  );
}

function AporteForm({ onSave }) {
  const [v, setV] = useState("");
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Fld label="Quanto guardar agora (R$)"><MInput value={v} onChange={setV} style={{ fontSize: 22 }} autoFocus /></Fld>
      <button className="btn btn-gold" onClick={() => { const n = parseFloat(String(v).replace(",", ".")); if (n > 0) onSave(n); }}>Guardar</button>
    </div>
  );
}

// helpers de mês
function fullMonth(mk) {
  const [y, m] = mk.split("-");
  const nomes = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  return `${nomes[Number(m) - 1]} ${y}`;
}
function nextMonth(mk) {
  let [y, m] = mk.split("-").map(Number);
  m += 1; if (m === 13) { m = 1; y += 1; }
  return `${y}-${String(m).padStart(2, "0")}`;
}

// ── "A pagar este mês" na área individual (inclui a parte da casa) ──────
function APagarInd({ perfil, mes, cor, onChange }) {
  const [, f] = useState(0);
  const rl = () => { f((n) => n + 1); onChange && onChange(); };
  const S = F.scope(perfil);
  const parte = F.parteDaCasa(perfil, mes);
  const mesTx = S.getTx().filter((t) => F.monthKey(t.data) === mes);
  const fixas = S.getCaixinhas().filter((c) => c.fixa && (Number(c.planejado) || 0) > 0 && !S.pagamentoMensal(c.id, mes));
  const pend = mesTx.filter((t) => t.tipo !== "receita" && t.status === "pendente");
  const faturas = S.faturasAbertas().filter((ff) => (ff.faturaMes || "") <= mes);
  const parteAberta = parte.valor > 0 && !parte.enviado;
  const total = (parteAberta ? parte.valor : 0) + fixas.reduce((s, c) => s + (Number(c.planejado) || 0), 0) + pend.reduce((s, t) => s + (+t.valor || 0), 0) + faturas.reduce((s, ff) => s + ff.total, 0);
  if (!(parteAberta || fixas.length || pend.length || faturas.length)) return null;

  const Badge = ({ emoji, bg }) => <div style={{ width: 32, height: 32, borderRadius: 10, background: bg || "rgba(24,33,29,.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{emoji}</div>;
  const Row = ({ badge, titulo, sub, valor, onPagar, txtBtn = "paguei" }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {badge}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{titulo}</div>
        <div style={{ fontSize: 11, color: "var(--tinta-suave)" }}>{sub}</div>
      </div>
      <span className="num" style={{ color: "var(--coral)", fontSize: 14 }}>{F.fmt(valor)}</span>
      <button className="btn btn-gold" style={{ padding: "6px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }} onClick={onPagar}>
        <I name="check" size={13} color="#1c2410" /> {txtBtn}
      </button>
    </div>
  );

  return (
    <C style={{ padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>
        <I name="bell" size={16} color="var(--coral)" /> A pagar este mês
        <span style={{ marginLeft: "auto", color: "var(--coral)" }} className="num">{F.fmt(total)}</span>
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {parteAberta && (
          <Row badge={<Badge emoji="🏠" bg="rgba(201,161,90,.18)" />} titulo="Sua parte da casa" sub="dividido no Conjunto" valor={parte.valor}
            txtBtn="enviei" onPagar={() => { F.toggleParteCasa(perfil, mes); rl(); }} />
        )}
        {fixas.map((c) => (
          <Row key={"m" + c.id} badge={<Badge emoji={c.emoji || "📦"} bg={(c.cor || "#5C6B67") + "22"} />} titulo={c.nome} sub="conta do mês" valor={Number(c.planejado) || 0} onPagar={() => { S.toggleMensal(c, mes); rl(); }} />
        ))}
        {faturas.map((ff) => (
          <Row key={"f" + ff.cartaoId + ff.faturaMes} badge={<Badge emoji={ff.emoji || "💳"} bg={(ff.cor || "#5C6B67") + "22"} />} titulo={`Fatura ${ff.nome}`} sub={`vence ${F.fmtDate(ff.vencimento)}`} valor={ff.total} onPagar={() => { S.pagarFatura(ff.cartaoId, ff.faturaMes); rl(); }} />
        ))}
        {pend.map((t) => (
          <Row key={t.id} badge={<Badge emoji="🧾" />} titulo={t.categoria || "Despesa"} sub={F.fmtDate(t.data)} valor={t.valor} onPagar={() => { S.saveTx(S.getTx().map((x) => x.id === t.id ? { ...x, status: "pago" } : x)); rl(); }} />
        ))}
      </div>
    </C>
  );
}

// ── Caixinhas da área individual ────────────────────────────────────────
function AbaCaixinhasInd({ perfil, cor }) {
  const [, f] = useState(0);
  const rl = () => f((n) => n + 1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [cartaoOpen, setCartaoOpen] = useState(false);
  const [editCartao, setEditCartao] = useState(null);
  const S = F.scope(perfil);
  const mes = F.currentMonth();
  const caixas = S.getCaixinhas();
  const cartoes = S.getCartoes();

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <C style={{ padding: 14, background: "linear-gradient(180deg,#fff,#FBF9F4)" }}>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>Suas caixinhas</div>
        <div style={{ fontSize: 12.5, color: "var(--tinta-suave)", marginTop: 4 }}>Organize seus gastos e contas fixas do mês, só suas.</div>
      </C>

      {caixas.length === 0 && (
        <C style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Comece rápido:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {CAIXINHAS_SUGERIDAS.map((s) => (
              <button key={s.nome} className="chip" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px" }}
                onClick={() => { S.saveCaixinhas([...S.getCaixinhas(), { id: F.uid(), nome: s.nome, emoji: s.emoji, cor: s.cor, planejado: 0 }]); rl(); }}>
                <span style={{ fontSize: 16 }}>{s.emoji}</span> + {s.nome}
              </button>
            ))}
          </div>
        </C>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {caixas.map((c) => {
          const plan = Number(c.planejado) || 0;
          const gasto = S.gastoCaixinha(c.id, mes);
          const pct = plan > 0 ? Math.min(100, (gasto / plan) * 100) : 0;
          const estourou = plan > 0 && gasto > plan;
          const pagoMes = c.fixa && !!S.pagamentoMensal(c.id, mes);
          return (
            <C key={c.id} style={{ padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => { setEditing(c); setOpen(true); }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: (c.cor || "#5C6B67") + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{c.emoji || "📦"}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.nome}</div>
                  {c.fixa && <div style={{ fontSize: 10, color: "var(--tinta-suave)" }}>conta fixa</div>}
                </div>
              </div>
              <div style={{ marginTop: 10, cursor: "pointer" }} onClick={() => { setEditing(c); setOpen(true); }}>
                <div style={{ fontSize: 10.5, color: "var(--tinta-suave)" }}>{c.fixa ? "por mês" : "planejado"}</div>
                <div className="num" style={{ fontSize: 17, color: "var(--petroleo)" }}>{plan > 0 ? F.fmt(plan) : "—"}</div>
              </div>
              {plan > 0 && !c.fixa && (
                <div style={{ marginTop: 8 }}><MB pct={pct} color={estourou ? "var(--coral)" : cor} height={6} /><div style={{ fontSize: 10.5, color: estourou ? "var(--coral)" : "var(--tinta-suave)", marginTop: 4 }}>gasto {F.fmt(gasto)}</div></div>
              )}
              {c.fixa && plan > 0 && (
                <button className="btn" style={{ width: "100%", marginTop: 10, padding: "7px", fontSize: 12, background: pagoMes ? "var(--petroleo-2)" : "var(--lima)", color: pagoMes ? "#fff" : "#1c2410", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
                  onClick={() => { S.toggleMensal(c, mes); rl(); }}>
                  <I name="check" size={14} color={pagoMes ? "#fff" : "#1c2410"} /> {pagoMes ? "pago este mês" : "marcar pago"}
                </button>
              )}
            </C>
          );
        })}
        <button onClick={() => { setEditing(null); setOpen(true); }} style={{ border: "1.5px dashed rgba(24,33,29,.22)", borderRadius: 20, background: "transparent", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 110, color: "var(--tinta-suave)", cursor: "pointer" }}>
          <I name="plus" size={22} /> <span style={{ fontSize: 12.5 }}>Nova caixinha</span>
        </button>
      </div>

      {/* cartões pessoais */}
      <div style={{ marginTop: 4 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, margin: "4px 2px 10px", display: "flex", alignItems: "center", gap: 6 }}><I name="card" size={16} color="var(--tinta)" /> Seus cartões</div>
        <div style={{ display: "grid", gap: 8 }}>
          {cartoes.map((c) => {
            const aberto = S.faturasAbertas().filter((ff) => ff.cartaoId === c.id).reduce((s, ff) => s + ff.total, 0);
            return (
              <C key={c.id} style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => { setEditCartao(c); setCartaoOpen(true); }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: (c.cor || "#18211D") + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{c.emoji || "💳"}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{c.nome}</div>
                  <div style={{ fontSize: 11.5, color: "var(--tinta-suave)" }}>fecha dia {c.fechamento} · vence dia {c.vencimento}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: "var(--tinta-suave)" }}>fatura aberta</div>
                  <div className="num" style={{ fontSize: 15, color: aberto ? "var(--coral)" : "var(--tinta-suave)" }}>{aberto ? F.fmt(aberto) : "—"}</div>
                </div>
              </C>
            );
          })}
          <button className="btn btn-ghost" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }} onClick={() => { setEditCartao(null); setCartaoOpen(true); }}>
            <I name="plus" size={16} /> Adicionar cartão
          </button>
        </div>
      </div>

      <Mdl open={open} onClose={() => setOpen(false)} title={editing ? "Editar caixinha" : "Nova caixinha"} accent={cor}>
        <CaixinhaForm initial={editing}
          onSave={(d) => { let list = S.getCaixinhas(); if (editing) list = list.map((x) => x.id === editing.id ? { ...x, ...d } : x); else list.push({ id: F.uid(), ...d }); S.saveCaixinhas(list); setOpen(false); rl(); }}
          onDelete={editing ? () => { S.saveCaixinhas(S.getCaixinhas().filter((x) => x.id !== editing.id)); setOpen(false); rl(); } : null} />
      </Mdl>
      <Mdl open={cartaoOpen} onClose={() => setCartaoOpen(false)} title={editCartao ? "Editar cartão" : "Novo cartão"} accent={cor}>
        <CartaoForm initial={editCartao}
          onSave={(d) => { let list = S.getCartoes(); if (editCartao) list = list.map((x) => x.id === editCartao.id ? { ...x, ...d } : x); else list.push({ id: F.uid(), ...d }); S.saveCartoes(list); setCartaoOpen(false); rl(); }}
          onDelete={editCartao ? () => { S.saveCartoes(S.getCartoes().filter((x) => x.id !== editCartao.id)); setCartaoOpen(false); rl(); } : null} />
      </Mdl>
    </div>
  );
}

// ── Chat individual ─────────────────────────────────────────────────────
function AbaChatInd({ perfil }) {
  return window.FinAssist ? <window.FinAssist.ChatAssistente ctx={window.FinAssist.ctxFor(perfil)} sub="Organize suas contas: mande em linguagem normal e vira lançamento. Só você vê. 💬" /> : null;
}

window.FinIndividual = { AbaMes, AbaLancamentos, AbaDividas, AbaCartaoDaniel, AbaMetas, AbaCaixinhasInd, AbaChatInd, APagarInd };
