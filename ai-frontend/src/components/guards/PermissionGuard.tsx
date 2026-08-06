import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../contexts/PermissionContext';

interface PermissionGuardProps {
  permission: string | string[];
  children: React.ReactNode;
  fallbackRedirect?: string;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  permission, 
  children, 
  fallbackRedirect 
}) => {
  const { hasPermission } = usePermissions();

  const hasAccess = Array.isArray(permission)
    ? permission.some(p => hasPermission(p))
    : hasPermission(permission);

  if (!hasAccess) {
    if (fallbackRedirect) {
      return <Navigate to={fallbackRedirect} replace />;
    }
    return null; // Return null to hide inline actions/buttons silently
  }

  return <>{children}</>;
};
