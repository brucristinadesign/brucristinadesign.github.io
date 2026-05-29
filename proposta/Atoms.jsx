// Atoms.jsx — reusable bits for the proposta site

const Star = ({ kind = "8point", size = 24, className = "", style }) => (
  <img
    src={`assets/star-${kind}.svg`}
    alt=""
    className={`star ${className}`}
    style={{ width: size, height: size, display: "block", ...style }}
  />
);

const Capsule = ({ children, color, rotate = 0, size = "md", style }) => (
  <span
    className={`capsule ${color ? "capsule--colored" : ""} ${size === "lg" ? "capsule--lg" : ""}`}
    style={{
      background: color || undefined,
      transform: rotate ? `rotate(${rotate}deg)` : undefined,
      ...style,
    }}
  >
    {children}
  </span>
);

const Eyebrow = ({ index, total, children }) => (
  <div className="step__eyebrow">
    <Star kind="6point" size={14} className="deco-star" style={{ position: "static" }} />
    <span>{children}</span>
    {index != null && (
      <span className="index">
        &nbsp;&nbsp;·&nbsp;&nbsp;{String(index).padStart(2, "0")}/{String(total).padStart(2, "0")}
      </span>
    )}
  </div>
);

const formatBRL = (n) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

const FloatStar = ({ kind = "8point", size = 60, top, left, right, bottom, rotate = 0 }) => (
  <img
    src={`assets/star-${kind}.svg`}
    alt=""
    className="deco-star"
    style={{
      width: size,
      height: size,
      top,
      left,
      right,
      bottom,
      transform: `rotate(${rotate}deg)`,
    }}
  />
);

Object.assign(window, { Star, Capsule, Eyebrow, FloatStar, formatBRL });
