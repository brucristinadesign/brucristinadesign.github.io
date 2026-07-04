/* ══════════════════════════════════════════════════════════════════════
   assistente.jsx — chat estilo Pierre (dentro do app, sincronizado)
   Você manda "gastei 50 no mercado" e vira lançamento pronto.
   Interpretador por regras (sem IA paga, roda no navegador).
   Depende de CAIXINHAS_SUGERIDAS (definido em conjunto.jsx).
   ══════════════════════════════════════════════════════════════════════ */

const PALAVRAS_CAIXA = {
  "Aluguel": ["aluguel", "aluguél"],
  "Água": ["agua", "água", "saae", "sabesp"],
  "Energia": ["energia", "luz", "cpfl", "enel", "elektro", "conta de luz"],
  "Internet": ["internet", "wifi", "claro", "vivo", "tim", "net", "fibra"],
  "Mercado": ["mercado", "supermercado", "compras", "feira", "hortifruti", "atacadão", "atacadao"],
  "Restaurante": ["restaurante", "ifood", "lanche", "comida", "almoço", "almoco", "janta", "jantar", "pizza", "delivery", "padaria", "café", "cafe"],
  "Cartão Noh": ["cartao", "cartão", "noh", "fatura"],
  "Pets": ["pet", "pets", "ração", "racao", "cachorro", "gato", "veterinario", "veterinário", "petshop"],
  "Segurança": ["seguranca", "segurança", "alarme", "portaria"],
  "Transporte": ["transporte", "uber", "99", "gasolina", "combustivel", "combustível", "onibus", "ônibus", "metro", "metrô", "estacionamento", "pedagio", "pedágio"],
  "Lazer": ["lazer", "cinema", "netflix", "spotify", "bar", "festa", "viagem", "passeio", "show", "rolê", "role"],
  "Saúde": ["saude", "saúde", "farmacia", "farmácia", "remedio", "remédio", "medico", "médico", "consulta", "academia", "dentista", "exame"],
};

function _norm(s) { return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }

function parseValor(txt) {
  const limpo = txt.replace(/r\$\s*/gi, " ");
  const m = limpo.match(/(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+,\d{1,2}|\d+(?:\.\d{1,2})?)/);
  if (!m) return null;
  let s = m[1];
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if ((s.match(/\./g) || []).length === 1) { const [a, b] = s.split("."); if (b.length === 3) s = a + b; }
  const v = parseFloat(s);
  return isFinite(v) ? v : null;
}

function parseParcelas(txt) {
  let m = txt.match(/(?:em\s*)?(\d{1,2})\s*x\b/i) || txt.match(/parcelad[oa]s?\s*(?:em\s*)?(\d{1,2})/i) || txt.match(/(\d{1,2})\s*(?:vezes|parcelas)/i);
  if (m) { const n = parseInt(m[1], 10); if (n >= 2 && n <= 48) return { n, raw: m[0] }; }
  return null;
}

function parseData(txt) {
  const t = _norm(txt);
  const hoje = new Date();
  const iso = (d) => d.toISOString().slice(0, 10);
  if (/\bontem\b/.test(t)) { const d = new Date(); d.setDate(d.getDate() - 1); return iso(d); }
  if (/\banteontem\b/.test(t)) { const d = new Date(); d.setDate(d.getDate() - 2); return iso(d); }
  const m = txt.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (m) {
    let [_, dd, mm, yy] = m;
    let ano = yy ? (yy.length === 2 ? 2000 + parseInt(yy, 10) : parseInt(yy, 10)) : hoje.getFullYear();
    const d = new Date(ano, parseInt(mm, 10) - 1, parseInt(dd, 10));
    if (!isNaN(d)) return iso(d);
  }
  return iso(hoje);
}

function detectCaixa(txt) {
  const t = _norm(txt);
  for (const [nome, palavras] of Object.entries(PALAVRAS_CAIXA)) {
    if (palavras.some((p) => t.includes(_norm(p)))) return nome;
  }
  return null;
}

function parseTags(txt) {
  const tags = []; let m; const re = /#([\wçãõáéíóúâêô-]+)/gi;
  while ((m = re.exec(txt))) tags.push(m[1]);
  return tags;
}

// resolve/cria a caixinha pelo nome; retorna o id (ou null)
function garantirCaixa(nome) {
  if (!nome) return null;
  let list = F.getCaixinhas();
  let cx = list.find((c) => _norm(c.nome) === _norm(nome));
  if (cx) return cx.id;
  const sug = (typeof CAIXINHAS_SUGERIDAS !== "undefined" ? CAIXINHAS_SUGERIDAS : []).find((s) => _norm(s.nome) === _norm(nome));
  const nova = { id: F.uid(), nome, emoji: sug ? sug.emoji : "📦", cor: sug ? sug.cor : "#5C6B67", planejado: 0 };
  F.saveCaixinhas([...list, nova]);
  return nova.id;
}

