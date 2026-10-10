import React from 'react';

export type StatusCardVariant = 'teal' | 'success' | 'warning' | 'danger' | 'info' | 'new' | 'delivery';

type TrendType = 'up' | 'down' | 'neutral';

interface Trend {
  type: TrendType;
  value: string;
}

export interface StatusCardProps {
  label: string;
  value: React.ReactNode;
  icon?: string; // Tabler icon class name, e.g., 'ti ti-truck'
  variant?: StatusCardVariant;
  trend?: Trend;
  periodText?: string;
  sparklineData?: number[];
  polarity?: 'higher-is-better' | 'lower-is-better';
  loading?: boolean;
  onClick?: () => void;
}

const variantColors: Record<StatusCardVariant, { accent: string; bg: string }> = {
  teal: { accent: 'var(--teal)', bg: 'var(--teal-bg)' },
  success: { accent: 'var(--ok)', bg: 'var(--ok-bg)' },
  warning: { accent: 'var(--warn)', bg: 'var(--warn-bg)' },
  danger: { accent: 'var(--err)', bg: 'var(--err-bg)' },
  info: { accent: 'var(--info)', bg: 'var(--info-bg)' },
  new: { accent: 'var(--new)', bg: 'var(--new-bg)' },
  delivery: { accent: 'var(--delivery)', bg: 'var(--delivery-bg)' },
};

export const StatusCard: React.FC<StatusCardProps> = ({
  label,
  value,
  icon,
  variant = 'teal',
  trend,
  periodText,
  sparklineData,
  polarity = 'higher-is-better',
  loading = false,
  onClick,
}) => {
  const colors = variantColors[variant] || variantColors.teal;
  
  const displayTrend = trend || null;
  const displaySparkline = sparklineData || [];
  const displayPeriodText = periodText || '';

  const customStyles = {
    '--kpi-ac': colors.accent,
    '--kpi-ibg': colors.bg,
    '--kpi-ic': colors.accent,
    cursor: onClick ? 'pointer' : 'default',
    userSelect: 'none',
  } as React.CSSProperties;

  // Polarity aware coloring: for 'lower-is-better', a decrease is positive (green), and an increase is negative (red)
  const getTrendClass = (type: TrendType) => {
    if (type === 'neutral') return 't-nl';
    if (polarity === 'lower-is-better') {
      return type === 'down' ? 't-up' : 't-dn';
    } else {
      return type === 'up' ? 't-up' : 't-dn';
    }
  };

  const getTrendIcon = (type: TrendType) => {
    if (type === 'up') return '↑';
    if (type === 'down') return '↓';
    return '•';
  };

  const maxSparkVal = displaySparkline.length > 0 ? Math.max(...displaySparkline) : 1;

  if (loading) {
    return (
      <div className="kpi" style={{ ...customStyles, pointerEvents: 'none' }}>
        <div className="kpi-top">
          <div className="kpi-shimmer-bg" style={{ width: '55%', height: '12px' }} />
          <div className="kpi-shimmer-bg kpi-skeleton-circle" style={{ width: '32px', height: '32px' }} />
        </div>
        <div className="kpi-shimmer-bg" style={{ width: '75%', height: '28px', margin: '6px 0 12px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginTop: 'auto' }}>
          <div className="kpi-shimmer-bg" style={{ width: '30%', height: '10px' }} />
          <div className="kpi-shimmer-bg" style={{ width: '40%', height: '10px' }} />
        </div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          .kpi-anim-wrapper {
            transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .kpi-anim-wrapper:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 20px -8px rgba(0,0,0,0.12);
          }
        `}
      </style>
      <div
        className={`kpi kpi-anim-wrapper ${onClick ? 'kpi-clickable' : ''}`}
        style={customStyles}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
      >
        <div className="kpi-top">
          <span className="kpi-label">{label}</span>
          {icon && (
            <div className="kpi-icon-box">
              <i className={icon} style={{ fontSize: '18px' }} />
            </div>
          )}
        </div>

        <div className="kpi-val">{value}</div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginTop: 'auto' }}>
          {displayTrend && (
            <div className={`kpi-trend ${getTrendClass(displayTrend.type)}`}>
              <span>{getTrendIcon(displayTrend.type)} {displayTrend.value}</span>
            </div>
          )}
          
          {displayPeriodText && <span className="kpi-period">{displayPeriodText}</span>}
        </div>

        {displaySparkline.length > 0 && (
          <div className="kpi-spark">
            {displaySparkline.map((val, idx) => {
              const heightPercent = maxSparkVal > 0 ? (val / maxSparkVal) * 100 : 0;
              const isHigh = val > maxSparkVal * 0.7; // highlight highest bars
              return (
                <div
                  key={idx}
                  className={`spark-b ${isHigh ? 'hi' : ''}`}
                  style={{ height: `${heightPercent}%` }}
                  title={`Value: ${val}`}
                />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default StatusCard;
