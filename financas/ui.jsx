/* ══════════════════════════════════════════════════════════════════════
   ui.jsx — átomos visuais e gráficos (SVG puro, sem dependências)
   ══════════════════════════════════════════════════════════════════════ */
const { useState, useEffect, useMemo, useRef } = React;
const F = window.FinData;

// ── Ícones (inline, traço) ─────────────────────────────────────────────
const Icon = ({ name, size = 20, color = "currentColor", style }) => {
  const p = {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: color, strokeWidth: 1.8, strokeLinecap: "round",
    strokeLinejoin: "round", style,
  };
  const paths = {
    home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></>,
    list: <><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="3.5" cy="6" r="1.2" /><circle cx="3.5" cy="12" r="1.2" /><circle cx="3.5" cy="18" r="1.2" /></>,
    target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" fill={color} /></>,
    snow: <><path d="M12 2v20M4 6l16 12M20 6 4 18" /><path d="M12 5 9 8M12 5l3 3M12 19l-3-3M12 19l3-3" /></>,
    card: <><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 9.5h19" /></>,
    users: <><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M16 5.5a3.2 3.2 0 0 1 0 6.2M17 14.5a5.5 5.5 0 0 1 3.5 5.5" /></>,
    chart: <><path d="M4 20V4M4 20h16" /><path d="M8 16l3.5-4 3 2.5L21 8" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></>,
    edit: <><path d="M4 20h4L18.5 9.5a2 2 0 0 0-3-3L5 17v3z" /></>,
    lock: <><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" /></>,
    back: <><path d="M15 5l-7 7 7 7" /></>,
    check: <><path d="M20 6 9 17l-5-5" /></>,
    flag: <><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></>,
    plane: <><path d="M21 15.5 3 21l4-6-4-6 18 5.5-6 .5 6 .5z" /></>,
    bell: <><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
    close: <><path d="M6 6l12 12M18 6 6 18" /></>,
    gear: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.5 4.5l2 2M17.5 17.5l2 2M19.5 4.5l-2 2M6.5 17.5l-2 2" /></>,
    coin: <><ellipse cx="12" cy="7" rx="8" ry="3.5" /><path d="M4 7v6c0 1.9 3.6 3.5 8 3.5s8-1.6 8-3.5V7" /><path d="M4 13c0 1.9 3.6 3.5 8 3.5s8-1.6 8-3.5" /></>,
  };
  return <svg {...p}>{paths[name] || null}</svg>;
};

// ── Número grande serifado ─────────────────────────────────────────────
const Money = ({ value, size = 34, color = "var(--petroleo)", sign = false, className = "" }) => {
  const v = Number(value) || 0;
  const positive = v >= 0;
  const shown = F.fmtNum(Math.abs(v));
  return (
    <span className={`num ${className}`} style={{ color, fontSize: size, lineHeight: 1, fontWeight: 500, whiteSpace: "nowrap" }}>
      <span style={{ fontSize: size * 0.52, opacity: 0.75, marginRight: 3 }}>
        {sign ? (positive ? "+R$" : "−R$") : "R$"}
      </span>
      {shown}
    </span>
  );
};

const Card = ({ children, className = "", stripe, style, ...rest }) => (
  <div
    className={`card ${stripe ? "card--stripe" : ""} ${className}`}
    style={stripe ? { "--stripe": stripe, ...style } : style}
    {...rest}
  >
    {children}
  </div>
);

const Field = ({ label, children }) => (
  <label style={{ display: "block" }}>
    <span className="fin-label" style={{ display: "block", marginBottom: 5 }}>{label}</span>
    {children}
  </label>
);

