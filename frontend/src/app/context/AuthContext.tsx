// app/context/AuthContext.tsx
"use client";

import React, { createContext, useEffect, useContext, useState } from "react";
import { useRouter } from "next/navigation";

interface AuthContextType {
  isAuthenticated: boolean;
  authChecked: boolean;
  username : string;
  login: ({ name, password }: { name: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const storedAuth = localStorage.getItem("isAuthenticated") === "true";
    const storedUsername = localStorage.getItem("username");
    if (storedAuth) {
      setIsAuthenticated(true);
      setUsername(storedUsername || "");
    }
    setAuthChecked(true); 
  },[]);

  const login = async ({name,password }:{name: string, password: string}) => {
    // Mock authentication logic
    if (name === "chae" && password === "123") {
      setIsAuthenticated(true);
      setUsername(name);
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("username", name);
      router.push("/search"); // Redirect after successful login
    } else {
      alert("Invalid credentials");
      setUsername("");
      setIsAuthenticated(false); 
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("username");

    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("username");
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated,authChecked, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