// ── Interpreta e (se for o caso) executa ────────────────────────────────
function interpretar(textoOriginal) {
  const txt = textoOriginal.trim();
  const t = _norm(txt);
  if (!txt) return { reply: "" };

  // ── perguntas ─────────────────────────────────────────────────────
  if (/\bsaldo\b/.test(t)) {
    const g = F.saldoConjuntoGeral();
    return { reply: `Saldo do casal: ${F.fmt(g.saldo)} (entrou ${F.fmt(g.entrou)}, saiu ${F.fmt(g.saiu)}).` };
  }
  if (/(quem envia|cada um envia|rateio|planejado do mes|quanto enviar)/.test(t)) {
    const r = F.rateioMensal();
    return { reply: `Planejado do mês: ${F.fmt(r.total)}. Bruna envia ${F.fmt(r.enviaBruna)} e Daniel envia ${F.fmt(r.enviaDaniel)}.` };
  }
  if (/quanto\s+(gastei|gastamos|saiu|gasto|gastando)/.test(t)) {
    const mk = F.currentMonth();
    const caixaNome = detectCaixa(txt);
    let desp = F.getConjTx().filter((x) => x.tipo !== "receita" && F.monthKey(x.data) === mk && x.status !== "pendente");
    if (caixaNome) {
      const id = (F.getCaixinhas().find((c) => _norm(c.nome) === _norm(caixaNome)) || {}).id;
      desp = desp.filter((x) => x.caixinha === id || _norm(x.categoria || "") === _norm(caixaNome));
    }
    const total = desp.reduce((s, x) => s + (Number(x.valor) || 0), 0);
    return { reply: `Vocês gastaram ${F.fmt(total)}${caixaNome ? ` em ${caixaNome}` : ""} este mês.` };
  }
  if (/quanto\s+(entrou|recebemos|recebi|ganhamos)/.test(t)) {
    const mk = F.currentMonth();
    const rec = F.getConjTx().filter((x) => x.tipo === "receita" && F.monthKey(x.data) === mk);
    return { reply: `Entrou ${F.fmt(rec.reduce((s, x) => s + (Number(x.valor) || 0), 0))} este mês.` };
  }
  if (/quanto falta/.test(t)) {
    const metas = F.getConjMetas();
    const meta = metas.find((m) => t.includes(_norm(m.nome))) || metas[0];
    if (meta) {
      const atual = meta.valorAtual != null ? Number(meta.valorAtual) || 0 : (Number(meta.contribuicaoDaniel) || 0) + (Number(meta.contribuicaoBruna) || 0);
      const p = F.planoMeta({ valorAlvo: meta.valorAlvo, valorAtual: atual, dataAlvo: meta.dataAlvo });
      return { reply: `Faltam ${F.fmt(p.falta)} para "${meta.nome}"${p.porMes != null ? ` (guardem ${F.fmt(p.porMes)}/mês)` : ""}.` };
    }
    return { reply: "Você ainda não tem metas conjuntas cadastradas." };
  }

  // ── lançamento ────────────────────────────────────────────────────
  const valor = parseValor(txt);
  if (valor == null || valor <= 0) {
    return { reply: "Não entendi 🤔 Tente: “gastei 50 no mercado”, “aluguel 1500 a pagar”, “cartão 600 em 6x”, ou pergunte “quanto gastei esse mês?”." };
  }
  const receita = /(recebi|recebemos|entrou|ganhei|ganhamos|salario|salário|deposito|depósito|pix recebido)/.test(t);
  const parc = parseParcelas(txt);
  const data = parseData(txt);
  const status = /(a pagar|vou pagar|pendente|boleto|depois|vence)/.test(t) ? "pendente" : "pago";
  const tags = parseTags(txt);

  if (receita) {
    const tx = { id: F.uid(), tipo: "receita", valor, categoria: "Entrada", data, status: "pago", tags };
    F.saveConjTx([...F.getConjTx(), tx]);
    return { reply: `✅ Entrada de ${F.fmt(valor)} registrada${data !== F.todayISO() ? ` (${F.fmtDate(data)})` : ""}.`, acao: true };
  }

  const caixaNome = detectCaixa(txt);
  const caixaId = garantirCaixa(caixaNome);
  const nomeCat = caixaNome || "Outros";
  if (tags.length) F.registrarTags(tags);

  if (parc) {
    const n = parc.n, centavos = Math.round(valor * 100), base = Math.floor(centavos / n), grupo = F.uid();
    const novos = [];
    for (let i = 0; i < n; i++) {
      const val = (i === n - 1 ? centavos - base * (n - 1) : base) / 100;
      novos.push({ id: F.uid(), tipo: "despesa", valor: val, caixinha: caixaId, categoria: nomeCat, data: shiftMonthISO(data, i), status: i === 0 ? status : "pendente", tags, parcela: `${i + 1}/${n}`, grupoParcela: grupo });
    }
    F.saveConjTx([...F.getConjTx(), ...novos]);
    return { reply: `✅ ${caixaNome || "Compra"} parcelada: ${n}× de ${F.fmt(valor / n)}. A 1ª agora, as outras ${n - 1} entram como “a pagar” nos próximos meses.`, acao: true };
  }

  const tx = { id: F.uid(), tipo: "despesa", valor, caixinha: caixaId, categoria: nomeCat, data, status, tags };
  F.saveConjTx([...F.getConjTx(), tx]);
  return { reply: `✅ Anotei ${F.fmt(valor)}${caixaNome ? ` em ${caixaNome}` : ""}${status === "pendente" ? " (a pagar)" : ""}${data !== F.todayISO() ? ` · ${F.fmtDate(data)}` : ""}.`, acao: true };
}

