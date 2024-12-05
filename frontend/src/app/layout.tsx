// app/layout.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import * as S from "../styles/searchPage.module";
import { usePathname } from "next/navigation";
import "../styles/globals.css";
import { AuthProvider } from "./context/AuthContext";
import { IdProvider } from "./context/IdContext";
import { UpdateProvider } from "./context/UpdateContext";
import ProtectedRoute from "./components/ProtectedRoute";
import UserDisplay from "./components/UserDisplay";
import NavBar from "./components/NavBar";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname(); 
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);


 
  return (
    <AuthProvider>
      <IdProvider>
        <UpdateProvider>
        <html lang="en">
          <head />
          <body>
            {isMounted && (
              <>
                <ProtectedRoute>
                  <NavBar />
                  <main>
                    <UserDisplay />
                    {children}
                  </main>
                </ProtectedRoute>
              </>
            )}
          </body>
        </html>
        </UpdateProvider>
      </IdProvider>
    </AuthProvider>
  );
};

export default Layout;