import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AiHeader } from '../components/AiHeader';
import { DecisionSupportNotice } from '../components/DecisionSupportNotice';
import { Check, X, ShieldCheck, HelpCircle } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, permissions } = useAuth();

  if (!user || !permissions) {
    return (
      <div className="main-content">
        <AiHeader title="User Profile Center" />
        <div className="page-container state-container">
          <p className="state-title">No User Session Found</p>
        </div>
      </div>
    );
  }

  // Display name mappings
  const permissionLabels: Record<string, string> = {
    view_dashboard: "Access Intelligence Dashboard",
    run_sync: "Trigger Manual Data Sync & Analysis",
    view_duplicates: "Access Suspected Duplicates Registry",
    view_invoice_duplicates: "Evaluate Invoice/Receipt Duplicates",
    view_priorities: "Access Aging Priorities Queue",
    view_recommendations: "Access AI Action Recommendations",
    approve_review: "Submit Human Validation Decisions",
    view_audit_history: "View Compliance Audit History Logs"
  };

  return (
    <div className="main-content fade-in">
      <AiHeader title="User Profile & Security Center" />
      
      <div className="page-container">
        
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', borderBottom: '1px solid var(--border-soft)', paddingBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Security Profile</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
              Inspect your session parameters, assigned security groups, and permission logs.
            </p>
          </div>
        </div>

        {/* AdvisoryNotice */}
        <DecisionSupportNotice />

        <div className="dashboard-grid">
          {/* Section 1: User details card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 className="card-title" style={{ fontSize: '15px', borderBottom: '1px solid var(--border-soft)', paddingBottom: '10px' }}>
              Active Session Metadata
            </h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className="user-avatar" style={{ width: '64px', height: '64px', fontSize: '20px', borderRadius: '14px' }}>
                {user.username.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {user.username}
                </h2>
                <div className="badge badge-accepted" style={{ marginTop: '6px' }}>
                  {user.role}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingBottom: '8px', borderBottom: '1px solid var(--border-soft)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Security Clearance Level</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Level 3 (Finance Operations)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingBottom: '8px', borderBottom: '1px solid var(--border-soft)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Data Privacy Policy compliance</span>
                <span style={{ color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={14} /> Compliant
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Connected Workspace API</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Speedex OneUI Secured API Gateway</span>
              </div>
            </div>

            <div className="advisory-banner warning" style={{ marginTop: '12px', marginBottom: 0 }}>
              <HelpCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: '12px', margin: 0, color: 'var(--text-secondary)' }}>
                Roles are assigned inside the Speedex Active Directory. To modify clearance levels or request additional scopes, please contact your security systems administrator.
              </p>
            </div>
          </div>

          {/* Section 2: Permissions Grid card */}
          <div className="card">
            <h3 className="card-title" style={{ fontSize: '15px', borderBottom: '1px solid var(--border-soft)', paddingBottom: '10px', marginBottom: '16px' }}>
              Clearance Scopes Checklist
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(permissions).map(([key, isAllowed]) => {
                const label = permissionLabels[key] || key.replace(/_/g, ' ');
                return (
                  <div 
                    key={key} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      padding: '10px 14px', 
                      backgroundColor: 'var(--surface-soft)', 
                      borderRadius: '8px',
                      border: '1px solid var(--border-soft)'
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {label}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {isAllowed ? (
                        <div style={{ color: 'var(--success)', backgroundColor: 'var(--success-bg)', padding: '4px', borderRadius: '50%', display: 'flex' }}>
                          <Check size={14} />
                        </div>
                      ) : (
                        <div style={{ color: 'var(--text-muted)', backgroundColor: 'var(--border-soft)', padding: '4px', borderRadius: '50%', display: 'flex' }}>
                          <X size={14} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
