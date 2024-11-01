// app/layout.tsx
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import * as S from "../styles/searchPage.module"; 
import { usePathname } from 'next/navigation';
import '../styles/globals.css';
import { AuthProvider,  } from "./context/AuthContext";
import router from 'next/router';
import ProtectedRoute from './components/ProtectedRoute';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname(); // Get the current pathname
  const [isMounted, setIsMounted] = useState(false);

  
  useEffect(() => {
    setIsMounted(true);
  }, []);


  return (
    <AuthProvider>
      <ProtectedRoute>
    <html lang="en">
      <head>
      </head>
      <body>
      {isMounted && pathname !== '/' && (
        <S.NavBar>
          <Link href="/search" passHref>
            <S.NavItem  isActive={isMounted && pathname.includes("/search")}>
              Search
            </S.NavItem>
          </Link>
          <Link href="/upload" passHref>
            <S.NavItem  isActive={isMounted && pathname.includes("/upload")}>
              Upload
            </S.NavItem>
          </Link>
          <Link href="/update" passHref>
            <S.NavItem  isActive={isMounted && pathname.includes("/update")}>
              Update
            </S.NavItem>
          </Link>
        </S.NavBar>)}
        <main>{children}</main>
      </body>
    </html>
    </ProtectedRoute>
    </AuthProvider>
  );
};

export default Layout;