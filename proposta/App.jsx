// App.jsx — wizard router + cart state + tweaks

const { useState, useMemo, useEffect, useCallback } = React;

const STEPS = [
  { id: "welcome", label: "welcome" },
  { id: "services", label: "serviços" },
  { id: "config", label: "configurador" },
  { id: "conditions", label: "condições" },
  { id: "accept", label: "fechar" },
];

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "primary": "#FCD067",
  "density": "default",
  "showStars": true
}/*EDITMODE-END*/;

const PRIMARY_OPTIONS = [
  "#FCD067", // yellow
  "#EE592F", // orange
  "#4CEAA8", // green
  "#AFD6D5", // mint
];

// Progressive discount tiers based on number of distinct services
const PROGRESSIVE_TIERS = [
  { min: 3, extra: 10, label: "3+ serviços" },
  { min: 2, extra: 5,  label: "2 serviços"  },
];

function getProgressiveDiscount(distinctCount) {
  for (const tier of PROGRESSIVE_TIERS) {
    if (distinctCount >= tier.min) return tier.extra;
  }
  return 0;
}

function applyDiscount(price, pct) {
  return Math.round(price * (1 - pct / 100));
}

// ---------- Link Generator Component ----------
function LinkGenerator() {
  const [pct, setPct] = useState(20);
  const [copied, setCopied] = useState(false);

  const url = useMemo(() => {
    const base = window.location.origin + window.location.pathname;
    return pct > 0 ? `${base}?d=${pct}` : base;
  }, [pct]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); } catch (_) {
      const ta = Object.assign(document.createElement("textarea"), { value: url });
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch (_) {}
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <label style={{ fontSize: 11, fontFamily: "var(--font-ui)", color: "var(--fg-2)", whiteSpace: "nowrap" }}>
          desconto base
        </label>
        <input
          type="range" min={0} max={50} step={5} value={pct}
          onChange={(e) => setPct(Number(e.target.value))}
          style={{ flex: 1, accentColor: "var(--primary)" }}
        />
        <span style={{ fontSize: 13, fontFamily: "var(--font-display)", fontStyle: "italic", minWidth: 32, textAlign: "right" }}>
          {pct}%
        </span>
      </div>

      {pct > 0 && (
        <div style={{ fontSize: 10, fontFamily: "var(--font-ui)", color: "var(--fg-3)", lineHeight: 1.5 }}>
          progressivo: +5% c/ 2 serviços · +10% c/ 3+
        </div>
      )}

      <div style={{
        fontSize: 10, fontFamily: "var(--font-ui)", color: "var(--fg-3)",
        background: "var(--surface-2)", borderRadius: 6, padding: "6px 8px",
        wordBreak: "break-all", lineHeight: 1.5,
      }}>
        {url}
      </div>

      <button
        className="btn btn--sm"
        onClick={copy}
        style={{ alignSelf: "stretch" }}
      >
        {copied ? "copiado ✓" : "copiar link →"}
      </button>
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [stepIdx, setStepIdx] = useState(0);
  const [openServiceId, setOpenServiceId] = useState(null);
  const [clientName, setClientName] = useState("");
  const [cart, setCart] = useState([]); // {id, kind, name, price, qty}
  const [validationError, setValidationError] = useState("");

  // Read base discount from URL param ?d=N
  const baseDiscount = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const d = parseInt(params.get("d") || "0", 10);
    return Math.max(0, Math.min(80, isNaN(d) ? 0 : d));
  }, []);

  // Number of distinct non-addon services in cart
  const distinctServiceCount = useMemo(() => {
    const ids = new Set(
      cart
        .filter((l) => l.kind !== "addon")
        .map((l) => l.id.split("-")[0])
    );
    return ids.size;
  }, [cart]);

  const progressiveDiscount = useMemo(
    () => (baseDiscount > 0 ? getProgressiveDiscount(distinctServiceCount) : 0),
    [baseDiscount, distinctServiceCount]
  );

  const effectiveDiscount = Math.min(baseDiscount + progressiveDiscount, 80);

  // Apply primary color tweak
  useEffect(() => {
    document.documentElement.style.setProperty("--primary", t.primary);
    document.documentElement.style.setProperty("--primary-press", shade(t.primary, -10));
  }, [t.primary]);

  const shellClass = `app-shell density-${t.density || "default"} ${t.showStars === false ? "hide-stars" : ""}`;

  // ---- Cart ops ----
  const addItem = useCallback((item) => {
    setCart((prev) => {
      const existing = prev.find((x) => x.id === item.id);
      if (existing) {
        if (item.kind === "package" || item.kind === "tier") return prev;
        return prev.map((x) => x.id === item.id ? { ...x, qty: x.qty + 1 } : x);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  }, []);

  const removeItem = useCallback((id, removeAll = false) => {
    setCart((prev) => {
      const existing = prev.find((x) => x.id === id);
      if (!existing) return prev;
      if (removeAll || existing.qty <= 1 || existing.kind === "package" || existing.kind === "tier") {
        return prev.filter((x) => x.id !== id);
      }
      return prev.map((x) => x.id === id ? { ...x, qty: x.qty - 1 } : x);
    });
  }, []);

  const qtyOf = useCallback((id) => {
    const found = cart.find((x) => x.id === id);
    return found ? found.qty : 0;
  }, [cart]);

  const clearAll = useCallback(() => setCart([]), []);
  const total = useMemo(() => cart.reduce((sum, x) => sum + x.price * x.qty, 0), [cart]);
  const discountedTotal = useMemo(() => applyDiscount(total, effectiveDiscount), [total, effectiveDiscount]);

  // ---- Navigation ----
  const goNext = () => {
    if (openServiceId) {
      setOpenServiceId(null);
      setStepIdx((i) => Math.max(i, 2));
      return;
    }
    const current = STEPS[stepIdx];
    if (current.id === "welcome") {
      if (!clientName.trim()) {
        setValidationError("coloca seu nome antes de continuar ;)");
        return;
      }
    }
    if (current.id === "services") {
      if (cart.length === 0) {
        setValidationError("escolhe pelo menos um serviço antes de continuar.");
        return;
      }
    }
    setValidationError("");
    setStepIdx((i) => Math.min(STEPS.length - 1, i + 1));
  };

  const goPrev = () => {
    setValidationError("");
    if (openServiceId) {
      setOpenServiceId(null);
      return;
    }
    setStepIdx((i) => Math.max(0, i - 1));
  };

  const goToServices = () => { setOpenServiceId(null); setStepIdx(1); };
  const openService = (id) => { setOpenServiceId(id); setStepIdx(1); };
  const closeService = () => setOpenServiceId(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [stepIdx, openServiceId]);

  const current = STEPS[stepIdx];
  const showingServiceDetail = openServiceId && current.id === "services";

  // Which progressive tier comes next (for hint)
  const nextTier = PROGRESSIVE_TIERS.slice().reverse().find((t) => distinctServiceCount < t.min);

  return (
    <div className={shellClass}>
      <header className="app-chrome">
        <span className="app-chrome__year">2026 · proposta comercial</span>
        <span className="app-chrome__pill">bruna cristina</span>
        <span className="app-chrome__section">
          {showingServiceDetail
            ? CATALOG.services.find((s) => s.id === openServiceId)?.title.toLowerCase().trim() + " " + CATALOG.services.find((s) => s.id === openServiceId)?.titleEm.toLowerCase().trim()
            : current.label}
        </span>
      </header>

      {/* Discount banner */}
      {baseDiscount > 0 && (
        <div className="discount-banner">
          <Star kind="6point" size={12} style={{ position: "static", display: "inline-block", verticalAlign: "middle" }} />
          <span>proposta especial · <strong>{effectiveDiscount}% OFF</strong></span>
          {progressiveDiscount > 0 && (
            <span className="discount-banner__prog">+{progressiveDiscount}% progressivo incluído</span>
          )}
          {nextTier && (
            <span className="discount-banner__hint">
              adicione mais {nextTier.min - distinctServiceCount} serviço{nextTier.min - distinctServiceCount > 1 ? "s" : ""} → +{nextTier.extra}% extra
            </span>
          )}
        </div>
      )}

      <main
        className="step"
        key={`${current.id}-${openServiceId || "main"}`}
        data-screen-label={`${String(stepIdx + 1).padStart(2, "0")} ${showingServiceDetail ? `serviço · ${openServiceId}` : current.label}`}
      >
        {showingServiceDetail ? (
          <ServiceDetail
            serviceId={openServiceId}
            onBack={closeService}
            onNext={goNext}
            cart={cart}
            addItem={addItem}
            removeItem={removeItem}
            qtyOf={qtyOf}
            total={total}
            discount={effectiveDiscount}
          />
        ) : (
          <>
            {current.id === "welcome" && (
              <StepWelcome
                clientName={clientName}
                setClientName={(v) => { setClientName(v); if (v.trim()) setValidationError(""); }}
                onNext={goNext}
                discount={baseDiscount}
              />
            )}
            {current.id === "services" && (
              <StepServices openService={openService} cart={cart} discount={effectiveDiscount} />
            )}
            {current.id === "config" && (
              <StepConfig
                cart={cart}
                removeItem={removeItem}
                total={total}
                discountedTotal={discountedTotal}
                discount={effectiveDiscount}
                baseDiscount={baseDiscount}
                progressiveDiscount={progressiveDiscount}
                distinctServiceCount={distinctServiceCount}
                clearAll={clearAll}
                goToServices={goToServices}
              />
            )}
            {current.id === "conditions" && <StepConditions />}
            {current.id === "accept" && (
              <StepAccept
                cart={cart}
                total={total}
                discountedTotal={discountedTotal}
                discount={effectiveDiscount}
                clientName={clientName}
              />
            )}
          </>
        )}

        {current.id !== "welcome" && !showingServiceDetail && (
          <FloatStar kind="8point" size={56} top={20} right={20} rotate={12} />
        )}
      </main>

      <footer className="app-footer">
        <div className="app-footer__row">
          <button
            className="btn btn--ghost btn--sm"
            onClick={goPrev}
            disabled={stepIdx === 0 && !openServiceId}
          >← voltar</button>

          <div className="app-footer__progress">
            {STEPS.map((s, i) => (
              <span
                key={s.id}
                className={`dot ${i === stepIdx ? "is-active" : i < stepIdx ? "is-done" : ""}`}
                onClick={() => { setOpenServiceId(null); setStepIdx(i); }}
                style={{ cursor: "pointer" }}
                title={s.label}
              />
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {validationError && (
              <span style={{
                fontFamily: "var(--font-ui)",
                fontSize: 12,
                color: "var(--bc-orange)",
                maxWidth: 220,
                textAlign: "right",
                lineHeight: 1.3,
              }}>
                {validationError}
              </span>
            )}
            {cart.length > 0 && stepIdx < STEPS.length - 1 && (
              <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 15, color: "var(--fg-2)" }}>
                {effectiveDiscount > 0
                  ? <><s style={{ color: "var(--fg-3)", fontSize: 12 }}>{formatBRL(total)}</s> {formatBRL(discountedTotal)}</>
                  : formatBRL(total)
                }
              </span>
            )}
            <span className="app-footer__step">
              {String(stepIdx + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
            </span>
            {stepIdx < STEPS.length - 1 && !showingServiceDetail && (
              <button className="btn btn--sm" onClick={goNext}>
                próximo →
              </button>
            )}
          </div>
        </div>
      </footer>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Aparência">
          <TweakColor
            label="Cor primária"
            value={t.primary}
            options={PRIMARY_OPTIONS}
            onChange={(v) => setTweak("primary", v)}
          />
          <TweakRadio
            label="Densidade"
            value={t.density}
            options={[
              { value: "compact", label: "Compacto" },
              { value: "default", label: "Padrão" },
              { value: "cozy", label: "Espaçoso" },
            ]}
            onChange={(v) => setTweak("density", v)}
          />
          <TweakToggle
            label="Estrelas decorativas"
            value={t.showStars !== false}
            onChange={(v) => setTweak("showStars", v)}
          />
        </TweakSection>

        <TweakSection label="Gerar Link com Desconto">
          <LinkGenerator />
        </TweakSection>

        <TweakSection label="Atalhos">
          <TweakButton label="Welcome" onClick={() => { setOpenServiceId(null); setStepIdx(0); }} />
          <TweakButton label="Serviços" onClick={() => { setOpenServiceId(null); setStepIdx(1); }} />
          <TweakButton label="Configurador" onClick={() => { setOpenServiceId(null); setStepIdx(2); }} />
          <TweakButton label="Fechar" onClick={() => { setOpenServiceId(null); setStepIdx(4); }} />
          <TweakButton label="Limpar carrinho" onClick={clearAll} secondary />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

// Simple hex darken
function shade(hex, percent) {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + (percent / 100) * 255));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + (percent / 100) * 255));
  const b = Math.max(0, Math.min(255, (num & 0xff) + (percent / 100) * 255));
  return "#" + ((1 << 24) | (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b)).toString(16).slice(1);
}

ReactDOM.createRoot(document.getElementById("app")).render(<App />);
