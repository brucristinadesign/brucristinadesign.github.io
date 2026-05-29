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

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [stepIdx, setStepIdx] = useState(0);
  const [openServiceId, setOpenServiceId] = useState(null); // sub-route within "services" step
  const [clientName, setClientName] = useState("");
  const [cart, setCart] = useState([]); // {id, kind, name, price, qty}

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
        // tiers/packages: only one of each; pieces: increment
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

  // ---- Navigation ----
  const goNext = () => {
    if (openServiceId) {
      // From a service detail, "next" advances to step 3 (configurador)
      setOpenServiceId(null);
      setStepIdx((i) => Math.max(i, 2));
      return;
    }
    setStepIdx((i) => Math.min(STEPS.length - 1, i + 1));
  };
  const goPrev = () => {
    if (openServiceId) {
      setOpenServiceId(null);
      return;
    }
    setStepIdx((i) => Math.max(0, i - 1));
  };
  const goToServices = () => {
    setOpenServiceId(null);
    setStepIdx(1);
  };
  const openService = (id) => {
    setOpenServiceId(id);
    setStepIdx(1); // ensure on services step
  };
  const closeService = () => setOpenServiceId(null);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [stepIdx, openServiceId]);

  const current = STEPS[stepIdx];
  const showingServiceDetail = openServiceId && current.id === "services";

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
          />
        ) : (
          <>
            {current.id === "welcome" && (
              <StepWelcome clientName={clientName} setClientName={setClientName} onNext={goNext} />
            )}
            {current.id === "services" && <StepServices openService={openService} cart={cart} />}
            {current.id === "config" && (
              <StepConfig
                cart={cart}
                removeItem={removeItem}
                total={total}
                clearAll={clearAll}
                goToServices={goToServices}
              />
            )}
            {current.id === "conditions" && <StepConditions />}
            {current.id === "accept" && (
              <StepAccept cart={cart} total={total} clientName={clientName} />
            )}
          </>
        )}

        {/* Decorative star on non-welcome steps */}
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

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {cart.length > 0 && stepIdx < STEPS.length - 1 && (
              <span style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontSize: 15,
                color: "var(--fg-2)",
              }}>
                {formatBRL(total)}
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
