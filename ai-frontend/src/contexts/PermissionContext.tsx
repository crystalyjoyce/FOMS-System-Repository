import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

// Centralized permission matrix matching the RBAC specifications
export const rolePermissions: Record<string, string[]> = {
  "Finance Manager": [
    "ai.dashboard.view",
    "ai.duplicate.view",
    "ai.duplicate.review",
    "ai.collection.view",
    "ai.collection.validate",
    "ai.collection.for_review",
    "ai.reports.view",
    "ai.audit.view",
    "ai.audit.view_limited",
    "ai.audit.export",
  ],
  "Financial Manager": [
    "ai.dashboard.view",
    "ai.duplicate.view",
    "ai.duplicate.review",
    "ai.collection.view",
    "ai.collection.validate",
    "ai.collection.for_review",
    "ai.reports.view",
    "ai.audit.view",
    "ai.audit.view_limited",
    "ai.audit.export",
  ],
  "FinancialManager": [
    "ai.dashboard.view",
    "ai.duplicate.view",
    "ai.duplicate.review",
    "ai.collection.view",
    "ai.collection.validate",
    "ai.collection.for_review",
    "ai.reports.view",
    "ai.audit.view",
    "ai.audit.view_limited",
    "ai.audit.export",
  ],
  "Head Accountant": [
    "ai.dashboard.view",
    "ai.duplicate.view",
    "ai.duplicate.review",
    "ai.collection.view",
    "ai.collection.for_review",
    "ai.reports.view",
    "ai.audit.view",
    "ai.audit.view_limited",
    "ai.audit.export",
  ],
  "HeadAccountant": [
    "ai.dashboard.view",
    "ai.duplicate.view",
    "ai.duplicate.review",
    "ai.collection.view",
    "ai.collection.for_review",
    "ai.reports.view",
    "ai.audit.view",
    "ai.audit.view_limited",
    "ai.audit.export",
  ],
  "Accountant": [
    "ai.dashboard.view",
    "ai.duplicate.view",
    "ai.duplicate.review",
    "ai.collection.view",
    "ai.collection.validate",
    "ai.reports.view",
    "ai.audit.view",
    "ai.audit.view_limited",
  ],
  "Coordinator": [
    "ai.dashboard.view_limited",
    "ai.duplicate.waybill.view",
    "ai.collection.view",
    "ai.collection.validate",
  ],
  "Assistant of Finance Manager": [
    "ai.dashboard.view_limited",
    "ai.reports.view_limited",
    "ai.collection.view",
    "ai.collection.validate",
    "ai.audit.view_limited",
  ],
  "Assistant of Financial Manager": [
    "ai.dashboard.view_limited",
    "ai.reports.view_limited",
    "ai.collection.view",
    "ai.collection.validate",
    "ai.audit.view_limited",
  ],
  "AssistantFinancialManager": [
    "ai.dashboard.view_limited",
    "ai.reports.view_limited",
    "ai.collection.view",
    "ai.collection.validate",
    "ai.audit.view_limited",
  ],
  "Client": [],
};

export const normalizeRoleKey = (role?: string): string => {
  return (role || '').replace(/[\s_-]+/g, '').toLowerCase();
};

export const getRolePermissions = (role?: string): string[] => {
  if (!role) return [];
  if (rolePermissions[role]) return rolePermissions[role];
  const targetKey = normalizeRoleKey(role);
  for (const [key, perms] of Object.entries(rolePermissions)) {
    if (normalizeRoleKey(key) === targetKey) {
      return perms;
    }
  }
  return [];
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
    const permissions = getRolePermissions(user.role);
    
    // Explicit permission match
    if (permissions.includes(permission)) return true;
    
    // Specific matrix fallbacks for limited permission tiers
    if (permission === 'ai.dashboard.view' && permissions.includes('ai.dashboard.view_limited')) return true;
    if (permission === 'ai.duplicate.view' && permissions.includes('ai.duplicate.waybill.view')) return true;
    if (permission === 'ai.reports.view' && permissions.includes('ai.reports.view_limited')) return true;
    if (permission === 'ai.audit.view' && (permissions.includes('ai.reports.view') || permissions.includes('ai.audit.view_limited'))) return true;
    
    return false;
  };

  const hasRole = (role: string): boolean => {
    if (!user?.role) return false;
    return normalizeRoleKey(user.role) === normalizeRoleKey(role);
  };

  return (
    <PermissionContext.Provider value={{ hasPermission, hasRole }}>
      {children}
    </PermissionContext.Provider>
  );
};