// ── Componente de chat ──────────────────────────────────────────────────
function ChatAssistente({ reload }) {
  const { Icon: AsI } = window.FinUI;
  const [, force] = useState(0);
  const [texto, setTexto] = useState("");
  const fimRef = useRef(null);

  const msgs = F.store.get("conjunto:chat", []);
  const autor = (() => {
    const e = window.FinSync && window.FinSync.user && window.FinSync.user.email;
    if (e === "bruna.fred10@gmail.com") return "bruna";
    if (e === "daniel.vivaselias@gmail.com") return "daniel";
    return "voce";
  })();

  useEffect(() => { if (fimRef.current) fimRef.current.scrollIntoView({ behavior: "smooth" }); });

  const salvarMsgs = (lista) => F.store.set("conjunto:chat", lista.slice(-60));

  const enviar = (txtManual) => {
    const conteudo = (txtManual != null ? txtManual : texto).trim();
    if (!conteudo) return;
    const agora = Date.now();
    const userMsg = { id: F.uid(), autor, texto: conteudo, ts: agora };
    let lista = [...F.store.get("conjunto:chat", []), userMsg];
    salvarMsgs(lista);
    setTexto("");
    // interpreta
    const res = interpretar(conteudo);
    if (res.reply) {
      lista = [...F.store.get("conjunto:chat", []), { id: F.uid(), autor: "assistente", texto: res.reply, ts: Date.now() }];
      salvarMsgs(lista);
    }
    force((n) => n + 1);
    if (res.acao) reload && reload();
  };

  const corAutor = (a) => a === "bruna" ? "var(--bruna)" : a === "daniel" ? "var(--daniel)" : "var(--petroleo)";
  const nomeAutor = (a) => a === "bruna" ? "Bruna" : a === "daniel" ? "Daniel" : "Você";

  const exemplos = ["gastei 89,90 no mercado", "aluguel 1500 a pagar", "cartão 600 em 6x", "quanto gastei esse mês?"];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100dvh - 240px)", minHeight: 380 }}>
      <div style={{ fontSize: 12.5, color: "var(--tinta-suave)", textAlign: "center", marginBottom: 10, lineHeight: 1.5 }}>
        Mande as contas em linguagem normal — vira lançamento na hora.<br />Os dois veem esse chat. 💬
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, padding: "4px 2px" }}>
        {msgs.length === 0 && (
          <div style={{ margin: "auto", textAlign: "center", color: "var(--tinta-suave)", fontSize: 13, maxWidth: 260 }}>
            <div style={{ fontSize: 30, marginBottom: 8 }}>💬</div>
            Comece mandando algo tipo:
            <div style={{ display: "grid", gap: 6, marginTop: 12 }}>
              {exemplos.map((e) => (
                <button key={e} className="chip" style={{ padding: "8px 12px" }} onClick={() => enviar(e)}>{e}</button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m) => {
          const meu = m.autor !== "assistente";
          const assist = m.autor === "assistente";
          return (
            <div key={m.id} style={{ display: "flex", justifyContent: assist ? "flex-start" : "flex-end" }}>
              <div style={{ maxWidth: "82%", background: assist ? "#fff" : corAutor(m.autor), color: assist ? "var(--tinta)" : "#fff", borderRadius: assist ? "4px 14px 14px 14px" : "14px 4px 14px 14px", padding: "9px 13px", fontSize: 14, boxShadow: "var(--sombra)", lineHeight: 1.4 }}>
                {!assist && <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 700, marginBottom: 2 }}>{nomeAutor(m.autor)}</div>}
                {assist && <div style={{ fontSize: 10, color: "var(--dourado-2)", fontWeight: 700, marginBottom: 2 }}>Assistente</div>}
                {m.texto}
              </div>
            </div>
          );
        })}
        <div ref={fimRef} />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input className="fin-input" placeholder="Ex: gastei 50 no ifood" value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") enviar(); }} />
        <button className="btn btn-primary" style={{ padding: "0 16px" }} onClick={() => enviar()} aria-label="enviar">
          <AsI name="plane" size={18} color="#fff" />
        </button>
      </div>
    </div>
  );
}

window.FinAssist = { ChatAssistente, interpretar };
