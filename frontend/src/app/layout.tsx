// app/layout.tsx
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import * as S from "../styles/searchPage.module"; 
import { usePathname } from 'next/navigation';
import '../styles/globals.css';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname(); // Get the current pathname
  const [isMounted, setIsMounted] = useState(false);

  // Set isMounted to true when the component is mounted
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <html lang="en">
      <head>
      </head>
      <body>
        <S.NavBar>
          <Link href="/" passHref>
            <S.NavItem  isActive={isMounted && pathname === "/"}>
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
        </S.NavBar>
        <main>{children}</main>
      </body>
    </html>
  );
};

export default Layout;