// ServiceDetail.jsx — per-service configuration page

const { useState: useStateDetail, useMemo: useMemoDetail } = React;

function ServiceDetail({ serviceId, onBack, onNext, cart, addItem, removeItem, qtyOf, total }) {
  const svc = CATALOG.services.find((s) => s.id === serviceId);
  if (!svc) return null;

  return (
    <>
      <div className="detail-back">
        <button className="btn btn--ghost btn--sm" onClick={onBack}>← voltar aos serviços</button>
        <span className="detail-back__crumb">
          serviços <span style={{ color: "var(--fg-3)" }}> / </span>
          <em style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>{svc.title.toLowerCase()} {svc.titleEm.toLowerCase()}</em>
        </span>
      </div>

      <header className="detail-head">
        <span className="detail-head__num">{svc.num}</span>
        <h1 className="detail-head__title">
          {svc.title}<br/><em>{svc.titleEm}</em>
        </h1>
        <p className="detail-head__lead">{svc.lead}</p>
      </header>

      <div className="detail-body">
        <section className="detail-body__about">
          <span className="section-eyebrow">o que está incluído</span>
          <ul className="detail-includes">
            {svc.includes.map((inc, i) => (
              <li key={i}><span className="dot" />{inc}</li>
            ))}
          </ul>
          <p className="detail-body-copy">{svc.body}</p>
        </section>

        <section className="detail-body__config">
          {svc.configKind === "tiers" && (
            <TiersConfig svc={svc} addItem={addItem} removeItem={removeItem} qtyOf={qtyOf} />
          )}
          {svc.configKind === "pieces-or-package" && (
            <CriativosConfig svc={svc} addItem={addItem} removeItem={removeItem} qtyOf={qtyOf} />
          )}
          {svc.configKind === "quantity" && (
            <QuantityConfig svc={svc} addItem={addItem} removeItem={removeItem} qtyOf={qtyOf} />
          )}
        </section>
      </div>

      <DetailFooter total={total} cart={cart} onNext={onNext} onBack={onBack} />
    </>
  );
}

// ============================================================
// CONFIG 1 — Tiers (Branding, Visual Shooting)
// ============================================================
function TiersConfig({ svc, addItem, removeItem, qtyOf }) {
  const selected = svc.tiers.find((t) => qtyOf(t.id) > 0);

  return (
    <div className="cfg">
      <span className="section-eyebrow">escolha o escopo</span>

      <div className="tiers">
        {svc.tiers.map((tier) => {
          const isSelected = qtyOf(tier.id) > 0;
          return (
            <button
              key={tier.id}
              type="button"
              className={`tier ${isSelected ? "tier--selected" : ""} ${tier.featured ? "tier--featured" : ""}`}
              onClick={() => {
                // single-select per service group: clear other tiers, set this
                svc.tiers.forEach((t) => {
                  if (t.id !== tier.id && qtyOf(t.id) > 0) removeItem(t.id, true);
                });
                if (!isSelected) {
                  addItem({ id: tier.id, kind: "tier", name: `${svc.title.trim()} ${svc.titleEm.trim()} — ${tier.name}`, price: tier.price });
                }
              }}
            >
              <div className="tier__head">
                <span className="tier__name">{tier.name}</span>
                {tier.featured && <span className="tier__badge">recomendado</span>}
              </div>
              <div className="tier__price">{formatBRL(tier.price)}</div>
              <p className="tier__desc">{tier.desc}</p>
              {(tier.deliverables || tier.highlights) ? (
                <ul className="tier__deliverables">
                  {(tier.deliverables || []).map((d, i) => (
                    <li key={i}><span className="tier__check">✓</span>{d}</li>
                  ))}
                  {(tier.highlights || []).map((h, i) => (
                    <li key={"h" + i} className="tier__deliverable--star"><span className="tier__star">★</span>{h}</li>
                  ))}
                </ul>
              ) : null}
              <div className="tier__select">{isSelected ? "✓ selecionado" : "selecionar"}</div>
            </button>
          );
        })}
      </div>

      <div className="cfg-summary">
        <span className="cfg-summary__label">total deste serviço</span>
        <span className="cfg-summary__value">{selected ? formatBRL(selected.price) : "—"}</span>
      </div>
    </div>
  );
}

