// app/components/NavBar.tsx
"use client";

import React from "react";
import Link from "next/link";
import * as S from "../../styles/searchPage.module";
import { usePathname } from "next/navigation";

const NavBar = () => {
  const pathname = usePathname();

  const isLoginPage = pathname === "/";

  if (isLoginPage) return null;
  return (
    
    <S.NavBar>
      <Link href="/search" aria-label="Search the package" >
        <S.NavItem isActive={pathname.includes("/search")}>Search</S.NavItem>
      </Link>
      <Link href="/upload" arira-label=" upload the package" >
        <S.NavItem isActive={pathname.includes("/upload")}>Upload</S.NavItem>
      </Link>
      <Link href="/update" aria-label="update the package">
        <S.NavItem isActive={pathname.includes("/update")}>Update</S.NavItem>
      </Link>
    </S.NavBar>
  );
};

export default NavBar;
