import React from 'react';

interface EstampariaProLogoProps {
  /** Tamanho em px (padrão: 48) */
  size?: number;
  /** Ativa animação do anel externo e glow pulsante */
  animated?: boolean;
  /** Classe CSS extra */
  className?: string;
}

/**
 * EstampariaPro — Logo Mark C3 "Stamp Mark"
 * SVG vetorial inline: escalável, sem dependência externa, animável.
 *
 * Anatomia:
 *  - Anel externo tracejado (gira lentamente quando animated=true)
 *  - Anel médio sólido ciano
 *  - Disco interior escuro
 *  - Letra "E" geométrica bold branca
 *  - Acento ciano nas barras horizontais
 *  - 4 pontos de registro nos eixos (referência à serigrafia)
 */
export const EstampariaProLogo: React.FC<EstampariaProLogoProps> = ({
  size = 48,
  animated = false,
  className = '',
}) => {
  const id = React.useId().replace(/:/g, '');

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 110 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="EstampariaPro"
      role="img"
    >
      <defs>
        <radialGradient id={`bg-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0e1020" />
          <stop offset="100%" stopColor="#080910" />
        </radialGradient>
        <filter id={`glow-${id}`}>
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {animated && (
          <style>{`
            @keyframes ep-ring-spin {
              to { transform: rotate(360deg); }
            }
            @keyframes ep-glow {
              0%, 100% { filter: drop-shadow(0 0 6px rgba(0,207,255,0.5)); }
              50%       { filter: drop-shadow(0 0 20px rgba(0,207,255,0.9)) drop-shadow(0 0 40px rgba(0,207,255,0.3)); }
            }
            @keyframes ep-fade-in {
              from { opacity: 0; transform: scale(0.88); }
              to   { opacity: 1; transform: scale(1); }
            }
            .ep-ring-outer-${id} {
              transform-origin: 55px 55px;
              animation: ep-ring-spin 24s linear infinite;
            }
            .ep-logo-${id} {
              animation: ep-fade-in 0.7s cubic-bezier(0.22,1,0.36,1) both,
                         ep-glow 4s ease-in-out 0.7s infinite;
            }
          `}</style>
        )}
      </defs>

      <g className={animated ? `ep-logo-${id}` : ''}>
        {/* Fundo arredondado */}
        <rect width="110" height="110" rx="22" fill={`url(#bg-${id})`} />

        {/* Anel externo tracejado — gira quando animated */}
        <g className={animated ? `ep-ring-outer-${id}` : ''}>
          <circle
            cx="55" cy="55" r="46"
            stroke="#00CFFF"
            strokeWidth="0.8"
            strokeOpacity="0.2"
            strokeDasharray="4 6"
            fill="none"
          />
        </g>

        {/* Anel médio sólido */}
        <circle
          cx="55" cy="55" r="38"
          stroke="#00CFFF"
          strokeWidth="1.5"
          strokeOpacity="0.55"
          fill="none"
        />

        {/* Disco interior escuro */}
        <circle cx="55" cy="55" r="34" fill="#0c0e1c" />

        {/* ── Letra E geométrica ── */}
        <g filter={`url(#glow-${id})`}>
          {/* Haste vertical */}
          <rect x="33" y="29" width="7.5" height="52" rx="2" fill="white" />
          {/* Barra top */}
          <rect x="33" y="29" width="38" height="8" rx="2" fill="white" />
          {/* Acento ciano top */}
          <rect x="33" y="29" width="38" height="2.5" rx="1.5" fill="#00CFFF" />
          {/* Barra meio */}
          <rect x="33" y="48" width="30" height="7" rx="2" fill="white" />
          {/* Acento ciano meio */}
          <rect x="33" y="48" width="30" height="2" rx="1" fill="#00CFFF" />
          {/* Barra bottom */}
          <rect x="33" y="73" width="38" height="8" rx="2" fill="white" />
        </g>

        {/* 4 pontos de registro nos eixos (referência à serigrafia) */}
        <circle cx="55" cy="8"   r="2.2" fill="#00CFFF" opacity="0.65" />
        <circle cx="55" cy="102" r="2.2" fill="#00CFFF" opacity="0.65" />
        <circle cx="8"  cy="55"  r="2.2" fill="#00CFFF" opacity="0.65" />
        <circle cx="102" cy="55" r="2.2" fill="#00CFFF" opacity="0.65" />
      </g>
    </svg>
  );
};

export default EstampariaProLogo;
