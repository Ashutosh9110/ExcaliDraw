"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  email: string;
  name?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize from localStorage
  useEffect(() => {
    try {
      // Use a function to get the initial state from localStorage
      // to avoid SSR/hydration issues
      const loadUserFromStorage = () => {
        if (typeof window === 'undefined') return null;
        
        const storedUser = localStorage.getItem("user");
        if (!storedUser) return null;
        
        try {
          return JSON.parse(storedUser);
        } catch (error) {
          console.error("Failed to parse user from localStorage:", error);
          localStorage.removeItem("user");
          return null;
        }
      };
      
      const userData = loadUserFromStorage();
      if (userData) {
        setUser(userData);
      }
    } finally {
      // Always set loading to false when done
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // In a real app, make an API call to authenticate
      // This is a mock implementation
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Simulate successful login
      const mockUser = {
        id: `user-${Date.now()}`,
        email: email,
        name: email.split('@')[0]
      };
      
      setUser(mockUser);
      localStorage.setItem("user", JSON.stringify(mockUser));
    } catch (error) {
      throw new Error("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // In a real app, make an API call to register
      // This is a mock implementation
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Simulate successful signup and login
      const mockUser = {
        id: `user-${Date.now()}`,
        email: email,
        name: email.split('@')[0]
      };
      
      setUser(mockUser);
      localStorage.setItem("user", JSON.stringify(mockUser));
    } catch (error) {
      throw new Error("Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    router.push("/");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 