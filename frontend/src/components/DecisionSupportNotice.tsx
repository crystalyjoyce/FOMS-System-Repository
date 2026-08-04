import React from 'react';
import { HelpCircle } from 'lucide-react';

export const DecisionSupportNotice: React.FC = () => {
  return (
    <div className="advisory-banner">
      <HelpCircle size={20} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
      <div>
        <span 
          style={{ 
            fontWeight: 700, 
            textTransform: 'uppercase', 
            fontSize: '11px', 
            display: 'block', 
            marginBottom: '4px', 
            letterSpacing: '0.05em',
            color: 'var(--primary-dark)'
          }}
        >
          Decision Support Notice
        </span>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
          AI-generated results are provided as decision support only. Final validation and official record updates must be performed by an authorized finance user through the existing FOMS workflow.
        </p>
      </div>
    </div>
  );
};
