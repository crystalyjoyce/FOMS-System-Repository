import React, { createContext, useContext, useState } from 'react';
import { SEEDED_AUDIT_LOGS, AuditLog } from '../data/seed';

interface AuditContextType {
  logs: AuditLog[];
  logAction: (action: string, module: string, recordType: string, recordId: string, details: string, userFullName: string, userRole: string, userId: string) => void;
}

const AuditContext = createContext<AuditContextType | undefined>(undefined);

export const AuditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<AuditLog[]>(SEEDED_AUDIT_LOGS);

  const logAction = (action: string, module: string, recordType: string, recordId: string, details: string, userFullName: string, userRole: string, userId: string) => {
    const newLog: AuditLog = {
      id: `AL-${Math.floor(Math.random() * 10000)}`,
      action,
      module,
      recordType,
      recordId,
      details,
      userFullName,
      userRole: userRole as any,
      userId,
      ipAddress: '192.168.1.1', // Mock IP
      timestamp: new Date().toISOString()
    };
    setLogs(prev => [newLog, ...prev]);
  };

  return (
    <AuditContext.Provider value={{ logs, logAction }}>
      {children}
    </AuditContext.Provider>
  );
};

export const useAudit = () => {
  const context = useContext(AuditContext);
  if (context === undefined) {
    throw new Error('useAudit must be used within an AuditProvider');
  }
  return context;
};
