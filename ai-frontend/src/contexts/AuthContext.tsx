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
    const clearSession = () => {
      localStorage.removeItem('foms_ai_token');
      localStorage.removeItem('foms_ai_user');
      setToken(null);
      setUser(null);
      setPermissions(null);
    };

    const loadSession = async () => {
      const storedToken = localStorage.getItem('foms_ai_token');
      const storedUser = localStorage.getItem('foms_ai_user');

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
          setPermissions(mapRoleToPermissions(parsedUser.role));

          // Verify token with backend — but ONLY clear session if the token
          // is explicitly rejected (401/403). Network errors (AI gateway offline)
          // should keep the stored session so the user stays logged in.
          try {
            const res = await fetch('/api/ai/me', {
              headers: { Authorization: `Bearer ${storedToken}` },
            });
            if (res.ok) {
              const data = await res.json();
              setUser({ username: data.username, role: data.role });
              setPermissions(mapRoleToPermissions(data.role));
            } else if (res.status === 401 || res.status === 403) {
              // Explicit rejection — clear session
              clearSession();
            }
            // Any other HTTP error (502, 503, etc.) — keep the session
          } catch {
            // Network/fetch error (AI gateway down) — keep the stored session
          }
        } catch {
          // Could not parse stored user JSON — clear corrupt state
          clearSession();
        }
      }
      setLoading(false);
    };
    loadSession();
  }, []);


  const login = async (username: string, password: string) => {
    setLoading(true);
    
    try {
      // Attempt the login request
      let res: Response;
      try {
        res = await fetch("/api/ai/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
        });
      } catch {
        // Network-level failure (AI Gateway is down / unreachable)
        throw new Error("Cannot connect to the AI service. Please make sure all services are running.");
      }

      // Safely parse the response body — guard against empty / non-JSON responses
      let data: Record<string, unknown> | null = null;
      try {
        data = await res.json();
      } catch {
        // Gateway returned an empty or HTML error page (e.g. 502/503 with no body)
        if (res.status === 503 || res.status === 502) {
          throw new Error("The AI service is currently unavailable. Please try again in a moment.");
        }
        throw new Error("Invalid Employee ID or password. Please check your credentials and try again.");
      }

      if (!res.ok) {
        // Map HTTP status codes to human-friendly messages
        if (res.status === 401) {
          throw new Error("Invalid Employee ID or password. Please check your credentials and try again.");
        } else if (res.status === 403) {
          throw new Error("Your account is inactive. Please contact your administrator.");
        } else {
          const detail = (data?.detail as string) || (data?.message as string) || "An unexpected error occurred. Please try again.";
          throw new Error(detail);
        }
      }

      // Even a 200 response can contain a server-side error (Python backend quirk)
      if (data?.error) {
        throw new Error("Invalid Employee ID or password. No account found with those credentials.");
      }

      const { token, user: userData } = data as { token?: string; user?: { username: string; role: string } };

      if (!token || !userData) {
        throw new Error("Invalid Employee ID or password. No account found with those credentials.");
      }
      
      localStorage.setItem("foms_ai_token", token);
      localStorage.setItem("foms_ai_user", JSON.stringify(userData));
      
      setToken(token);
      setUser(userData as { username: string; role: string });
      setPermissions(mapRoleToPermissions((userData as { username: string; role: string }).role));
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