// ============================================================
// CONFIG 2 — Pieces or Package (Criativos Estáticos)
// ============================================================
function CriativosConfig({ svc, addItem, removeItem, qtyOf }) {
  const [mode, setMode] = useStateDetail(() => {
    const anyPkg = svc.packages.find((p) => qtyOf(p.id) > 0);
    return anyPkg ? "package" : "pieces";
  });

  // Compute total for criativos items in cart
  const liveTotal = useMemoDetail(() => {
    let sum = 0;
    if (mode === "package") {
      svc.packages.forEach((p) => { sum += qtyOf(p.id) * p.total; });
    } else {
      svc.pieces.forEach((p) => { sum += qtyOf(p.id) * p.price; });
    }
    return sum;
  }, [mode, svc, qtyOf]);

  const switchMode = (newMode) => {
    if (newMode === mode) return;
    // clear opposite mode
    if (newMode === "package") {
      svc.pieces.forEach((p) => { if (qtyOf(p.id) > 0) removeItem(p.id, true); });
    } else {
      svc.packages.forEach((p) => { if (qtyOf(p.id) > 0) removeItem(p.id, true); });
    }
    setMode(newMode);
  };

  return (
    <div className="cfg">
      <div className="mode-toggle">
        <button
          type="button"
          className={mode === "pieces" ? "is-active" : ""}
          onClick={() => switchMode("pieces")}
        >peças avulsas</button>
        <button
          type="button"
          className={mode === "package" ? "is-active" : ""}
          onClick={() => switchMode("package")}
        >pacote fechado</button>
      </div>

      {mode === "pieces" && (
        <>
          <span className="section-eyebrow">quantas peças de cada?</span>
          <div className="pieces-list">
            {svc.pieces.map((p) => {
              const q = qtyOf(p.id);
              return (
                <div className="piece-row" key={p.id}>
                  <div className="piece-row__info">
                    <span className="name">{p.label}</span>
                    <span className="meta">{p.meta} · {formatBRL(p.price)}/un</span>
                  </div>
                  <div className="qty">
                    <button onClick={() => removeItem(p.id)} disabled={q === 0}>−</button>
                    <span>{q}</span>
                    <button onClick={() => addItem({ id: p.id, kind: "piece", name: `${svc.title.trim()} ${svc.titleEm.trim()} — ${p.label}`, price: p.price })}>+</button>
                  </div>
                  <div className="piece-row__sub">{formatBRL(q * p.price)}</div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {mode === "package" && (
        <>
          <span className="section-eyebrow">escolha um pacote</span>
          <div className="tiers">
            {svc.packages.map((p) => {
              const isSelected = qtyOf(p.id) > 0;
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`tier ${isSelected ? "tier--selected" : ""} ${p.featured ? "tier--featured" : ""}`}
                  onClick={() => {
                    svc.packages.forEach((pp) => {
                      if (pp.id !== p.id && qtyOf(pp.id) > 0) removeItem(pp.id, true);
                    });
                    if (!isSelected) {
                      addItem({ id: p.id, kind: "package", name: `${svc.title.trim()} ${svc.titleEm.trim()} — ${p.name} · ${p.qty} artes`, price: p.total });
                    }
                  }}
                >
                  <div className="tier__head">
                    <span className="tier__name">{p.name}</span>
                    {p.featured && <span className="tier__badge">mais escolhido</span>}
                  </div>
                  <div className="tier__price">{formatBRL(p.total)}</div>
                  <p className="tier__desc">{p.qty} artes · cada arte sai por {formatBRL(p.unit)}</p>
                  <div className="tier__select">{isSelected ? "✓ selecionado" : "selecionar"}</div>
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className="cfg-summary">
        <span className="cfg-summary__label">total deste serviço</span>
        <span className="cfg-summary__value">{liveTotal > 0 ? formatBRL(liveTotal) : "—"}</span>
      </div>
    </div>
  );
}

// ============================================================
// CONFIG 3 — Quantity (E-mail Marketing)
// ============================================================
function QuantityConfig({ svc, addItem, removeItem, qtyOf }) {
  const id = `${svc.id}-unit`;
  const q = qtyOf(id);

  const setQty = (newQty) => {
    const clamped = Math.max(0, Math.min(svc.maxQty || 99, newQty));
    if (clamped === 0) {
      if (q > 0) removeItem(id, true);
      return;
    }
    // remove existing then add with new qty
    if (q > 0) removeItem(id, true);
    for (let i = 0; i < clamped; i++) {
      addItem({ id, kind: "piece", name: `${svc.title.trim()} ${svc.titleEm.trim()}`, price: svc.pricePerUnit });
    }
  };

  const liveTotal = q * svc.pricePerUnit;

  return (
    <div className="cfg">
      <span className="section-eyebrow">quantos e-mails você precisa?</span>

      <div className="qty-slider">
        <div className="qty-slider__value">
          <span className="num">{q}</span>
          <span className="unit">{q === 1 ? svc.unitLabel : `${svc.unitLabel}s`}</span>
        </div>
        <input
          type="range"
          min={0}
          max={svc.maxQty || 10}
          step={1}
          value={q}
          onChange={(e) => setQty(Number(e.target.value))}
        />
        <div className="qty-slider__marks">
          <span>0</span>
          <span>{svc.maxQty || 10}+</span>
        </div>
      </div>

      <div className="qty-buttons">
        <button className="btn btn--ghost btn--sm" onClick={() => setQty(q - 1)} disabled={q === 0}>− 1</button>
        <button className="btn btn--ghost btn--sm" onClick={() => setQty(q + 1)}>+ 1</button>
        <button className="btn btn--ghost btn--sm" onClick={() => setQty(3)}>3 e-mails</button>
        <button className="btn btn--ghost btn--sm" onClick={() => setQty(5)}>5 e-mails</button>
      </div>

      <div className="qty-breakdown">
        <span>{q} × {formatBRL(svc.pricePerUnit)}/e-mail</span>
        <strong>{formatBRL(liveTotal)}</strong>
      </div>

      <div className="cfg-summary">
        <span className="cfg-summary__label">total deste serviço</span>
        <span className="cfg-summary__value">{liveTotal > 0 ? formatBRL(liveTotal) : "—"}</span>
      </div>
    </div>
  );
}

// ============================================================
// Detail page footer (mini cart total + nav)
// ============================================================
function DetailFooter({ total, cart, onNext, onBack }) {
  return (
    <div className="detail-footer">
      <div className="detail-footer__cart">
        <span className="label">pacote completo</span>
        <span className="value">{formatBRL(total)}</span>
        <span className="count">{cart.reduce((s, l) => s + l.qty, 0)} {cart.reduce((s, l) => s + l.qty, 0) === 1 ? "item" : "itens"}</span>
      </div>
      <div className="detail-footer__actions">
        <button className="btn btn--ghost" onClick={onBack}>← outros serviços</button>
        <button className="btn" onClick={onNext}>ver pacote →</button>
      </div>
    </div>
  );
}

Object.assign(window, { ServiceDetail });
