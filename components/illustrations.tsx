/* Flat illustrations for Soil Time Machine (inline SVG, no external assets), SI-generated (Claude) and watermarked.
 * Palette follows the app tokens: forest, leaf, mint, water, sky, amber, earth. */

type P = { className?: string };

/** Step 1 — pin a field on the map. */
/**
 * Visible watermark: these illustrations were generated with an SI (AI) tool, and NASA Space Apps
 * requires SI-generated images to carry a visible watermark.
 */
function SiMark({ w = 240, h = 132 }: { w?: number; h?: number }) {
  return (
    <g>
      <rect x={w - 74} y={h - 17} width={70} height={13} rx={6.5} fill="#000000" opacity={0.45} />
      <text x={w - 39} y={h - 7.6} textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="7.5" fontWeight="700" fill="#ffffff">
        SI-generated
      </text>
    </g>
  );
}

export function IlloLocate({ className }: P) {
  return (
    <svg viewBox="0 0 240 132" className={className} aria-hidden>
      <defs>
        <linearGradient id="il-loc-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E3F2F9" />
          <stop offset="1" stopColor="#EAF6EC" />
        </linearGradient>
      </defs>
      <rect width="240" height="132" rx="16" fill="url(#il-loc-sky)" />
      <g transform="translate(22 36)">
        <path d="M18 0h70l-14 40H4z" fill="#9ED1A8" />
        <path d="M94 0h92l-14 40H80z" fill="#CBE7BC" />
        <path d="M2 46h70l-14 44H-12z" fill="#EAD9A6" />
        <path d="M78 46h90l-14 44H64z" fill="#7FC08F" />
        <g stroke="#ffffff" strokeOpacity=".55" strokeWidth="1.4">
          <path d="M30 6l-10 28M44 6l-10 28M58 6l-10 28" />
          <path d="M112 6l-10 28M128 6l-10 28M144 6l-10 28M160 6l-10 28" />
          <path d="M96 54l-12 30M112 54l-12 30M128 54l-12 30M144 54l-12 30" />
        </g>
      </g>
      <path
        d="M-4 118c46-12 84 6 132-4s78-18 116-8"
        stroke="#4A94C7"
        strokeWidth="9"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M-4 118c46-12 84 6 132-4s78-18 116-8"
        stroke="#BFE0F2"
        strokeWidth="2"
        fill="none"
        strokeDasharray="6 10"
      />
      <ellipse cx="150" cy="80" rx="12" ry="3.5" fill="#174D3A" opacity=".22" />
      <path
        d="M150 16c-11 0-20 9-20 20 0 15 20 42 20 42s20-27 20-42c0-11-9-20-20-20z"
        fill="#E4573D"
      />
      <circle cx="150" cy="36" r="7.5" fill="#fff" />
      <circle cx="204" cy="22" r="9" fill="#FFD27A" />
      <SiMark />
    </svg>
  );
}

