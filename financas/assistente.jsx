/* ══════════════════════════════════════════════════════════════════════
   assistente.jsx — chat estilo Pierre (por escopo: Conjunto ou individual)
   "gastei 50 no mercado" → vira lançamento. Interpretador por regras.
   Recebe um ctx (F.scope(...)) — funciona igual pro casal e pra cada um.
   ══════════════════════════════════════════════════════════════════════ */

const PALAVRAS_CAIXA = {
  "Aluguel": ["aluguel", "aluguél"],
  "Água": ["agua", "água", "saae", "sabesp"],
  "Energia": ["energia", "luz", "cpfl", "enel", "elektro", "conta de luz"],
  "Internet": ["internet", "wifi", "claro", "vivo", "tim", "net", "fibra"],
  "Mercado": ["mercado", "supermercado", "compras", "feira", "hortifruti", "atacadão", "atacadao"],
  "Restaurante": ["restaurante", "ifood", "lanche", "comida", "almoço", "almoco", "janta", "jantar", "pizza", "delivery", "padaria", "café", "cafe"],
  "Pets": ["pet", "pets", "ração", "racao", "cachorro", "gato", "veterinario", "veterinário", "petshop"],
  "Segurança": ["seguranca", "segurança", "alarme", "portaria"],
  "Transporte": ["transporte", "uber", "gasolina", "combustivel", "combustível", "onibus", "ônibus", "metro", "metrô", "estacionamento", "pedagio", "pedágio", "99app"],
  "Lazer": ["lazer", "cinema", "netflix", "spotify", "bar", "festa", "viagem", "passeio", "show", "rolê", "role"],
  "Saúde": ["saude", "saúde", "farmacia", "farmácia", "remedio", "remédio", "medico", "médico", "consulta", "academia", "dentista", "exame"],
};

function _norm(s) { return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }

// converte "1.234,56" / "1234.56" / "50" → número
function _toNum(s) {
  s = String(s).trim();
  if (!s) return null;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if ((s.match(/\./g) || []).length === 1) { const [a, b] = s.split("."); if (b.length === 3) s = a + b; }
  const v = parseFloat(s);
  return isFinite(v) ? v : null;
}

const _NUM = "\\d{1,3}(?:\\.\\d{3})+(?:,\\d{1,2})?|\\d+,\\d{1,2}|\\d+(?:\\.\\d{1,2})?|\\d+";

// valor do lançamento; aceita soma "50 + 30 + 20" (ou "50 mais 30")
function parseValor(txt) {
  let s = " " + txt.toLowerCase() + " ";
  s = s.replace(/r\$/g, " ");
  s = s.replace(/\b\d{1,2}\s*x\b/g, " ");                          // tira parcelas "6x"
  s = s.replace(/\bem\s*\d{1,2}\s*(?:vezes|parcelas)\b/g, " ");    // "em 6 vezes"
  s = s.replace(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g, " ");       // tira datas
  s = s.replace(/\bmais\b/g, "+");                                  // "mais" vira +

  // expressão de soma: número (+ número)+
  const somaRe = new RegExp("(?:" + _NUM + ")(?:\\s*\\+\\s*(?:" + _NUM + "))+");
  const mSoma = s.match(somaRe);
  if (mSoma) {
    const parts = mSoma[0].split("+").map((x) => _toNum(x)).filter((x) => x != null);
    if (parts.length >= 2) return parts.reduce((a, b) => a + b, 0);
  }
  const m1 = s.match(new RegExp(_NUM));
  return m1 ? _toNum(m1[0]) : null;
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
  let t = " " + _norm(txt) + " ";
  t = t.replace(/\d+(?:[.,]\d+)?/g, " ");   // remove valores/números (não confundir com categoria)
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  for (const [nome, palavras] of Object.entries(PALAVRAS_CAIXA)) {
    if (palavras.some((p) => new RegExp("\\b" + esc(_norm(p)) + "\\b").test(t))) return nome;
  }
  return null;
}

function parseTags(txt) {
  const tags = []; let m; const re = /#([\wçãõáéíóúâêô-]+)/gi;
  while ((m = re.exec(txt))) tags.push(m[1]);
  return tags;
}

