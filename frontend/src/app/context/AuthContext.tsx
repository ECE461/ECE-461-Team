// app/context/AuthContext.tsx
"use client";

import React, { createContext, useEffect, useContext, useState } from "react";
import * as A from "../utils/api";
import { useRouter } from "next/navigation";
import { get } from "http";

interface AuthContextType {
  isAuthenticated: boolean;
  authChecked: boolean;
  username : string;
  authToken: string | null;
  isAdmin: boolean;
  login: ({ name, password ,isAdmin}: { name: string; password: string, isAdmin: boolean }) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getLocalStorage = (key: string, defaultValue: any = null) => {
  const value = localStorage.getItem(key);
  try {
    return value ? JSON.parse(value) : defaultValue; 
  } catch (error) {
    return value || defaultValue; 
  }
};

const setLocalStorage = (key: string, value: any) => {
  const isObject = typeof value === "object" && value !== null;
  localStorage.setItem(key, isObject ? JSON.stringify(value) : value);
};

const removeLocalStorage = (key: string) => {
  localStorage.removeItem(key);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [authToken, setAuthToken] =useState<string | null>(null)
  const [username, setUsername] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const storedAuth = getLocalStorage("isAuthenticated", false);
    const storedUsername = getLocalStorage("username", "");
    const storedToken = getLocalStorage("authToken", null);
    const storedIsAdmin = getLocalStorage("isAdmin", false);
    if (storedAuth && storedToken) {
      setIsAuthenticated(true);
      setUsername(storedUsername || "");
      setAuthToken(storedToken);
      setIsAdmin(storedIsAdmin);
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
      setIsAdmin(isAdmin);
      setLocalStorage("isAuthenticated", true);
      setLocalStorage("username", name);
      setLocalStorage("authToken", token);
      setLocalStorage("isAdmin",isAdmin);
  
      console.log("Login successful, token and isAdmin saved:", { token, isAdmin });
      return true;
    }
    catch(err){
      alert("Invalid credentials");
      setUsername("");
      setIsAuthenticated(false);
      setAuthToken(null);
    
      removeLocalStorage("isAuthenticated");
      removeLocalStorage("username");
      removeLocalStorage("authToken");
      removeLocalStorage("isAdmin");
      removeLocalStorage("isAdmin");
      return false;
    }
    
  };
  const logout = () => {
    setIsAuthenticated(false);
    setAuthToken(null);
    setUsername("");

    removeLocalStorage("isAuthenticated");
    removeLocalStorage("username");
    removeLocalStorage("authToken");
    removeLocalStorage("isAdmin");
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated,authChecked, isAdmin,username,authToken, login, logout }}>
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
