/* Original flat illustrations for Soil Time Machine (inline SVG, no external assets).
 * Palette follows the app tokens: forest, leaf, mint, water, sky, amber, earth. */

type P = { className?: string };

/** Step 1 — pin a field on the map. */
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
    </svg>
  );
}

/** Pressure — dry, cracked, salty soil. */
export function IlloDrought({ className }: P) {
  return (
    <svg viewBox="0 0 320 120" className={className} aria-hidden>
      <defs>
        <linearGradient id="il-dr-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D9EEF8" />
          <stop offset="1" stopColor="#F6EAD2" />
        </linearGradient>
      </defs>
      <rect width="320" height="120" fill="url(#il-dr-bg)" />
      <circle cx="262" cy="30" r="16" fill="#FFC85C" />
      <circle cx="262" cy="30" r="26" fill="#FFC85C" opacity=".22" />
      <path d="M0 78h320v42H0z" fill="#D7B07A" />
      <g stroke="#9C7140" strokeWidth="1.8" fill="none" strokeLinecap="round">
        <path d="M20 86l18 8 6 14M38 94l22-4 14 10M120 84l-8 12 12 12M112 96l-22 4M200 86l14 10-4 12M214 96l24-2 10 10M290 84l-10 14" />
      </g>
      <path
        d="M0 70c40-8 70 6 110 0s70-10 110-2 70 6 100 0v12H0z"
        fill="#4A94C7"
        opacity=".85"
      />
      <path
        d="M10 70c24-4 40 2 60 0M150 66c24-4 40 2 60 0"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".7"
      />
      <g fill="#fff">
        <rect
          x="70"
          y="48"
          width="7"
          height="7"
          rx="1.5"
          transform="rotate(20 73 51)"
        />
        <rect
          x="84"
          y="40"
          width="5"
          height="5"
          rx="1"
          transform="rotate(-15 86 42)"
        />
        <rect
          x="96"
          y="52"
          width="6"
          height="6"
          rx="1.5"
          transform="rotate(35 99 55)"
        />
      </g>
      <text
        x="64"
        y="36"
        fontFamily="system-ui, sans-serif"
        fontSize="10"
        fontWeight="800"
        fill="#24628D"
      >
        NaCl
      </text>
      <path
        d="M170 20c-10 14-15 22-15 29a15 15 0 0030 0c0-7-5-15-15-29z"
        fill="#4A94C7"
      />
      <path
        d="M164 48a7 7 0 006 6"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/** Pressure — soil profile with roots, tired topsoil. */
export function IlloSoil({ className }: P) {
  return (
    <svg viewBox="0 0 320 120" className={className} aria-hidden>
      <rect width="320" height="120" fill="#EAF5EC" />
      <path d="M0 36h320v84H0z" fill="#B8864F" />
      <path d="M0 36h320v18H0z" fill="#6E4A26" />
      <path d="M0 74h320v46H0z" fill="#D4B184" />
      <g fill="#F3E3C8" opacity=".75">
        <circle cx="40" cy="92" r="3" />
        <circle cx="120" cy="104" r="2.5" />
        <circle cx="210" cy="88" r="3.5" />
        <circle cx="280" cy="106" r="2.5" />
      </g>
      <g stroke="#F3E9DC" strokeWidth="1.6" fill="none" strokeLinecap="round">
        <path d="M70 36v30m0-12l-10 14m10-6l12 12" />
        <path d="M240 36v44m0-26l-14 18m14-8l16 18m-16-4l-6 16" />
      </g>
      <path
        d="M70 36V18"
        stroke="#2F6E45"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M70 24c-10-2-16-8-16-14 9 0 16 6 16 14zM70 22c10-2 16-8 16-14-9 0-16 6-16 14z"
        fill="#66AD79"
      />
      <path
        d="M240 36V10"
        stroke="#2F6E45"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M240 18c-12-2-18-10-18-16 10 0 18 6 18 16zM240 14c12-2 18-8 18-14-10 0-18 6-18 14z"
        fill="#3F8F5A"
      />
      <g fill="#F6C6BE">
        <circle cx="236" cy="70" r="3.5" />
        <circle cx="244" cy="66" r="3" />
      </g>
      <path
        d="M150 96c8-6 16 6 24 0s16 6 24 0"
        stroke="#D97167"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="150" cy="96" r="1.6" fill="#6E4A26" />
    </svg>
  );
}

/** Pressure — heat, storm clouds and rain together. */
export function IlloClimate({ className }: P) {
  return (
    <svg viewBox="0 0 320 120" className={className} aria-hidden>
      <defs>
        <linearGradient id="il-cl-bg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FDE7C4" />
          <stop offset="1" stopColor="#DCEBF7" />
        </linearGradient>
      </defs>
      <rect width="320" height="120" fill="url(#il-cl-bg)" />
      <circle cx="78" cy="52" r="22" fill="#F5A524" />
      <g stroke="#F5A524" strokeWidth="4" strokeLinecap="round">
        <path d="M78 14v8M78 82v8M40 52h8M108 52h8M52 26l6 6M98 72l6 6M52 78l6-6M98 32l6-6" />
      </g>
      <path
        d="M190 58a20 20 0 0138-8 16 16 0 0132 6 14 14 0 01-2 28h-66a14 14 0 01-2-26z"
        fill="#7C93A8"
      />
      <path
        d="M198 92l-6 12M216 92l-6 12M234 92l-6 12M252 92l-6 12"
        stroke="#4A94C7"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <g transform="translate(142 22)">
        <rect
          x="0"
          y="0"
          width="14"
          height="60"
          rx="7"
          fill="#fff"
          stroke="#B5524A"
          strokeWidth="2"
        />
        <rect x="4" y="22" width="6" height="36" rx="3" fill="#D97167" />
        <circle cx="7" cy="66" r="11" fill="#D97167" />
      </g>
      <path d="M0 108c50-6 100 6 160 0s110-6 160 0v12H0z" fill="#7FC08F" />
    </svg>
  );
}

/** Wide scene for banners: paddies, canal, palms and a satellite. */
export function IlloFieldScene({
  className,
  tone = "light",
}: P & { tone?: "light" | "dark" }) {
  const sky = tone === "dark" ? ["#10382D", "#1E5A43"] : ["#D6EEF8", "#EEF7EA"];
  return (
    <svg
      viewBox="0 0 600 220"
      className={className}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden
    >
      <defs>
        <linearGradient id={`il-scene-sky-${tone}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky[0]} />
          <stop offset="1" stopColor={sky[1]} />
        </linearGradient>
      </defs>
      <rect width="600" height="220" fill={`url(#il-scene-sky-${tone})`} />
      <circle
        cx="470"
        cy="70"
        r="30"
        fill="#FFD27A"
        opacity={tone === "dark" ? 0.9 : 1}
      />
      <circle cx="470" cy="70" r="48" fill="#FFD27A" opacity=".18" />
      <g transform="translate(120 34) rotate(-12)">
        <rect x="-18" y="4" width="14" height="9" rx="1.5" fill="#7FB8E0" />
        <rect x="30" y="4" width="14" height="9" rx="1.5" fill="#7FB8E0" />
        <rect x="-4" y="0" width="34" height="17" rx="4" fill="#F2F5F7" />
        <path d="M13 17v6" stroke="#F2F5F7" strokeWidth="2" />
      </g>
      <path
        d="M120 60l-50 120M120 60l50 120"
        stroke="#fff"
        strokeOpacity=".25"
        strokeDasharray="3 6"
      />
      <path d="M0 150c80-20 160-24 250-12s170 10 350-12v94H0z" fill="#7FC08F" />
      <path d="M0 168c90-16 190-14 280-4s180 8 320-6v62H0z" fill="#5AA16E" />
      <path d="M0 190c120-12 240-6 340 0s180 0 260-6v36H0z" fill="#3F8F5A" />
      <path
        d="M-10 204c110-16 230-4 330-6s200-14 290-4"
        stroke="#4A94C7"
        strokeWidth="10"
        fill="none"
      />
      <g stroke="#ffffff" strokeOpacity=".35" strokeWidth="1.5">
        <path d="M30 160l20 20M70 154l22 24M110 150l24 26M330 152l18 22M370 150l20 24M410 148l22 26M450 146l22 26" />
      </g>
      {[
        [520, 150, 1],
        [556, 158, 0.85],
        [40, 140, 0.9],
      ].map(([x, y, s]) => (
        <g key={`${x}`} transform={`translate(${x} ${y}) scale(${s})`}>
          <path
            d="M0 0c2-24 2-40-4-58"
            stroke="#6E4A26"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M-4 -58c-14-4-26 2-32 12 12-6 22-6 32-12zM-4 -58c12-10 26-10 34-2-12-2-22-2-34 2zM-4 -58c-6-12-2-24 8-30-4 10-6 20-8 30zM-4 -58c-16 4-22 16-22 26 6-10 12-18 22-26z"
            fill="#2F6E45"
          />
        </g>
      ))}
    </svg>
  );
}

/** Decorative paddy silhouette for coloured page headers. */
export function HeaderArt({ className }: P) {
  return (
    <svg viewBox="0 0 360 140" className={className} aria-hidden>
      <g fill="#fff">
        <path d="M0 140c40-30 90-44 150-44s120 18 210 6v38z" opacity=".10" />
        <path d="M40 140c40-22 90-30 140-30s110 10 180 2v28z" opacity=".12" />
        <path d="M120 140c30-14 70-20 110-20s80 6 130 0v20z" opacity=".14" />
      </g>
      <g stroke="#fff" strokeOpacity=".22" strokeWidth="1.4">
        <path d="M150 112l12 20M178 110l12 22M206 110l12 22M234 112l12 20M262 112l12 20M290 110l12 22M318 108l12 24" />
      </g>
      <g transform="translate(276 26) rotate(-14)" opacity=".55">
        <rect x="-16" y="4" width="13" height="8" rx="1.5" fill="#fff" />
        <rect x="27" y="4" width="13" height="8" rx="1.5" fill="#fff" />
        <rect x="-3" y="0" width="30" height="16" rx="4" fill="#fff" />
      </g>
      <path
        d="M288 46c-10 12-18 26-22 40M300 50c-6 12-10 26-12 38"
        stroke="#fff"
        strokeOpacity=".25"
        strokeDasharray="3 5"
      />
      <circle cx="96" cy="40" r="18" fill="#fff" opacity=".12" />
    </svg>
  );
}