// resolve/cria a caixinha pelo nome no escopo; retorna o id (ou null)
function garantirCaixa(nome, ctx) {
  if (!nome) return null;
  let list = ctx.getCaixinhas();
  let cx = list.find((c) => _norm(c.nome) === _norm(nome));
  if (cx) return cx.id;
  const sug = (typeof CAIXINHAS_SUGERIDAS !== "undefined" ? CAIXINHAS_SUGERIDAS : []).find((s) => _norm(s.nome) === _norm(nome));
  const nova = { id: F.uid(), nome, emoji: sug ? sug.emoji : "📦", cor: sug ? sug.cor : "#7A847F", planejado: 0 };
  ctx.saveCaixinhas([...list, nova]);
  return nova.id;
}

// ── Interpreta e (se for o caso) executa, dentro do escopo (ctx) ────────
function interpretar(textoOriginal, ctx) {
  const txt = textoOriginal.trim();
  const t = _norm(txt);
  if (!txt) return { reply: "" };
  const conj = !!ctx.conjunto;

  // ── perguntas ─────────────────────────────────────────────────────
  if (/\bsaldo\b/.test(t)) {
    const g = ctx.saldoGeral();
    return { reply: `${conj ? "Saldo do casal" : "Seu saldo"}: ${F.fmt(g.saldo)} (entrou ${F.fmt(g.entrou)}, saiu ${F.fmt(g.saiu)}).` };
  }
  if (conj && /(quem envia|cada um envia|rateio|planejado do mes|quanto enviar)/.test(t)) {
    const r = ctx.rateio();
    return { reply: `Planejado do mês: ${F.fmt(r.total)}. Bruna envia ${F.fmt(r.enviaBruna)} e Daniel envia ${F.fmt(r.enviaDaniel)}.` };
  }
  if (!conj && /(minha parte|parte da casa|quanto envio|quanto mandar|manda pra casa|casa)/.test(t) && ctx.parteCasa) {
    const p = ctx.parteCasa(F.currentMonth());
    return { reply: `Sua parte da casa este mês: ${F.fmt(p.valor)}${p.enviado ? " (já enviada ✓)" : ""}.` };
  }
  if (/quanto\s+(gastei|gastamos|saiu|gasto|gastando)/.test(t)) {
    const mk = F.currentMonth();
    const caixaNome = detectCaixa(txt);
    let desp = ctx.getTx().filter((x) => x.tipo !== "receita" && F.monthKey(x.data) === mk && x.status !== "pendente" && x.status !== "fatura");
    if (caixaNome) {
      const id = (ctx.getCaixinhas().find((c) => _norm(c.nome) === _norm(caixaNome)) || {}).id;
      desp = desp.filter((x) => x.caixinha === id || _norm(x.categoria || "") === _norm(caixaNome));
    }
    const total = desp.reduce((s, x) => s + (Number(x.valor) || 0), 0);
    return { reply: `${conj ? "Vocês gastaram" : "Você gastou"} ${F.fmt(total)}${caixaNome ? ` em ${caixaNome}` : ""} este mês.` };
  }
  if (/quanto\s+(entrou|recebemos|recebi|ganhamos|ganhei)/.test(t)) {
    const mk = F.currentMonth();
    const rec = ctx.getTx().filter((x) => x.tipo === "receita" && F.monthKey(x.data) === mk);
    return { reply: `Entrou ${F.fmt(rec.reduce((s, x) => s + (Number(x.valor) || 0), 0))} este mês.` };
  }
  if (/quanto falta/.test(t)) {
    const metas = ctx.getMetas();
    const meta = metas.find((m) => t.includes(_norm(m.nome))) || metas[0];
    if (meta) {
      const atual = meta.valorAtual != null ? Number(meta.valorAtual) || 0 : (Number(meta.contribuicaoDaniel) || 0) + (Number(meta.contribuicaoBruna) || 0);
      const p = F.planoMeta({ valorAlvo: meta.valorAlvo, valorAtual: atual, dataAlvo: meta.dataAlvo });
      return { reply: `Faltam ${F.fmt(p.falta)} para "${meta.nome}"${p.porMes != null ? ` (guarde ${F.fmt(p.porMes)}/mês)` : ""}.` };
    }
    return { reply: "Não achei metas cadastradas." };
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
  // tag automática de quem é (organiza o que cada um paga)
  ["bruna", "daniel"].forEach((nm) => {
    if (new RegExp("\\b" + nm + "\\b").test(t)) { const T = nm[0].toUpperCase() + nm.slice(1); if (!tags.includes(T)) tags.push(T); }
  });

  if (receita) {
    const tx = { id: F.uid(), tipo: "receita", valor, categoria: "Entrada", metodo: "avista", data, status: "pago", tags };
    ctx.saveTx([...ctx.getTx(), tx]);
    return { reply: `✅ Entrada de ${F.fmt(valor)} registrada${data !== F.todayISO() ? ` (${F.fmtDate(data)})` : ""}.`, acao: true };
  }

  // forma de pagamento: cartão (fatura) ou à vista
  const cartoes = ctx.getCartoes();
  let cartao = null;
  if (/(cart[aã]o|cr[eé]dito|fatura|noh)/.test(t) && cartoes.length) {
    cartao = cartoes.find((c) => t.includes(_norm(c.nome))) || cartoes[0];
  }
  let caixaNome = detectCaixa(txt);
  // prioriza uma caixinha que o usuário já criou (casa pelo nome dela)
  const _semNum = " " + _norm(txt).replace(/\d+(?:[.,]\d+)?/g, " ") + " ";
  const cxMatch = ctx.getCaixinhas().find((c) => new RegExp("\\b" + _norm(c.nome).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b").test(_semNum));
  if (cxMatch) caixaNome = cxMatch.nome;
  if (cartao && caixaNome && _norm(caixaNome) === _norm(cartao.nome)) caixaNome = null;
  const caixaId = caixaNome ? garantirCaixa(caixaNome, ctx) : null;
  const nomeCat = caixaNome || "Outros";
  // caixinha vinculada a uma pessoa → herda a tag (organiza o valor de cada um)
  const caixaObj = caixaId ? ctx.getCaixinhas().find((c) => c.id === caixaId) : null;
  if (caixaObj && caixaObj.dono) { const T = caixaObj.dono[0].toUpperCase() + caixaObj.dono.slice(1); if (!tags.includes(T)) tags.push(T); }
  if (tags.length) ctx.registrarTags(tags);

  if (cartao) {
    const n = parc ? parc.n : 1;
    const centavos = Math.round(valor * 100), base = Math.floor(centavos / n), grupo = F.uid();
    const f0 = F.faturaDoCartao(data, cartao.fechamento, cartao.vencimento);
    const novos = [];
    for (let i = 0; i < n; i++) {
      const val = (i === n - 1 ? centavos - base * (n - 1) : base) / 100;
      const venc = shiftMonthISO(f0.vencimento, i);
      novos.push({ id: F.uid(), tipo: "despesa", valor: val, caixinha: caixaId, categoria: nomeCat, metodo: cartao.id, status: "fatura", fatura: venc.slice(0, 7), vencimento: venc, data: venc, dataCompra: data, tags, ...(n > 1 ? { parcela: `${i + 1}/${n}`, grupoParcela: grupo } : {}) });
    }
    ctx.saveTx([...ctx.getTx(), ...novos]);
    return { reply: `✅ ${F.fmt(valor)}${caixaNome ? ` em ${caixaNome}` : ""} no ${cartao.nome}${n > 1 ? ` em ${n}×` : ""} — ${n > 1 ? "cai nas próximas faturas" : `entra na fatura que vence ${F.fmtDate(f0.vencimento)}`}.`, acao: true };
  }

  if (parc) {
    const n = parc.n, centavos = Math.round(valor * 100), base = Math.floor(centavos / n), grupo = F.uid();
    const novos = [];
    for (let i = 0; i < n; i++) {
      const val = (i === n - 1 ? centavos - base * (n - 1) : base) / 100;
      novos.push({ id: F.uid(), tipo: "despesa", valor: val, caixinha: caixaId, categoria: nomeCat, metodo: "avista", data: shiftMonthISO(data, i), status: i === 0 ? status : "pendente", tags, parcela: `${i + 1}/${n}`, grupoParcela: grupo });
    }
    ctx.saveTx([...ctx.getTx(), ...novos]);
    return { reply: `✅ ${caixaNome || "Compra"} parcelada: ${n}× de ${F.fmt(valor / n)}. A 1ª agora, as outras ${n - 1} como “a pagar”.`, acao: true };
  }

  const tx = { id: F.uid(), tipo: "despesa", valor, caixinha: caixaId, categoria: nomeCat, metodo: "avista", data, status, tags };
  ctx.saveTx([...ctx.getTx(), tx]);
  return { reply: `✅ Anotei ${F.fmt(valor)}${caixaNome ? ` em ${caixaNome}` : ""}${status === "pendente" ? " (a pagar)" : ""}${data !== F.todayISO() ? ` · ${F.fmtDate(data)}` : ""}.`, acao: true };
}

// ── monta o ctx para um escopo ("conjunto" | "bruna" | "daniel") ────────
function ctxFor(scopeId) {
  const S = F.scope(scopeId);
  S.perfil = scopeId;
  if (scopeId === "conjunto") S.rateio = () => F.rateioMensal();
  else S.parteCasa = (mk) => F.parteDaCasa(scopeId, mk);
  return S;
}

// ── Componente de chat ──────────────────────────────────────────────────
function ChatAssistente({ ctx, reload, sub }) {
  const { Icon: AsI } = window.FinUI;
  const [, force] = useState(0);
  const [texto, setTexto] = useState("");
  const fimRef = useRef(null);
  const conj = !!ctx.conjunto;

  const msgs = ctx.getChat();
  const autor = (() => {
    if (!conj) return ctx.perfil; // na área individual, é o dono
    const e = window.FinSync && window.FinSync.user && window.FinSync.user.email;
    if (e === "bruna.fred10@gmail.com") return "bruna";
    if (e === "daniel.vivaselias@gmail.com") return "daniel";
    return "voce";
  })();

  useEffect(() => { if (fimRef.current) fimRef.current.scrollIntoView({ behavior: "smooth" }); });

  const enviar = (txtManual) => {
    const conteudo = (txtManual != null ? txtManual : texto).trim();
    if (!conteudo) return;
    let lista = [...ctx.getChat(), { id: F.uid(), autor, texto: conteudo, ts: Date.now() }];
    ctx.saveChat(lista);
    setTexto("");
    const res = interpretar(conteudo, ctx);
    if (res.reply) ctx.saveChat([...ctx.getChat(), { id: F.uid(), autor: "assistente", texto: res.reply, ts: Date.now() }]);
    force((n) => n + 1);
    if (res.acao) reload && reload();
  };

  const corAutor = (a) => a === "bruna" ? "var(--bruna)" : a === "daniel" ? "var(--daniel)" : "var(--petroleo)";
  const nomeAutor = (a) => a === "bruna" ? "Bruna" : a === "daniel" ? "Daniel" : "Você";
  const exemplos = ["gastei 89,90 no mercado", "aluguel 1500 a pagar", "cartão 600 em 6x", "quanto gastei esse mês?"];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100dvh - 240px)", minHeight: 380 }}>
      <div style={{ fontSize: 12.5, color: "var(--tinta-suave)", textAlign: "center", marginBottom: 10, lineHeight: 1.5 }}>
        {sub || (conj ? "Mande as contas em linguagem normal — vira lançamento na hora. Os dois veem esse chat. 💬" : "Organize suas contas: mande em linguagem normal e vira lançamento. 💬")}
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
          const assist = m.autor === "assistente";
          return (
            <div key={m.id} style={{ display: "flex", justifyContent: assist ? "flex-start" : "flex-end" }}>
              <div style={{ maxWidth: "82%", background: assist ? "#fff" : corAutor(m.autor), color: assist ? "var(--tinta)" : "#fff", borderRadius: assist ? "4px 14px 14px 14px" : "14px 4px 14px 14px", padding: "9px 13px", fontSize: 14, boxShadow: "var(--sombra)", lineHeight: 1.4 }}>
                {!assist && conj && <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 700, marginBottom: 2 }}>{nomeAutor(m.autor)}</div>}
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

window.FinAssist = { ChatAssistente, interpretar, ctxFor };
