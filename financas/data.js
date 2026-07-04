/* ══════════════════════════════════════════════════════════════════════
   data.js — camada de dados, persistência e regras de negócio
   App de Controle Financeiro · Daniel & Bruna
   ────────────────────────────────────────────────────────────────────
   Persistência: usa window.storage (apps Claude) quando disponível,
   senão cai para localStorage (GitHub Pages). As CHAVES seguem
   exatamente o schema da seção 8.1 do documento.
   ══════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  // ── Storage shim ────────────────────────────────────────────────────
  // window.storage (get/set/list, pessoal vs. compartilhado) OU localStorage.
  const hasWinStorage =
    typeof window !== "undefined" &&
    window.storage &&
    typeof window.storage.get === "function";

  const LS_PREFIX = "bc.financas.";

  function rawGet(key) {
    try {
      if (hasWinStorage) {
        const v = window.storage.get(key);
        return v == null ? null : v;
      }
      const s = localStorage.getItem(LS_PREFIX + key);
      return s == null ? null : JSON.parse(s);
    } catch (e) {
      console.warn("storage get falhou:", key, e);
      return null;
    }
  }

  function rawSet(key, value) {
    try {
      if (hasWinStorage) window.storage.set(key, value);
      else localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.warn("storage set falhou:", key, e);
    }
    // espelha para a nuvem (tempo real) quando a sincronização está ligada
    try {
      if (window.FinSync && window.FinSync.enabled && window.FinSync.push) {
        window.FinSync.push(key, value);
      }
    } catch (e) {
      console.warn("sync push falhou:", key, e);
    }
  }

  const store = {
    get: (key, fallback) => {
      const v = rawGet(key);
      return v == null ? fallback : v;
    },
    set: rawSet,
  };

  // ── Utilidades ──────────────────────────────────────────────────────
  const uid = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  const fmt = (n) => {
    const v = Number(n) || 0;
    return v.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  // BRL sem símbolo, para números grandes serifados
  const fmtNum = (n) => {
    const v = Number(n) || 0;
    return v.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const todayISO = () => new Date().toISOString().slice(0, 10);
  const monthKey = (iso) => (iso || todayISO()).slice(0, 7); // "2026-07"
  const currentMonth = () => monthKey(todayISO());

  const MONTH_NAMES = [
    "jan", "fev", "mar", "abr", "mai", "jun",
    "jul", "ago", "set", "out", "nov", "dez",
  ];
  const monthLabel = (mk) => {
    const [y, m] = mk.split("-");
    return `${MONTH_NAMES[Number(m) - 1]}/${y.slice(2)}`;
  };
  const prevMonthKey = (mk) => {
    let [y, m] = mk.split("-").map(Number);
    m -= 1;
    if (m === 0) { m = 12; y -= 1; }
    return `${y}-${String(m).padStart(2, "0")}`;
  };

  const daysUntil = (iso) => {
    if (!iso) return null;
    const d = new Date(iso + "T00:00:00");
    const now = new Date(todayISO() + "T00:00:00");
    return Math.round((d - now) / 86400000);
  };

  // Projeta uma data ISO com N meses à frente da data atual
  const dateInMonths = (n) => {
    const d = new Date();
    d.setMonth(d.getMonth() + Math.max(0, Math.ceil(n)));
    return d.toISOString().slice(0, 10);
  };
  const fmtDate = (iso) => {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };

  // ── PIN (hash simples — NÃO é segurança bancária) ───────────────────
  const hashPin = (pin) => {
    let h = 5381;
    const s = String(pin);
    for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
    return (h >>> 0).toString(16);
  };
  const pinKey = (perfil) => `perfil:${perfil}:pin`;
  const getPinHash = (perfil) => store.get(pinKey(perfil), null);
  const setPin = (perfil, pin) => store.set(pinKey(perfil), hashPin(pin));
  const checkPin = (perfil, pin) => getPinHash(perfil) === hashPin(pin);
  const hasPin = (perfil) => getPinHash(perfil) != null;

  // ── Categorias padrão ───────────────────────────────────────────────
  const CATEGORIAS = [
    "Moradia", "Mercado", "Transporte", "Lazer",
    "Assinaturas", "Saúde", "Salário", "Extra", "Outros",
  ];

  // Catálogo rico (ícone + cor) — estilo Mobills, para lançamento rápido
  const CATEGORIA_META = {
    "Moradia":     { icon: "home",  cor: "#1F4B44" },
    "Mercado":     { icon: "cart",  cor: "#2E655C" },
    "Contas":      { icon: "bolt",  cor: "#B08840" },
    "Transporte":  { icon: "car",   cor: "#4C766D" },
    "Restaurante": { icon: "food",  cor: "#E86A5C" },
    "Lazer":       { icon: "ticket",cor: "#C9A15A" },
    "Saúde":       { icon: "heart", cor: "#A8586B" },
    "Assinaturas": { icon: "tv",    cor: "#6E8B84" },
    "Educação":    { icon: "book",  cor: "#8BA888" },
    "Pets":        { icon: "paw",   cor: "#D8B67A" },
    "Salário":     { icon: "coin",  cor: "#2E655C" },
    "Extra":       { icon: "coin",  cor: "#C9A15A" },
    "Outros":      { icon: "dots",  cor: "#5C6B67" },
  };
  // categorias oferecidas na área Conjunto (despesas da casa)
  const CATEGORIAS_CASA = [
    "Moradia", "Mercado", "Contas", "Transporte", "Restaurante",
    "Lazer", "Saúde", "Assinaturas", "Educação", "Pets", "Outros",
  ];
  const catMeta = (nome) => CATEGORIA_META[nome] || { icon: "dots", cor: "#5C6B67" };

  // ── Transações (individual) ─────────────────────────────────────────
  const txKey = (perfil) => `individual:${perfil}:transacoes`;
  const getTx = (perfil) => store.get(txKey(perfil), []);
  const saveTx = (perfil, list) => store.set(txKey(perfil), list);
  const addTx = (perfil, tx) => {
    const list = getTx(perfil);
    list.push({ id: uid(), recorrente: false, ...tx });
    saveTx(perfil, list);
    return list;
  };
  const updateTx = (perfil, id, patch) => {
    const list = getTx(perfil).map((t) => (t.id === id ? { ...t, ...patch } : t));
    saveTx(perfil, list);
    return list;
  };
  const removeTx = (perfil, id) => {
    const list = getTx(perfil).filter((t) => t.id !== id);
    saveTx(perfil, list);
    return list;
  };

  // ── Orçamentos por categoria (envelope YNAB) ────────────────────────
  const budgetKey = (perfil) => `individual:${perfil}:orcamentos`;
  const getBudgets = (perfil) => store.get(budgetKey(perfil), {});
  const saveBudgets = (perfil, obj) => store.set(budgetKey(perfil), obj);

  // ── Metas (individual) ──────────────────────────────────────────────
  const metasKey = (perfil) => `individual:${perfil}:metas`;
  const getMetas = (perfil) => store.get(metasKey(perfil), []);
  const saveMetas = (perfil, list) => store.set(metasKey(perfil), list);

  // ── Dívidas da Bruna (bola de neve) ─────────────────────────────────
  const dividasKey = () => `individual:bruna:dividas`;
  const getDividas = () => store.get(dividasKey(), []);
  const saveDividas = (list) => store.set(dividasKey(), list);

  // ── Débito fixo do Daniel ───────────────────────────────────────────
  const debitoKey = () => `individual:daniel:debito-fixo`;
  const getDebito = () => store.get(debitoKey(), null);
  const saveDebito = (obj) => store.set(debitoKey(), obj);

  // ── Conjunto (compartilhado) ────────────────────────────────────────
  const conjTxKey = () => `conjunto:transacoes`;
  const getConjTx = () => store.get(conjTxKey(), []);
  const saveConjTx = (list) => store.set(conjTxKey(), list);

  const conjMetasKey = () => `conjunto:metas`;
  const getConjMetas = () => store.get(conjMetasKey(), []);
  const saveConjMetas = (list) => store.set(conjMetasKey(), list);

  // tags reutilizáveis da área Conjunto (estilo Mobills)
  const conjTagsKey = () => `conjunto:tags`;
  const getConjTags = () => store.get(conjTagsKey(), []);
  const saveConjTags = (list) => store.set(conjTagsKey(), list);
  const registrarTags = (tags) => {
    if (!tags || !tags.length) return;
    const atuais = getConjTags();
    const set = new Set(atuais);
    tags.forEach((t) => { const v = String(t).trim(); if (v) set.add(v); });
    saveConjTags(Array.from(set));
  };

  const conjConfigKey = () => `conjunto:config`;
  const getConjConfig = () =>
    store.get(conjConfigKey(), {
      modoDivisao: "50-50",
      percentualDaniel: 50,
      percentualBruna: 50,
    });
  const saveConjConfig = (obj) => store.set(conjConfigKey(), obj);

  // ── Snapshots de patrimônio conjunto (série temporal) ───────────────
  const conjPatrimKey = () => `conjunto:patrimonio`;
  const getPatrim = () => store.get(conjPatrimKey(), []);
  const savePatrim = (list) => store.set(conjPatrimKey(), list);

  /* ════════════════════════════════════════════════════════════════════
     REGRAS DE NEGÓCIO
     ════════════════════════════════════════════════════════════════════ */

  // Resumo de um mês para um conjunto de transações
  function resumoMes(txList, mk) {
    const doMes = txList.filter((t) => monthKey(t.data) === mk);
    let receitas = 0, despesas = 0;
    const porCategoria = {};
    doMes.forEach((t) => {
      const v = Number(t.valor) || 0;
      if (t.tipo === "receita") receitas += v;
      else {
        despesas += v;
        porCategoria[t.categoria] = (porCategoria[t.categoria] || 0) + v;
      }
    });
    return { receitas, despesas, saldo: receitas - despesas, porCategoria, itens: doMes };
  }

  // ── Bola de neve (seção 8.2) ────────────────────────────────────────
  // Ordena por saldoDevedor crescente, aloca "extra" na menor, e simula
  // mês a mês até quitar tudo, com rolagem (snowball) das parcelas quitadas.
  function snowball(dividasIn, extraMensal) {
    const dividas = dividasIn
      .map((d) => ({ ...d, saldoDevedor: Number(d.saldoDevedor) || 0 }))
      .filter((d) => d.saldoDevedor > 0)
      .sort((a, b) => a.saldoDevedor - b.saldoDevedor)
      .map((d, i) => ({ ...d, ordem: i + 1 }));

    const totalDevido = dividas.reduce((s, d) => s + d.saldoDevedor, 0);
    const totalMinimo = dividas.reduce(
      (s, d) => s + (Number(d.parcelaMinima) || 0),
      0
    );
    const extra = Math.max(0, Number(extraMensal) || 0);

    // Alocação sugerida do mês (o extra inteiro vai pra ordem 1)
    const alvo = dividas[0] || null;

    // Simulação
    const sim = dividas.map((d) => ({
      id: d.id,
      nome: d.nome,
      saldo: d.saldoDevedor,
      minima: Number(d.parcelaMinima) || 0,
      juros: Number(d.juros) || 0, // % ao mês
      quitadaEm: null, // meses a partir de agora
    }));

    const MAX = 600;
    let mes = 0;
    const pagamentoBase = totalMinimo + extra;
    let travado = false;

    while (sim.some((d) => d.saldo > 0.005) && mes < MAX) {
      mes++;
      // 1) juros
      sim.forEach((d) => {
        if (d.saldo > 0) d.saldo += d.saldo * (d.juros / 100);
      });
      // 2) pool disponível = mínimos das ativas + extra + mínimos já liberados
      const ativas = sim.filter((d) => d.saldo > 0.005);
      if (ativas.length === 0) break;
      const minAtivas = ativas.reduce((s, d) => s + d.minima, 0);
      let pool = pagamentoBase; // mínimos quitados já viram "extra" (rolagem)
      if (pool < minAtivas) { travado = true; break; } // não cobre nem os mínimos

      // 2a) paga os mínimos
      ativas.forEach((d) => {
        const pg = Math.min(d.minima, d.saldo);
        d.saldo -= pg;
        pool -= pg;
      });
      // 2b) joga o resto na menor ativa (ordem crescente de saldo)
      const restantes = sim
        .filter((d) => d.saldo > 0.005)
        .sort((a, b) => a.saldo - b.saldo);
      for (const d of restantes) {
        if (pool <= 0) break;
        const pg = Math.min(pool, d.saldo);
        d.saldo -= pg;
        pool -= pg;
      }
      // 3) marca quitadas neste mês
      sim.forEach((d) => {
        if (d.saldo <= 0.005 && d.quitadaEm == null) d.quitadaEm = mes;
      });
    }

    const quitouTudo = !travado && sim.every((d) => d.saldo <= 0.005);
    const mesesTotais = quitouTudo ? mes : null;

    return {
      dividas,          // ordenadas com .ordem
      totalDevido,
      totalMinimo,
      extra,
      alvo,             // dívida que recebe o extra
      mesesTotais,      // meses até dívida zero (ou null se não projetável)
      travado,          // true se o pagamento não cobre nem os mínimos
      dataQuitacaoTotal: mesesTotais != null ? dateInMonths(mesesTotais) : null,
      quitacaoPorDivida: sim.map((d) => ({
        id: d.id,
        nome: d.nome,
        quitadaEm: d.quitadaEm,
        data: d.quitadaEm != null ? dateInMonths(d.quitadaEm) : null,
      })),
    };
  }

  // ── Meta: quanto guardar por mês ────────────────────────────────────
  function planoMeta(meta) {
    const alvo = Number(meta.valorAlvo) || 0;
    const atual = Number(meta.valorAtual) || 0;
    const falta = Math.max(0, alvo - atual);
    const pct = alvo > 0 ? Math.min(100, (atual / alvo) * 100) : 0;
    let mesesRestantes = null, porMes = null;
    if (meta.dataAlvo) {
      const dias = daysUntil(meta.dataAlvo);
      mesesRestantes = dias != null ? Math.max(1, Math.round(dias / 30)) : null;
      if (mesesRestantes) porMes = falta / mesesRestantes;
    }
    return { alvo, atual, falta, pct, mesesRestantes, porMes, batida: falta <= 0 && alvo > 0 };
  }

  // ── Conjunto: quem deve quem no mês ─────────────────────────────────
  function acertoConjunto(mk) {
    const cfg = getConjConfig();
    // só entra no acerto o que já foi pago (dinheiro realmente adiantado)
    const tx = getConjTx().filter(
      (t) => monthKey(t.data) === mk && t.tipo !== "receita" && t.status !== "pendente"
    );
    const totalGasto = tx.reduce((s, t) => s + (Number(t.valor) || 0), 0);

    let pagoDaniel = 0, pagoBruna = 0;
    tx.forEach((t) => {
      const v = Number(t.valor) || 0;
      if (t.pagoPor === "daniel") pagoDaniel += v;
      else if (t.pagoPor === "bruna") pagoBruna += v;
    });

    const pctD =
      cfg.modoDivisao === "proporcional" ? cfg.percentualDaniel / 100 : 0.5;
    const pctB = 1 - pctD;
    const deviaDaniel = totalGasto * pctD;
    const deviaBruna = totalGasto * pctB;

    // saldo positivo = a pessoa pagou mais do que devia (deve receber)
    const saldoDaniel = pagoDaniel - deviaDaniel;
    const acerto = Math.abs(saldoDaniel); // valor a transferir
    let quemPaga = null, quemRecebe = null;
    if (saldoDaniel > 0.005) { quemPaga = "bruna"; quemRecebe = "daniel"; }
    else if (saldoDaniel < -0.005) { quemPaga = "daniel"; quemRecebe = "bruna"; }

    return {
      cfg, totalGasto, pagoDaniel, pagoBruna,
      deviaDaniel, deviaBruna, pctD, pctB,
      acerto, quemPaga, quemRecebe, itens: tx,
    };
  }

  // ── Saldo do casal (conta única — modelo Noh) ───────────────────────
  // Tudo é conjunto; o que importa é o que entrou vs. o que saiu.
  function saldoConjuntoGeral() {
    let entrou = 0, saiu = 0;
    getConjTx().forEach((t) => {
      if (t.status === "pendente") return;         // pendente não movimenta o saldo
      const v = Number(t.valor) || 0;
      if (t.tipo === "receita") entrou += v; else saiu += v;
    });
    return { entrou, saiu, saldo: entrou - saiu };
  }

  // ── Patrimônio conjunto ao longo do tempo ───────────────────────────
  // Combina: saldo acumulado das transações conjuntas + total já guardado
  // nas metas conjuntas, mês a mês.
  function seriePatrimonio() {
    const tx = getConjTx();
    const metas = getConjMetas();
    const guardadoMetas = metas.reduce(
      (s, m) =>
        s + (Number(m.contribuicaoDaniel) || 0) + (Number(m.contribuicaoBruna) || 0),
      0
    );
    // meses presentes nas transações
    const meses = Array.from(new Set(tx.map((t) => monthKey(t.data)))).sort();
    if (meses.length === 0) {
      const mk = currentMonth();
      return [{ mes: mk, patrimonio: guardadoMetas, fluxo: 0 }];
    }
    let acumulado = 0;
    const serie = meses.map((mk) => {
      const r = resumoMes(tx, mk);
      acumulado += r.saldo;
      return { mes: mk, fluxo: r.saldo, patrimonio: acumulado };
    });
    // soma o guardado nas metas ao ponto final (aporte à liberdade)
    if (serie.length) serie[serie.length - 1].patrimonio += guardadoMetas;
    return serie;
  }

  // ── Recorrentes com vencimento próximo ──────────────────────────────
  function recorrentesProximas(perfil) {
    const hoje = todayISO();
    const diaHoje = Number(hoje.slice(8, 10));
    return getTx(perfil)
      .filter((t) => t.recorrente && t.tipo === "despesa")
      .map((t) => {
        const dia = Number((t.data || hoje).slice(8, 10));
        const faltam = ((dia - diaHoje) + 31) % 31;
        return { ...t, diaVenc: dia, faltamDias: faltam };
      })
      .filter((t) => t.faltamDias <= 7)
      .sort((a, b) => a.faltamDias - b.faltamDias);
  }

  // ── Seed opcional (dados de exemplo) ────────────────────────────────
  function seedDemo() {
    // Em modo nuvem (Firebase configurado), não semeia exemplos: o casal
    // usa os dados reais e a primeira carga vem do Firebase.
    if (window.FinSync && window.FinSync.status !== "local") return;
    if (store.get("bc.financas.seeded", false)) return;
    const mk = currentMonth();
    const d = (dd) => `${mk}-${String(dd).padStart(2, "0")}`;

    saveTx("bruna", [
      { id: uid(), tipo: "receita", valor: 4200, categoria: "Salário", data: d(5), recorrente: true },
      { id: uid(), tipo: "despesa", valor: 850, categoria: "Moradia", data: d(10), recorrente: true },
      { id: uid(), tipo: "despesa", valor: 620, categoria: "Mercado", data: d(12), recorrente: false },
      { id: uid(), tipo: "despesa", valor: 130, categoria: "Assinaturas", data: d(15), recorrente: true },
      { id: uid(), tipo: "despesa", valor: 240, categoria: "Lazer", data: d(20), recorrente: false },
    ]);
    saveDividas([
      { id: uid(), nome: "Cartão Nubank", saldoDevedor: 1800, parcelaMinima: 180, juros: 12 },
      { id: uid(), nome: "Crediário loja", saldoDevedor: 640, parcelaMinima: 90, juros: 4 },
      { id: uid(), nome: "Empréstimo", saldoDevedor: 5200, parcelaMinima: 320, juros: 3 },
    ]);
    saveMetas("bruna", [
      { id: uid(), nome: "Viagem Chile", valorAlvo: 6000, valorAtual: 1200, dataAlvo: dateInMonths(10) },
    ]);

    saveTx("daniel", [
      { id: uid(), tipo: "receita", valor: 5000, categoria: "Salário", data: d(5), recorrente: true },
      { id: uid(), tipo: "despesa", valor: 300, categoria: "Transporte", data: d(8), recorrente: false },
      { id: uid(), tipo: "despesa", valor: 180, categoria: "Assinaturas", data: d(15), recorrente: true },
    ]);
    saveDebito({
      nome: "Renegociação cartão",
      valorParcela: 450,
      parcelasRestantes: 8,
      dataQuitacaoPrevista: dateInMonths(8),
    });
    saveMetas("daniel", [
      { id: uid(), nome: "Reserva de emergência", valorAlvo: 15000, valorAtual: 4000, dataAlvo: dateInMonths(18) },
    ]);

    saveConjTx([
      { id: uid(), tipo: "despesa", valor: 1600, categoria: "Moradia", data: d(10), pagoPor: "daniel" },
      { id: uid(), tipo: "despesa", valor: 900, categoria: "Mercado", data: d(14), pagoPor: "bruna" },
      { id: uid(), tipo: "despesa", valor: 320, categoria: "Outros", data: d(18), pagoPor: "daniel" },
    ]);
    saveConjMetas([
      { id: uid(), nome: "Viagem Europa", valorAlvo: 30000, contribuicaoDaniel: 3500, contribuicaoBruna: 2800, dataAlvo: dateInMonths(24) },
    ]);
    store.set("bc.financas.seeded", true);
  }

  // ── Export global ───────────────────────────────────────────────────
  window.FinData = {
    store, uid, fmt, fmtNum, fmtDate, todayISO, monthKey, currentMonth,
    monthLabel, prevMonthKey, daysUntil, dateInMonths, MONTH_NAMES, CATEGORIAS,
    CATEGORIA_META, CATEGORIAS_CASA, catMeta,
    getConjTags, saveConjTags, registrarTags,
    // pin
    hasPin, setPin, checkPin,
    // transações
    getTx, addTx, updateTx, removeTx,
    // orçamentos
    getBudgets, saveBudgets,
    // metas
    getMetas, saveMetas,
    // dívidas
    getDividas, saveDividas,
    // débito daniel
    getDebito, saveDebito,
    // conjunto
    getConjTx, saveConjTx, getConjMetas, saveConjMetas,
    getConjConfig, saveConjConfig, getPatrim, savePatrim,
    // regras
    resumoMes, snowball, planoMeta, acertoConjunto, seriePatrimonio,
    saldoConjuntoGeral, recorrentesProximas,
    // demo
    seedDemo,
  };
})();
