import React from 'react';

export const TableSkeleton: React.FC<{ columns?: number; rows?: number }> = ({ columns = 5, rows = 3 }) => {
  return (
    <div className="data-table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, idx) => (
              <th key={idx}>
                <div className="skeleton" style={{ height: '14px', width: idx === 0 ? '80px' : '100px' }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rIdx) => (
            <tr key={rIdx}>
              {Array.from({ length: columns }).map((_, cIdx) => (
                <td key={cIdx}>
                  {cIdx === columns - 1 ? (
                    <div className="skeleton skeleton-table-btn" />
                  ) : (
                    <div 
                      className={`skeleton skeleton-table-cell ${
                        cIdx % 2 === 0 ? 'wide' : 'narrow'
                      }`} 
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="card skeleton" style={{ minHeight: '180px' }} />
  );
};

export const MetricCardSkeleton: React.FC = () => {
  return (
    <div className="kpi-card" style={{ height: '108px' }}>
      <div style={{ flex: 1 }}>
        <div className="skeleton" style={{ height: '12px', width: '80px', marginBottom: '8px' }} />
        <div className="skeleton" style={{ height: '24px', width: '120px' }} />
      </div>
      <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '12px' }} />
    </div>
  );
};

export const ChartSkeleton: React.FC = () => {
  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <div className="skeleton" style={{ height: '18px', width: '150px' }} />
        <div className="skeleton" style={{ height: '12px', width: '200px' }} />
      </div>
      <div className="skeleton skeleton-chart" style={{ height: '260px' }} />
    </div>
  );
};

export const PageHeaderSkeleton: React.FC = () => {
  return (
    <div className="flex justify-between items-center mb-4" style={{ padding: '0 0 var(--space-4) 0' }}>
      <div>
        <div className="skeleton" style={{ height: '12px', width: '100px', marginBottom: '8px' }} />
        <div className="skeleton" style={{ height: '28px', width: '240px' }} />
      </div>
      <div className="skeleton skeleton-btn" />
    </div>
  );
};

export const ProfileSkeleton: React.FC = () => {
  return (
    <div className="card flex items-center gap-3" style={{ padding: '20px' }}>
      <div className="skeleton skeleton-avatar" />
      <div>
        <div className="skeleton" style={{ height: '16px', width: '120px', marginBottom: '6px' }} />
        <div className="skeleton" style={{ height: '12px', width: '80px' }} />
      </div>
    </div>
  );
};

export const DetailsSkeleton: React.FC = () => {
  return (
    <div className="card">
      <div className="skeleton skeleton-title" />
      <div className="grid-2">
        <div className="skeleton" style={{ height: '80px' }} />
        <div className="skeleton" style={{ height: '80px' }} />
      </div>
      <div className="skeleton" style={{ height: '14px', width: '100%', marginTop: '12px' }} />
      <div className="skeleton" style={{ height: '14px', width: '90%', marginTop: '8px' }} />
      <div className="skeleton" style={{ height: '14px', width: '95%', marginTop: '8px' }} />
    </div>
  );
};
