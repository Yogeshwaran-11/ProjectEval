import React from 'react';

/**
 * ProgressRing — animated SVG circular progress indicator
 * Props: value (0-100), size, strokeWidth, color, trackColor, label, sublabel
 */
export const ProgressRing = ({
  value = 0,
  size = 80,
  strokeWidth = 7,
  color = '#3730A3',
  trackColor = '#E0E7FF',
  label = '',
  sublabel = '',
  fontSize = '1.25rem'
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(100, Math.max(0, value));
  const offset = circumference - (clampedValue / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      {/* Center label */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          lineHeight: 1.1
        }}
      >
        <span style={{ fontSize, fontWeight: 900, color, fontFamily: 'var(--font-display)', lineHeight: 1 }}>
          {label}
        </span>
        {sublabel && (
          <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--color-text-muted)', marginTop: '1px' }}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
};
