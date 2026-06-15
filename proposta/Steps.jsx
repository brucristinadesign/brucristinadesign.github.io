// Steps.jsx — main wizard pages (welcome, services grid, configurador, conditions, accept)

const { useState } = React;

// ----------------------------------------------------------
// 01 — WELCOME (unchanged)
// ----------------------------------------------------------
function StepWelcome({ clientName, setClientName, onNext }) {
  return (
    <>
      <Eyebrow index={1} total={5}>welcome</Eyebrow>

      <div className="welcome">
        <div>
          <div className="welcome__hello">oie ;)</div>
          <h1 className="welcome__title">
            vamos montar<br/>
            sua <em>proposta</em><br/>
            <span className="mark">comercial?</span>
          </h1>
          <p className="welcome__intro">
            essa é uma proposta interativa — você navega pelos serviços, monta
            o pacote do jeitinho que faz sentido pra você, e fechamos pelo
            WhatsApp. sem pressa, sem amarras.
          </p>

          <div className="welcome__name-input">
            <label htmlFor="name">olá,</label>
            <input
              id="name"
              type="text"
              placeholder="qual o seu nome?"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div style={{ marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="btn btn--lg" onClick={onNext}>
              começar →
            </button>
          </div>
        </div>

        <div className="welcome__visual">
          <img className="portrait" src="assets/portrait-bruna.jpg" alt="Bruna Cristina" />
          <span className="floating-capsule fc-1">bruna cristina</span>
        </div>
      </div>
    </>
  );
}

// ----------------------------------------------------------
// 02 — SERVICES (proposal cards grid)
// ----------------------------------------------------------
function StepServices({ openService, cart }) {
  const inCartIds = new Set(cart.map((l) => l.id));

  return (
    <>
      <Eyebrow index={2} total={5}>my service offerings</Eyebrow>
      <h1 className="step__title">o que eu <em>faço</em></h1>
      <p className="step__sub">
        quatro frentes de trabalho. clique em qualquer uma pra ver o escopo
        completo, configurar o que você precisa e ver o orçamento.
      </p>

      <div className="proposal-grid">
        {CATALOG.services.map((s) => {
          // anything in cart whose id starts with this service id, or matches a piece/tier id
          const serviceItemIds = new Set([
            s.id,
            ...(s.tiers || []).map((t) => t.id),
            ...(s.pieces || []).map((p) => p.id),
            ...(s.packages || []).map((p) => p.id),
            ...(s.configKind === "quantity" ? [`${s.id}-unit`] : []),
          ]);
          const hasInCart = [...inCartIds].some((id) => serviceItemIds.has(id));

          return (
            <article key={s.id} className={`proposal ${hasInCart ? "proposal--added" : ""}`}>
              <header className="proposal__head">
                <span className="proposal__num">{s.num}</span>
                {hasInCart && <span className="proposal__badge">✓ no seu pacote</span>}
              </header>

              <h3 className="proposal__title">
                {s.title}<br/><em>{s.titleEm}</em>
              </h3>

              <p className="proposal__lead">{s.lead}</p>

              <ul className="proposal__includes">
                {s.includes.map((inc, i) => (
                  <li key={i}>
                    <span className="dot" />
                    {inc}
                  </li>
                ))}
              </ul>

              <footer className="proposal__foot">
                <div className="proposal__price">
                  <span className="from">a partir de</span>
                  <span className="amount">{formatBRL(s.startsAt)}</span>
                </div>
                <button
                  className="btn"
                  onClick={() => openService(s.id)}
                >
                  configurar →
                </button>
              </footer>
            </article>
          );
        })}
      </div>
    </>
  );
}

// ----------------------------------------------------------
// 03 — CONFIGURADOR (cart review)
// ----------------------------------------------------------
function StepConfig({ cart, removeItem, total, clearAll, goToServices }) {
  return (
    <>
      <Eyebrow index={3} total={5}>seu pacote</Eyebrow>
      <h1 className="step__title">revisão do <em>pacote</em></h1>
      <p className="step__sub">
        confira o que você montou. dá pra voltar nos serviços pra adicionar mais
        ou remover qualquer item daqui. o total atualiza em tempo real.
      </p>

      <div className="review">
        <div className="review__lines-wrap">
          {cart.length === 0 ? (
            <div className="review__empty">
              <p>seu pacote ainda está vazio.</p>
              <button className="btn" onClick={goToServices}>← escolher serviços</button>
            </div>
          ) : (
            <>
              <div className="review__lines">
                {cart.map((line, idx) => {
                  const scope = window.CATALOG.scopeById(line.id);
                  const includes = scope ? [
                    ...(scope.deliverables || []),
                    ...(scope.highlights || []),
                  ] : [];
                  return (
                    <div className="review__line" key={idx + "-" + line.id}>
                      <div className="review__line-name">
                        <span className="name">{line.name}</span>
                        {line.qty > 1 && <span className="qty">× {line.qty}</span>}
                        {includes.length > 0 && (
                          <ul className="review__line-includes">
                            {includes.map((inc, i) => (
                              <li key={i}><span className="tick">✓</span>{inc}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="review__line-price">{formatBRL(line.price * line.qty)}</div>
                      <button className="review__line-remove" onClick={() => removeItem(line.id, true)} aria-label="remover">×</button>
                    </div>
                  );
                })}
              </div>

              <div className="review__actions">
                <button className="btn btn--ghost btn--sm" onClick={goToServices}>← adicionar mais serviços</button>
                <button className="btn btn--ghost btn--sm" onClick={clearAll}>limpar pacote</button>
              </div>
            </>
          )}
        </div>

        <aside className="review__summary">
          <h3>resumo</h3>
          <div className="review__sum-row">
            <span>itens</span>
            <span>{cart.reduce((s, l) => s + l.qty, 0)}</span>
          </div>
          <div className="review__sum-row total">
            <span>total</span>
            <span>{formatBRL(total)}</span>
          </div>
          {total > 0 && (
            <div className="review__split">
              <strong>condições:</strong><br/>
              100% adiantado <em>ou</em> 50% antes ({formatBRL(total / 2)}) +
              50% na entrega ({formatBRL(total / 2)})
              <br/><strong>pagamento:</strong> pix, transferência <em>ou</em> cartão de crédito (parcelado)
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

// ----------------------------------------------------------
// 04 — CONDIÇÕES / FAQ
// ----------------------------------------------------------
function StepConditions() {
  const items = [
    {
      label: "01 · contratos",
      title: "personalizados &",
      titleEm: "flexíveis",
      body: "os contratos são personalizados conforme a necessidade. a assinatura do contrato oficial acontece somente após o primeiro mês — que serve como período-teste pra gente se conhecer.",
    },
    {
      label: "02 · entregas",
      title: "google drive +",
      titleEm: "whatsapp",
      body: "as entregas são feitas pelo google drive, com aviso no whatsapp. após cada entrega você tem direito a 3 rodadas de ajustes, caso necessário.",
    },
    {
      label: "03 · pagamento",
      title: "pix, cartão ou",
      titleEm: "transferência",
      body: "100% adiantado, ou 50% antes da entrega + 50% no final. aceito pix, transferência ou cartão de crédito (parcelado). trabalho sempre com o valor adiantado pra alinhar compromisso de ambos os lados.",
    },
    {
      label: "04 · prazos",
      title: "combinados &",
      titleEm: "respeitados",
      body: "os prazos variam de acordo com a quantidade de artes contratadas — combinamos pelo whatsapp antes de começar. dica: envie com antecedência pra ter o melhor resultado.",
    },
  ];

  return (
    <>
      <Eyebrow index={4} total={5}>condições</Eyebrow>
      <h1 className="step__title">como a <em>gente</em> trabalha</h1>
      <p className="step__sub">
        transparência total. essas são as condições padrão — qualquer ajuste
        que faça sentido pro seu projeto, a gente conversa.
      </p>

      <div className="faq">
        {items.map((it) => (
          <div className="faq__card" key={it.label}>
            <span className="label">{it.label}</span>
            <h4>{it.title}<br/><em>{it.titleEm}</em></h4>
            <p>{it.body}</p>
          </div>
        ))}
      </div>
    </>
  );
}

// ----------------------------------------------------------
// 05 — ACEITAR / PRÓXIMOS PASSOS
// ----------------------------------------------------------
function StepAccept({ cart, total, clientName }) {
  const [copied, setCopied] = useState(false);

  // Build WhatsApp closing message (ready to send)
  const lines = [];
  lines.push(clientName ? `oi, bruna! aqui é ${clientName} :)` : "oi, bruna! :)");
  lines.push("");
  if (cart.length === 0) {
    lines.push("vi sua proposta e quero seguir com você — só preciso fechar o escopo. podemos conversar?");
  } else {
    lines.push("vi sua proposta e quero fechar o seguinte pacote:");
    lines.push("");
    cart.forEach((line) => {
      lines.push(`• ${line.name}${line.qty > 1 ? ` (×${line.qty})` : ""} — ${formatBRL(line.price * line.qty)}`);
    });
    lines.push("");
    lines.push(`*total: ${formatBRL(total)}*`);
    lines.push(`condições: 100% adiantado ou 50% (${formatBRL(total / 2)}) + 50% na entrega`);
    lines.push("pagamento: pix, transferência ou cartão de crédito (parcelado)");
    lines.push("");
    lines.push("pode me confirmar o prazo e os próximos passos? fico no aguardo ;)");
  }

  const messageText = lines.join("\n");
  const message = encodeURIComponent(messageText);
  const wa = `https://wa.me/${CATALOG.phone}?text=${message}`;

  const copyMsg = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = messageText;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (_) {}
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <>
      <Eyebrow index={5} total={5}>próximos passos</Eyebrow>
      <h1 className="step__title">vamos <em>começar?</em></h1>
      <p className="step__sub">
        {clientName ? `${clientName}, ` : ""}
        se faz sentido pra você, é só me chamar no whatsapp com um clique
        abaixo. já vai pré-preenchido com o seu pacote — só apertar enviar.
      </p>

      <div className="accept">
        <div className="accept__recap">
          <h3>seu <em>pacote</em></h3>
          {cart.length === 0 ? (
            <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", color: "var(--fg-3)", margin: 0 }}>
              você ainda não montou um pacote — sem problema, podemos conversar
              sobre o escopo direto no whatsapp.
            </p>
          ) : (
            <>
              <div className="review__lines">
                {cart.map((line, idx) => (
                  <div className="review__line" key={idx + "-" + line.id} style={{ gridTemplateColumns: "1fr auto" }}>
                    <div className="review__line-name">
                      <span className="name">{line.name}</span>
                      {line.qty > 1 && <span className="qty">× {line.qty}</span>}
                    </div>
                    <div className="review__line-price">{formatBRL(line.price * line.qty)}</div>
                  </div>
                ))}
              </div>
              <div className="review__sum-row total" style={{ borderTop: "1px solid var(--bc-ink)", paddingTop: 14, marginTop: 6 }}>
                <span>total</span>
                <span>{formatBRL(total)}</span>
              </div>
              <div className="review__split">
                pagamento: 100% adiantado <em>ou</em> 50% / 50%. pix, transferência ou cartão de crédito.
              </div>
            </>
          )}
        </div>

        <div className="accept__cta-card">
          <h3>fecha <em>comigo?</em></h3>
          <p>
            sua mensagem já está prontinha aqui embaixo. é só revisar e mandar:
            o botão abre o whatsapp com tudo pré-escrito, ou copie e cole quando
            quiser.
          </p>

          <div className="wa-preview">
            <span className="wa-preview__label">prévia da mensagem</span>
            <pre className="wa-preview__body">{messageText}</pre>
          </div>

          <div className="accept__cta-actions">
            <a className="btn btn--lg btn--dark" href={wa} target="_blank" rel="noopener">
              chamar no whatsapp →
            </a>
            <button type="button" className="btn btn--ghost" onClick={copyMsg}>
              {copied ? "copiado ✓" : "copiar mensagem"}
            </button>
          </div>

          <div className="accept__contacts">
            <span>ou se preferir:</span>
            <a href={`https://wa.me/${CATALOG.phone}`} target="_blank" rel="noopener">{CATALOG.phoneDisplay}</a>
            <a href={`mailto:${CATALOG.email}`}>{CATALOG.email}</a>
            <a href={`https://instagram.com/${CATALOG.instagram.replace("@","")}`} target="_blank" rel="noopener">{CATALOG.instagram}</a>
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 48, padding: "32px 0", borderTop: "1px solid var(--bc-ink)" }}>
        <Star kind="6point" size={28} style={{ position: "static", margin: "0 auto 12px" }} />
        <h2 style={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: "clamp(36px, 5vw, 64px)",
          letterSpacing: "-0.05em",
          margin: 0,
        }}>obrigada ;)</h2>
        <p style={{
          fontFamily: "var(--font-ui)",
          fontSize: 12,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--fg-3)",
          marginTop: 10,
        }}>bruna cristina · graphic designer · janeiro/2026</p>
      </div>
    </>
  );
}

Object.assign(window, {
  StepWelcome,
  StepServices,
  StepConfig,
  StepConditions,
  StepAccept,
});
