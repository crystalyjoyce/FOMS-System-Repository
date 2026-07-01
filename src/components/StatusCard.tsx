import React from 'react';

export type StatusCardVariant = 'teal' | 'success' | 'warning' | 'danger' | 'info' | 'new' | 'delivery';

export interface StatusCardProps {
  label: string;
  value: string | number;
  icon?: string; // Tabler icon class name, e.g., 'ti ti-truck'
  variant?: StatusCardVariant;
  trend?: {
    value: string;
    type: 'up' | 'down' | 'neutral';
  };
  periodText?: string;
  sparklineData?: number[];
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
}) => {
  const colors = variantColors[variant] || variantColors.teal;
  
  // Custom properties cast for TSX inline styling
  const customStyles = {
    '--kpi-ac': colors.accent,
    '--kpi-ibg': colors.bg,
    '--kpi-ic': colors.accent,
  } as React.CSSProperties;

  const getTrendClass = (type: 'up' | 'down' | 'neutral') => {
    if (type === 'up') return 't-up';
    if (type === 'down') return 't-dn';
    return 't-nl';
  };

  const getTrendIcon = (type: 'up' | 'down' | 'neutral') => {
    if (type === 'up') return '↑';
    if (type === 'down') return '↓';
    return '•';
  };

  const maxSparkVal = sparklineData && sparklineData.length > 0 ? Math.max(...sparklineData) : 1;

  return (
    <div className="kpi" style={customStyles}>
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
        {trend && (
          <div className={`kpi-trend ${getTrendClass(trend.type)}`}>
            <span>{getTrendIcon(trend.type)} {trend.value}</span>
          </div>
        )}
        
        {periodText && (
          <span className="kpi-period">{periodText}</span>
        )}
      </div>

      {sparklineData && sparklineData.length > 0 && (
        <div className="kpi-spark">
          {sparklineData.map((val, idx) => {
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
  );
};

export default StatusCard;