// ── Modal genérico ─────────────────────────────────────────────────────
const Modal = ({ open, onClose, title, children, accent = "var(--petroleo)" }) => {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(20,35,32,.42)", backdropFilter: "blur(3px)", zIndex: 60, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fade-up"
        style={{ background: "#fff", width: "100%", maxWidth: 460, borderRadius: "22px 22px 0 0", padding: "22px 20px 28px", maxHeight: "92dvh", overflowY: "auto", boxShadow: "var(--sombra-forte)" }}
      >
        <div style={{ width: 42, height: 4, borderRadius: 4, background: "rgba(31,75,68,.2)", margin: "0 auto 16px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 className="serif" style={{ margin: 0, fontSize: 20, color: accent }}>{title}</h3>
          <button className="btn btn-ghost" style={{ padding: 8, borderRadius: 10 }} onClick={onClose}>
            <Icon name="close" size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════
   ELEMENTO DE ASSINATURA — barra "caminho com marcos"
   Não é uma barra genérica: é uma trilha que serpenteia, com marcos ao
   longo do percurso e um viajante que caminha até a liberdade financeira.
   ══════════════════════════════════════════════════════════════════════ */
const PathProgress = ({
  pct = 0,
  milestones = [],      // [{ pct, label, done }]
  color = "var(--petroleo)",
  goldAtEnd = true,
  height = 96,
  travelerIcon = "coin", // "coin" | "plane" | "flag"
}) => {
  const p = Math.max(0, Math.min(100, pct));
  const W = 1000, H = height;
  const padX = 34, midY = H * 0.56, amp = H * 0.20;

  // caminho senoidal suave da esquerda p/ direita
  const pointAt = (t) => {
    const x = padX + (W - padX * 2) * t;
    const y = midY - Math.sin(t * Math.PI * 2.0) * amp;
    return [x, y];
  };
  const buildPath = (fromT, toT) => {
    const steps = 40;
    let d = "";
    for (let i = 0; i <= steps; i++) {
      const t = fromT + (toT - fromT) * (i / steps);
      const [x, y] = pointAt(t);
      d += (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1) + " ";
    }
    return d.trim();
  };
  const full = buildPath(0, 1);
  const done = buildPath(0, p / 100);
  const [tx, ty] = pointAt(p / 100);

  const Traveler = () => {
    if (travelerIcon === "plane")
      return <path d="M9 4.5-4.5 8.5l3.2-4.6-3.2-4.6L9 -0.5l-4.5.4 4.5.5-4.5.4z" fill="#fff" transform="scale(.9)" />;
    if (travelerIcon === "flag")
      return <><path d="M-4 8V-6M-4 -6H6l-1.4 2.7L6 -0.6H-4z" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinejoin="round" /></>;
    // coin
    return <><circle r="7" fill="#fff" /><text y="4.5" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="11" fontWeight="600" fill={typeof color === "string" && color.startsWith("var") ? "#1F4B44" : color}>$</text></>;
  };

  return (
    <div className="path" aria-label={`progresso ${Math.round(p)}%`}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height }}>
        {/* trilha completa (a percorrer) */}
        <path d={full} fill="none" stroke="rgba(31,75,68,.16)" strokeWidth="9" strokeLinecap="round" strokeDasharray="1 16" />
        {/* trecho percorrido */}
        <path d={done} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" />

        {/* marcos ao longo do caminho */}
        {milestones.map((m, i) => {
          const [mx, my] = pointAt(Math.max(0, Math.min(100, m.pct)) / 100);
          const reached = m.done || p >= m.pct - 0.5;
          const flagColor = reached ? "var(--dourado)" : "rgba(31,75,68,.35)";
          return (
            <g key={i} transform={`translate(${mx}, ${my})`}>
              <circle r="6" fill={reached ? "var(--dourado)" : "#fff"} stroke={reached ? "var(--dourado-2)" : "rgba(31,75,68,.3)"} strokeWidth="2" />
              <g className={reached ? "milestone-flag" : ""} transform="translate(0,-8)">
                <line x1="0" y1="0" x2="0" y2="-16" stroke={flagColor} strokeWidth="2" />
                <path d="M0 -16 L13 -13 L0 -9 Z" fill={flagColor} />
              </g>
              {m.label && (
                <text y="20" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="12" fill="var(--tinta-suave)">{m.label}</text>
              )}
            </g>
          );
        })}

        {/* destino final (bandeira dourada) */}
        {goldAtEnd && (() => {
          const [ex, ey] = pointAt(1);
          const reached = p >= 99.5;
          return (
            <g transform={`translate(${ex}, ${ey})`}>
              <circle r="9" fill={reached ? "var(--dourado)" : "#fff"} stroke="var(--dourado-2)" strokeWidth="2.5" />
              <g className={reached ? "milestone-flag" : ""} transform="translate(0,-9)">
                <line x1="0" y1="0" x2="0" y2="-22" stroke="var(--dourado-2)" strokeWidth="2.5" />
                <path d="M0 -22 L18 -18 L0 -13 Z" fill="var(--dourado)" />
              </g>
            </g>
          );
        })()}

        {/* viajante na posição atual */}
        <g className="traveler" transform={`translate(${tx}, ${ty})`}>
          <circle r="12" fill={color} />
          <Traveler />
        </g>
      </svg>
    </div>
  );
};

// ── Barra de progresso simples (para uso compacto) ─────────────────────
const MiniBar = ({ pct, color = "var(--petroleo)", height = 8 }) => {
  const p = Math.max(0, Math.min(100, pct));
  return (
    <div style={{ background: "rgba(31,75,68,.12)", borderRadius: 999, height, overflow: "hidden" }}>
      <div style={{ width: `${p}%`, height: "100%", background: color, borderRadius: 999, transition: "width .5s ease" }} />
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════
   GRÁFICOS
   ══════════════════════════════════════════════════════════════════════ */
const CAT_COLORS = ["#1F4B44", "#2E655C", "#C9A15A", "#E86A5C", "#8BA888", "#6E8B84", "#B08840", "#A8586B", "#4C766D", "#D8B67A"];

// Donut por categoria
const Donut = ({ data, size = 168 }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = size / 2, ir = r * 0.62, cx = r, cy = r;
  if (total <= 0)
    return (
      <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--tinta-suave)", fontSize: 13 }}>
        sem despesas
      </div>
    );
  let acc = 0;
  const arc = (frac) => {
    const a = 2 * Math.PI * frac - Math.PI / 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a), cx + ir * Math.cos(a), cy + ir * Math.sin(a)];
  };
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((d, i) => {
        const frac = d.value / total;
        const [x1, y1, xi1, yi1] = arc(acc);
        acc += frac;
        const [x2, y2, xi2, yi2] = arc(acc);
        const large = frac > 0.5 ? 1 : 0;
        const path = `M${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2} L${xi2} ${yi2} A${ir} ${ir} 0 ${large} 0 ${xi1} ${yi1} Z`;
        return <path key={i} d={path} fill={d.color || CAT_COLORS[i % CAT_COLORS.length]} stroke="#fff" strokeWidth="1.5" />;
      })}
      <circle cx={cx} cy={cy} r={ir - 2} fill="#fff" />
      <text x={cx} y={cy - 4} textAnchor="middle" fontFamily="Inter" fontSize="11" fill="var(--tinta-suave)">total</text>
      <text x={cx} y={cy + 15} textAnchor="middle" fontFamily="Fraunces, serif" fontSize="17" fontWeight="600" fill="var(--petroleo)">
        {F.fmt(total)}
      </text>
    </svg>
  );
};

