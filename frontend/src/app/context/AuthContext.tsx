// app/context/AuthContext.tsx
"use client";

import React, { createContext, useEffect, useContext, useState } from "react";
import * as A from "../utils/api";
import { useRouter } from "next/navigation";

interface AuthContextType {
  isAuthenticated: boolean;
  authChecked: boolean;
  username : string;
  authToken: string | null;
  login: ({ name, password ,isAdmin}: { name: string; password: string, isAdmin: boolean }) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [authToken, setAuthToken] =useState<string | null>(null)
  const [username, setUsername] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const storedAuth = localStorage.getItem("isAuthenticated") === "true";
    const storedUsername = localStorage.getItem("username");
    const storedToken = localStorage.getItem("authToken");
    if (storedAuth && storedToken) {
      setIsAuthenticated(true);
      setUsername(storedUsername || "");
      setAuthToken(storedToken);
    }
    setAuthChecked(true); 
  },[]);

  const login = async ({name,password,isAdmin }:{name: string, password: string,isAdmin:boolean}) => {
    try{
      const token = await A.createToken(name,password,isAdmin);
      if (!token ) {
        throw new Error("Invalid credentials");
      }
      setIsAuthenticated(true);
      setUsername(name);
      setAuthToken(token);
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("username", name);
      localStorage.setItem("authToken", token);
  
      return true;
    }
    catch(err){
      alert("Invalid credentials");
      setUsername("");
      setIsAuthenticated(false);
      setAuthToken(null);
    
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("username");
      localStorage.removeItem("authToken");
      return false;
    }
    
  };
  const logout = () => {
    setIsAuthenticated(false);
    setAuthToken(null);
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("username");
    localStorage.removeItem("authToken");
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated,authChecked, username,authToken, login, logout }}>
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
