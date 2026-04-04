import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/utils/api";

export type UserRole = "admin" | "hotel_owner" | "hotel_manager";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  hotelId: number | null;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  planExpired: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [planExpired, setPlanExpired] = useState(false);

  useEffect(() => {
    (async () => {
      // Tokens are handled by cookies now; we only restore local user metadata
      const storedUser = await AsyncStorage.getItem("auth_user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setIsLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ user: User; planExpired: boolean }>(
      "/auth/login",
      { email, password }
    );

    await AsyncStorage.setItem("auth_user", JSON.stringify(res.user));
    setUser(res.user);
    setPlanExpired(res.planExpired);
  };

  const logout = async () => {
    try {
      // Call the server to destroy the session instantly
      await api.post("/auth/logout", {});
    } catch {
      // Ignore network errors on logout, proceed to clear local state
    }

    await AsyncStorage.removeItem("auth_user");
    setUser(null);
    setPlanExpired(false);
  };

  const refreshUser = async () => {
    try {
      const userData = await api.get<User>("/auth/me");
      setUser(userData);
      await AsyncStorage.setItem("auth_user", JSON.stringify(userData));
    } catch {
      // If /me fails (e.g., cookie expired), clear the local user state
      await logout();
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, planExpired, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}