/** Step 2 — a NASA satellite reads rain, soil and heat over the area. */
export function IlloSatellite({ className }: P) {
  return (
    <svg viewBox="0 0 240 132" className={className} aria-hidden>
      <defs>
        <linearGradient id="il-sat-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1F4F72" />
          <stop offset="1" stopColor="#2F6F9C" />
        </linearGradient>
        <linearGradient id="il-sat-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity=".45" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="240" height="132" rx="16" fill="url(#il-sat-bg)" />
      <g fill="#fff" opacity=".7">
        <circle cx="24" cy="18" r="1.2" />
        <circle cx="200" cy="14" r="1.4" />
        <circle cx="222" cy="40" r="1" />
        <circle cx="40" cy="48" r="1" />
        <circle cx="170" cy="30" r="1" />
      </g>
      <path d="M120 40L58 104h124z" fill="url(#il-sat-beam)" />
      <g transform="translate(96 16)">
        <rect
          x="-26"
          y="6"
          width="22"
          height="14"
          rx="2"
          fill="#7FB8E0"
          stroke="#D7ECF8"
        />
        <rect
          x="52"
          y="6"
          width="22"
          height="14"
          rx="2"
          fill="#7FB8E0"
          stroke="#D7ECF8"
        />
        <path d="M-4 13h8M44 13h8" stroke="#D7ECF8" strokeWidth="2" />
        <rect x="4" y="0" width="40" height="26" rx="5" fill="#F2F5F7" />
        <rect x="10" y="6" width="28" height="6" rx="2" fill="#E4A84C" />
        <circle cx="24" cy="32" r="5" fill="#F2F5F7" />
      </g>
      <g transform="translate(40 100)">
        <rect width="160" height="10" rx="5" fill="#4A94C7" />
        <rect y="12" width="160" height="10" rx="5" fill="#C49B6C" />
        <rect x="0" y="-10" width="160" height="10" rx="5" fill="#E4A84C" />
      </g>
      <g
        fill="#fff"
        fontFamily="system-ui, sans-serif"
        fontSize="7"
        fontWeight="700"
      >
        <text x="46" y="97">
          °C
        </text>
        <text x="46" y="108">
          mm
        </text>
        <text x="46" y="120">
          %
        </text>
      </g>
      <SiMark />
    </svg>
  );
}

/** Step 3 — the same field grows differently over the years. */
export function IlloGrow({ className }: P) {
  return (
    <svg viewBox="0 0 240 132" className={className} aria-hidden>
      <defs>
        <linearGradient id="il-grow-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFF4DD" />
          <stop offset="1" stopColor="#E7F4E6" />
        </linearGradient>
      </defs>
      <rect width="240" height="132" rx="16" fill="url(#il-grow-bg)" />
      <path d="M0 100c40-8 80-8 120-4s80 4 120-2v38H0z" fill="#8A5E33" />
      <path
        d="M0 100c40-8 80-8 120-4s80 4 120-2"
        stroke="#B8864F"
        strokeWidth="4"
        fill="none"
      />
      {[
        { x: 40, h: 16, y: "2026" },
        { x: 100, h: 30, y: "2028" },
        { x: 168, h: 48, y: "2030" },
      ].map((p, i) => (
        <g key={p.y}>
          <path
            d={`M${p.x} 98v-${p.h}`}
            stroke="#2F6E45"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d={`M${p.x} ${98 - p.h * 0.55}c-10-4-16-12-16-20 10 0 16 8 16 20z`}
            fill="#66AD79"
          />
          <path
            d={`M${p.x} ${98 - p.h * 0.75}c10-4 16-12 16-20-10 0-16 8-16 20z`}
            fill="#3F8F5A"
          />
          {i === 2 && <circle cx={p.x} cy={98 - p.h} r="6" fill="#E4A84C" />}
          <text
            x={p.x}
            y="120"
            textAnchor="middle"
            fontFamily="system-ui, sans-serif"
            fontSize="9"
            fontWeight="700"
            fill="#FBEBD3"
          >
            {p.y}
          </text>
        </g>
      ))}
      <path
        d="M56 40c30-16 70-22 110-14"
        stroke="#174D3A"
        strokeWidth="2"
        strokeDasharray="4 5"
        fill="none"
      />
      <path
        d="M162 20l8 6-9 5"
        stroke="#174D3A"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="210" cy="24" r="10" fill="#FFD27A" />
      <SiMark />
    </svg>
  );
}

/** Step 4 — weigh water against soil and income. */
export function IlloBalance({ className }: P) {
  return (
    <svg viewBox="0 0 240 132" className={className} aria-hidden>
      <defs>
        <linearGradient id="il-bal-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#EFE7F6" />
          <stop offset="1" stopColor="#E3F0F8" />
        </linearGradient>
      </defs>
      <rect width="240" height="132" rx="16" fill="url(#il-bal-bg)" />
      <path
        d="M120 26v84"
        stroke="#5B3F86"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M96 112h48"
        stroke="#5B3F86"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M58 44l124-10"
        stroke="#5B3F86"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="120" cy="38" r="6" fill="#8E6CB8" />
      <path
        d="M58 44l-18 34h36z"
        fill="none"
        stroke="#8E6CB8"
        strokeWidth="1.5"
      />
      <path
        d="M182 34l-18 34h36z"
        fill="none"
        stroke="#8E6CB8"
        strokeWidth="1.5"
      />
      <path d="M36 78h44c0 10-10 16-22 16s-22-6-22-16z" fill="#8E6CB8" />
      <path d="M160 68h44c0 10-10 16-22 16s-22-6-22-16z" fill="#8E6CB8" />
      <path
        d="M58 50c-8 10-12 16-12 21a12 12 0 0024 0c0-5-4-11-12-21z"
        fill="#4A94C7"
      />
      <path d="M182 42c-14 2-20 12-18 24 12-2 20-10 18-24z" fill="#66AD79" />
      <path
        d="M166 64c4-6 9-11 14-16"
        stroke="#2F6E45"
        strokeWidth="1.6"
        fill="none"
      />
      <SiMark />
    </svg>
  );
}
