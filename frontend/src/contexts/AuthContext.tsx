import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  username: string;
  role: string;
}

export interface Permissions {
  view_dashboard: boolean;
  run_sync: boolean;
  view_duplicates: boolean;
  view_invoice_duplicates: boolean;
  view_priorities: boolean;
  view_recommendations: boolean;
  approve_review: boolean;
  view_audit_history: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  permissions: Permissions | null;
  loading: boolean;
  login: (role: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize role mapping to local permissions (fallback before backend response)
  const mapRoleToPermissions = (role: string): Permissions => {
    return {
      view_dashboard: role !== "Client",
      run_sync: ["Financial Manager", "Head Accountant", "Accountant"].includes(role),
      view_duplicates: ["Financial Manager", "Head Accountant", "Accountant", "Coordinator"].includes(role),
      view_invoice_duplicates: ["Financial Manager", "Head Accountant", "Accountant"].includes(role),
      view_priorities: ["Financial Manager", "Head Accountant", "Accountant"].includes(role),
      view_recommendations: ["Financial Manager", "Head Accountant", "Accountant"].includes(role),
      approve_review: ["Financial Manager", "Head Accountant", "Accountant"].includes(role),
      view_audit_history: ["Financial Manager", "Head Accountant", "Accountant", "Assistant of Financial Manager"].includes(role)
    };
  };

  useEffect(() => {
    const loadSession = async () => {
      const storedToken = localStorage.getItem("foms_ai_token");
      const storedUser = localStorage.getItem("foms_ai_user");
      
      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
          setPermissions(mapRoleToPermissions(parsedUser.role));
          
          // Verify against backend if online
          const res = await fetch("/api/ai/me", {
            headers: { "Authorization": `Bearer ${storedToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUser({ username: data.username, role: data.role });
            setPermissions(mapRoleToPermissions(data.role));
          } else {
            // Token expired or invalid
            logout();
          }
        } catch {
          logout();
        }
      }
      setLoading(false);
    };
    loadSession();
  }, []);

  const login = async (role: string) => {
    setLoading(true);
    // Standard mock token mappings to enable simple local testing
    let mockToken = "fm-token";
    let username = "financial_manager_user";

    if (role === "Head Accountant") {
      mockToken = "accountant-token";
      username = "head_accountant_user";
    } else if (role === "Accountant") {
      mockToken = "staff-accountant-token";
      username = "accountant_user";
    } else if (role === "Coordinator") {
      mockToken = "coordinator-token";
      username = "coordinator_user";
    } else if (role === "Assistant of Financial Manager") {
      mockToken = "assistant-token";
      username = "assistant_fm_user";
    } else if (role === "Client") {
      mockToken = "client-token";
      username = "client_user";
    }

    const mockUser = { username, role };
    localStorage.setItem("foms_ai_token", mockToken);
    localStorage.setItem("foms_ai_user", JSON.stringify(mockUser));
    
    setToken(mockToken);
    setUser(mockUser);
    setPermissions(mapRoleToPermissions(role));
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem("foms_ai_token");
    localStorage.removeItem("foms_ai_user");
    setToken(null);
    setUser(null);
    setPermissions(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, permissions, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
