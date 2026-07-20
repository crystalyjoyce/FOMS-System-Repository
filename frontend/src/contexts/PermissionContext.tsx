import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

// Centralized permission matrix matching the RBAC specifications
export const rolePermissions: Record<string, string[]> = {
  "Financial Manager": [
    "ai.dashboard.view",
    "ai.duplicate.view",
    "ai.duplicate.review",
    "ai.collection.view",
    "ai.collection.validate",
    "ai.reports.view",
    "ai.audit.view",
  ],
  "Head Accountant": [
    "ai.dashboard.view",
    "ai.duplicate.view",
    "ai.duplicate.review",
    "ai.collection.view",
    "ai.reports.view",
  ],
  "Accountant": [
    "ai.dashboard.view",
    "ai.duplicate.view",
    "ai.duplicate.review",
    "ai.collection.view",
    "ai.reports.view",
  ],
  "Coordinator": [
    "ai.dashboard.view_limited",
    "ai.duplicate.waybill.view",
  ],
  "Assistant of Financial Manager": [
    "ai.dashboard.view_limited",
    "ai.reports.view_limited",
  ],
  "Client": [],
};

interface PermissionContextType {
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionProvider");
  }
  return context;
};

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    const permissions = rolePermissions[user.role] || [];
    
    // Explicit permission match
    if (permissions.includes(permission)) return true;
    
    // Specific matrix fallbacks for limited permission tiers
    if (permission === 'ai.dashboard.view' && permissions.includes('ai.dashboard.view_limited')) return true;
    if (permission === 'ai.duplicate.view' && permissions.includes('ai.duplicate.waybill.view')) return true;
    if (permission === 'ai.reports.view' && permissions.includes('ai.reports.view_limited')) return true;
    if (permission === 'ai.audit.view' && permissions.includes('ai.reports.view')) return true; // Accountant fallback
    
    return false;
  };

  const hasRole = (role: string): boolean => {
    return user ? user.role === role : false;
  };

  return (
    <PermissionContext.Provider value={{ hasPermission, hasRole }}>
      {children}
    </PermissionContext.Provider>
  );
};
