/**
 * ─── FOMS AuthContext ─────────────────────────────────────────────
 * Provides authentication state, login/logout functions, and
 * session management (FR-003, FR-007).
 *
 * FR-002: Verifies credentials against seeded user database.
 * FR-003: Logout clears sessionStorage and ends session.
 * FR-007: Auto-logout after SESSION_CONFIG.INACTIVITY_TIMEOUT_MS of inactivity.
 * ─────────────────────────────────────────────────────────────────
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import type { AuthContextValue, AuthState, LoginCredentials, User } from '../types/auth';
import { SEEDED_USERS, SESSION_CONFIG, type SeededUser } from '../data/seed';

// ─── Context ──────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Session Storage Helpers ──────────────────────────────────────

function saveSession(user: User): void {
  sessionStorage.setItem(SESSION_CONFIG.STORAGE_KEY, JSON.stringify(user));
}

function loadSession(): User | null {
  try {
    const raw = sessionStorage.getItem(SESSION_CONFIG.STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function clearSession(): void {
  sessionStorage.removeItem(SESSION_CONFIG.STORAGE_KEY);
}

// ─── Provider ─────────────────────────────────────────────────────

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [authState, setAuthState] = useState<AuthState>(() => {
    const stored = loadSession();
    return {
      user: stored,
      isAuthenticated: !!stored,
      isLoading: false,
    };
  });

  // ── Inactivity auto-logout (FR-007) ──

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      clearSession();
      setAuthState({ user: null, isAuthenticated: false, isLoading: false });
      navigate('/login', { replace: true });
    }, SESSION_CONFIG.INACTIVITY_TIMEOUT_MS);
  }, [navigate]);

  useEffect(() => {
    if (!authState.isAuthenticated) return;

    const events: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'click', 'scroll'];
    const handler = () => resetInactivityTimer();

    events.forEach((e) => window.addEventListener(e, handler));
    resetInactivityTimer(); // start the timer on mount

    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [authState.isAuthenticated, resetInactivityTimer]);

  const [usersList, setUsersList] = useState<SeededUser[]>(() => {
    try {
      const saved = localStorage.getItem('foms_staff_users');
      return saved ? JSON.parse(saved) : SEEDED_USERS;
    } catch {
      return SEEDED_USERS;
    }
  });

  useEffect(() => {
    localStorage.setItem('foms_staff_users', JSON.stringify(usersList));
  }, [usersList]);

  // ── Login (FR-001, FR-002) ──

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string; user?: User }> => {
      setAuthState((prev) => ({ ...prev, isLoading: true }));

      // Simulate async DB check (replace with Axios call when backend is ready)
      await new Promise((resolve) => setTimeout(resolve, 500));

      const match = usersList.find(
        (u) =>
          u.employeeId.toLowerCase() === credentials.employeeId.toLowerCase() &&
          u.password === credentials.password
      );

      if (!match) {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
        return { success: false, error: 'Invalid Employee ID or password. Please try again.' };
      }

      // Build user object (strip password)
      const { password: _omit, ...userData } = match;
      void _omit;
      const user: User = {
        ...userData,
        lastLogin: new Date().toISOString(),
        loginHistory: [
          new Date().toISOString(),
          ...(match.loginHistory ?? []),
        ].slice(0, 5),
      };

      saveSession(user);
      setAuthState({ user, isAuthenticated: true, isLoading: false });
      navigate('/dashboard', { replace: true });
      return { success: true, user };
    },
    [usersList, navigate]
  );

  // ── Register User ──

  const registerUser = useCallback(
    async (params: { employeeId: string; fullName: string; role: any; password: string }): Promise<{ success: boolean; error?: string }> => {
      const formattedEmpId = params.employeeId.trim().toUpperCase();

      if (usersList.some((u) => u.employeeId.toLowerCase() === formattedEmpId.toLowerCase())) {
        return { success: false, error: 'Employee ID is already registered.' };
      }

      const initials = params.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

      const newUser: SeededUser = {
        employeeId: formattedEmpId,
        fullName: params.fullName.trim(),
        role: params.role,
        avatarInitials: initials || 'EMP',
        password: params.password,
      };

      setUsersList((prev) => [...prev, newUser]);
      return { success: true };
    },
    [usersList]
  );

  // ── Logout (FR-003) ──

  const logout = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    clearSession();
    setAuthState({ user: null, isAuthenticated: false, isLoading: false });
    navigate('/login', { replace: true });
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, registerUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
