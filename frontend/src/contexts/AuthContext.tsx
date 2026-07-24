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
  login: (username: string, password: string) => Promise<void>;
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

  const login = async (username: string, password: string) => {
    setLoading(true);
    
    try {
      const res = await fetch("/api/ai/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });
      
      // Parse body first so we can read the server's error detail
      const data = await res.json();

      if (!res.ok) {
        // Map HTTP status codes to human-friendly messages
        if (res.status === 401) {
          throw new Error("Invalid Employee ID or password. Please check your credentials and try again.");
        } else if (res.status === 403) {
          throw new Error("Your account is inactive. Please contact your administrator.");
        } else {
          const detail = data?.detail || data?.message || "An unexpected error occurred.";
          throw new Error(detail);
        }
      }

      // Even a 200 response can contain a server-side error (backend quirk)
      if (data?.error) {
        throw new Error("Invalid Employee ID or password. No account found with those credentials.");
      }

      const { token, user: userData } = data;

      if (!token || !userData) {
        throw new Error("Invalid Employee ID or password. No account found with those credentials.");
      }
      
      localStorage.setItem("foms_ai_token", token);
      localStorage.setItem("foms_ai_user", JSON.stringify(userData));
      
      setToken(token);
      setUser(userData);
      setPermissions(mapRoleToPermissions(userData.role));
    } catch (e) {
      setLoading(false);
      throw e;
    }
    
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem("foms_ai_token");
    localStorage.removeItem("foms_ai_user");
    setToken(null);
    setUser(null);
    setPermissions(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, permissions, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