// Comparação de 2 meses (barras)
const CompareBars = ({ atual, anterior, labelAtual, labelAnterior }) => {
  const max = Math.max(atual.receitas, atual.despesas, anterior.receitas, anterior.despesas, 1);
  const Bar = ({ v, color, w = max }) => (
    <div style={{ flex: 1 }}>
      <div style={{ height: 90, display: "flex", alignItems: "flex-end" }}>
        <div style={{ width: "100%", height: `${(v / w) * 100}%`, minHeight: 4, background: color, borderRadius: "8px 8px 0 0", transition: "height .5s ease" }} />
      </div>
    </div>
  );
  const Group = ({ r, d, label, faded }) => (
    <div style={{ textAlign: "center", flex: 1, opacity: faded ? 0.75 : 1 }}>
      <div style={{ display: "flex", gap: 6, alignItems: "flex-end", padding: "0 6px" }}>
        <Bar v={r.receitas} color="var(--petroleo-2)" />
        <Bar v={r.despesas} color="var(--coral)" />
      </div>
      <div style={{ fontSize: 12, color: "var(--tinta-suave)", marginTop: 6 }}>{label}</div>
    </div>
  );
  return (
    <div>
      <div style={{ display: "flex", gap: 14 }}>
        <Group r={anterior} label={labelAnterior} faded />
        <div style={{ width: 1, background: "rgba(31,75,68,.1)" }} />
        <Group r={atual} label={labelAtual} />
      </div>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 12, fontSize: 12.5 }}>
        <Legend color="var(--petroleo-2)" text="receitas" />
        <Legend color="var(--coral)" text="despesas" />
      </div>
    </div>
  );
};
const Legend = ({ color, text }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--tinta-suave)" }}>
    <span style={{ width: 11, height: 11, borderRadius: 3, background: color }} /> {text}
  </span>
);

// Linha — patrimônio ao longo do tempo
const LineChart = ({ serie, height = 180 }) => {
  const pts = serie.length ? serie : [{ mes: F.currentMonth(), patrimonio: 0 }];
  const W = 640, H = height, padL = 8, padR = 8, padT = 16, padB = 26;
  const vals = pts.map((p) => p.patrimonio);
  const min = Math.min(0, ...vals), max = Math.max(1, ...vals);
  const x = (i) => padL + (pts.length === 1 ? (W - padL - padR) / 2 : (i / (pts.length - 1)) * (W - padL - padR));
  const y = (v) => padT + (1 - (v - min) / (max - min || 1)) * (H - padT - padB);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(p.patrimonio).toFixed(1)}`).join(" ");
  const area = `${line} L${x(pts.length - 1)} ${H - padB} L${x(0)} ${H - padB} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="patrimGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--dourado)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--dourado)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#patrimGrad)" />
      <path d={line} fill="none" stroke="var(--dourado-2)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.patrimonio)} r="4.5" fill="#fff" stroke="var(--dourado-2)" strokeWidth="2.5" />
          <text x={x(i)} y={H - 8} textAnchor="middle" fontFamily="Inter" fontSize="11" fill="var(--tinta-suave)">
            {F.monthLabel(p.mes)}
          </text>
        </g>
      ))}
    </svg>
  );
};

