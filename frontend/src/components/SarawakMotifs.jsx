/**
 * Sarawak-inspired decorative SVG motifs — Burung Kenyalang (Rhinoceros Hornbill)
 * and Pua Kumbu (traditional Iban textile geometric patterns).
 * All pieces are pure inline SVG so they scale, tint and animate cheaply.
 */

// The state emblem of Sarawak — stylised silhouette.
export function Kenyalang({ className = "", color = "#111", casqueColor = "#F59E0B", accent = "#B91C1C" }) {
  return (
    <svg viewBox="0 0 200 120" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      {/* Body */}
      <path
        d="M20 78 C 40 60, 70 55, 100 60 C 130 65, 155 70, 175 68 L 180 78 C 175 84, 160 92, 140 95 C 115 100, 80 100, 55 92 C 40 88, 25 84, 20 78 Z"
        fill={color}
      />
      {/* Tail feathers */}
      <path d="M170 68 L 195 55 L 190 70 L 200 68 L 190 78 L 200 82 L 185 84 Z" fill={color} />
      <path d="M170 68 L 195 55 L 190 70 L 200 68 L 190 78 L 200 82 L 185 84 Z" fill="none" stroke={accent} strokeWidth="1" opacity="0.5" />
      {/* Head + neck */}
      <path d="M30 78 C 24 60, 30 40, 55 34 C 78 30, 92 38, 96 52 C 98 60, 90 66, 80 66 C 68 66, 60 62, 55 58 C 50 68, 40 74, 30 78 Z" fill={color} />
      {/* Casque */}
      <path d="M50 40 C 48 24, 62 14, 82 16 C 92 18, 96 26, 90 36 C 86 42, 78 42, 72 40 C 66 44, 58 44, 50 40 Z" fill={casqueColor} stroke={accent} strokeWidth="1.5" />
      {/* Beak */}
      <path d="M96 52 L 138 44 L 140 52 L 96 60 Z" fill={casqueColor} stroke={accent} strokeWidth="1.5" />
      <path d="M96 52 L 138 44" stroke={accent} strokeWidth="1" opacity="0.6" />
      {/* Eye */}
      <circle cx="65" cy="42" r="2.5" fill="#fff" />
      <circle cx="65" cy="42" r="1.2" fill="#111" />
      {/* Wing detail */}
      <path d="M60 78 Q 90 62, 130 74" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.55" />
      <path d="M70 84 Q 100 72, 140 82" fill="none" stroke={accent} strokeWidth="1" opacity="0.35" />
    </svg>
  );
}

// A horizontal ribbon of Pua Kumbu-inspired diamonds & zig-zags.
export function PuaKumbuStrip({ className = "", height = 22, colors = ["#B91C1C", "#F59E0B", "#0D9488", "#111"] }) {
  const [c1, c2, c3, c4] = colors;
  return (
    <svg viewBox="0 0 400 30" preserveAspectRatio="none" className={className} style={{ height, width: "100%" }} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <pattern id="pua-strip" x="0" y="0" width="60" height="30" patternUnits="userSpaceOnUse">
          {/* Base band */}
          <rect x="0" y="0" width="60" height="30" fill={c4} />
          {/* Top zig-zag */}
          <path d="M0 4 L 15 12 L 30 4 L 45 12 L 60 4" fill="none" stroke={c2} strokeWidth="2" />
          {/* Big diamond */}
          <path d="M30 8 L 46 15 L 30 22 L 14 15 Z" fill={c1} stroke={c2} strokeWidth="1.2" />
          {/* Inner diamond */}
          <path d="M30 12 L 40 15 L 30 18 L 20 15 Z" fill={c2} />
          <circle cx="30" cy="15" r="1.6" fill={c4} />
          {/* Side hooks */}
          <path d="M2 15 L 8 12 L 8 18 Z" fill={c3} />
          <path d="M58 15 L 52 12 L 52 18 Z" fill={c3} />
          {/* Bottom zig-zag */}
          <path d="M0 26 L 15 18 L 30 26 L 45 18 L 60 26" fill="none" stroke={c2} strokeWidth="2" />
        </pattern>
      </defs>
      <rect width="400" height="30" fill="url(#pua-strip)" />
    </svg>
  );
}

// A single Pua Kumbu diamond tile — good as a corner ornament.
export function PuaKumbuDiamond({ className = "", size = 80, colors = ["#B91C1C", "#F59E0B", "#0D9488", "#7F1D1D"] }) {
  const [c1, c2, c3, c4] = colors;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M50 4 L 96 50 L 50 96 L 4 50 Z" fill={c4} />
      <path d="M50 12 L 88 50 L 50 88 L 12 50 Z" fill={c1} stroke={c2} strokeWidth="1.5" />
      <path d="M50 24 L 76 50 L 50 76 L 24 50 Z" fill={c2} />
      <path d="M50 34 L 66 50 L 50 66 L 34 50 Z" fill={c3} />
      <circle cx="50" cy="50" r="4" fill={c4} />
      {/* Hooks */}
      <path d="M50 4 L 46 14 L 54 14 Z" fill={c2} />
      <path d="M50 96 L 46 86 L 54 86 Z" fill={c2} />
      <path d="M4 50 L 14 46 L 14 54 Z" fill={c2} />
      <path d="M96 50 L 86 46 L 86 54 Z" fill={c2} />
    </svg>
  );
}

// A flock of kenyalang silhouettes flying — for background atmosphere.
export function FlyingKenyalang({ className = "" }) {
  return (
    <svg viewBox="0 0 300 60" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      {[0, 60, 130, 210].map((x, i) => (
        <g key={i} transform={`translate(${x} ${i % 2 === 0 ? 0 : 12}) scale(${0.6 + (i % 2) * 0.2})`}>
          <path d="M0 15 Q 10 6, 22 14 Q 30 6, 40 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}