/* ══════════════════════════════════════════════════════════════════════
   PIN PAD
   ══════════════════════════════════════════════════════════════════════ */
const PinPad = ({ perfil, cor, mode = "verify", onSuccess, onCancel }) => {
  // mode: "verify" | "create" | "verify-or-create"
  const [phase, setPhase] = useState(() => {
    if (mode === "create") return "set";
    if (mode === "verify-or-create") return F.hasPin(perfil) ? "verify" : "set";
    return "verify";
  });
  const [pin, setPin] = useState("");
  const [firstPin, setFirstPin] = useState("");
  const [err, setErr] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const title = {
    verify: `PIN de ${cap(perfil)}`,
    set: F.hasPin(perfil) ? "Alterar PIN" : `Criar PIN de ${cap(perfil)}`,
    confirm: "Confirme o PIN",
  };

  const press = (d) => {
    setErr(false);
    if (pin.length >= 4) return;
    const np = pin + d;
    setPin(np);
    if (np.length === 4) setTimeout(() => submit(np), 160);
  };
  const back = () => { setErr(false); setPin((p) => p.slice(0, -1)); };

  const submit = (val) => {
    if (phase === "verify") {
      if (F.checkPin(perfil, val)) onSuccess();
      else { setErr(true); setPin(""); }
    } else if (phase === "set") {
      setFirstPin(val); setPin(""); setPhase("confirm");
    } else if (phase === "confirm") {
      if (val === firstPin) { F.setPin(perfil, val); onSuccess(); }
      else { setErr(true); setPin(""); setPhase("set"); setFirstPin(""); }
    }
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "←"];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,35,32,.5)", backdropFilter: "blur(4px)", zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="fade-up" style={{ background: "#fff", borderRadius: 24, padding: "30px 26px", width: "100%", maxWidth: 360, boxShadow: "var(--sombra-forte)", textAlign: "center" }}>
        <div style={{ width: 54, height: 54, borderRadius: "50%", background: cor, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <Icon name="lock" size={26} color="#fff" />
        </div>
        <h3 className="serif" style={{ margin: "0 0 4px", fontSize: 21 }}>{title[phase]}</h3>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--tinta-suave)" }}>
          {phase === "verify" ? "Digite seu PIN de 4 dígitos" : phase === "set" ? "Escolha um PIN de 4 dígitos" : "Digite o PIN de novo"}
        </p>
        <div className={`${err ? "shake" : ""}`} style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 8 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`pin-dot ${pin.length > i ? "filled" : ""}`} style={{ borderColor: cor, background: pin.length > i ? cor : "transparent" }} />
          ))}
        </div>
        <div style={{ height: 18, color: "var(--coral)", fontSize: 12.5, fontWeight: 600 }}>
          {err ? (phase === "verify" ? "PIN incorreto" : "Os PINs não bateram") : ""}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, justifyItems: "center", marginTop: 6 }}>
          {keys.map((k, i) =>
            k === "" ? <div key={i} /> :
            k === "←" ? (
              <button key={i} className="pin-key" onClick={back} aria-label="apagar"><Icon name="back" size={22} /></button>
            ) : (
              <button key={i} className="pin-key" onClick={() => press(k)}>{k}</button>
            )
          )}
        </div>
        <button className="btn btn-ghost" style={{ marginTop: 20, width: "100%" }} onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
};

function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

// pequena confete overlay
const Confetti = ({ show }) => {
  if (!show) return null;
  const colors = ["#C9A15A", "#1F4B44", "#E86A5C", "#2E655C", "#B08840"];
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 80, overflow: "hidden" }}>
      {Array.from({ length: 40 }).map((_, i) => (
        <span key={i} className="confetti-piece"
          style={{
            position: "absolute", left: `${Math.random() * 100}%`, top: `${Math.random() * 30}%`,
            width: 8, height: 12, background: colors[i % colors.length],
            borderRadius: 2, animationDelay: `${Math.random() * 0.4}s`,
          }} />
      ))}
    </div>
  );
};

window.FinUI = {
  Icon, Money, Card, Field, Modal, PathProgress, MiniBar,
  Donut, CompareBars, LineChart, PinPad, Confetti, Legend, CAT_COLORS, cap,
};
