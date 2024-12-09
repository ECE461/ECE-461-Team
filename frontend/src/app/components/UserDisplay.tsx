// app/components/UserDisplay.tsx
"use client";

import React from "react";
import { useAuth } from "../context/AuthContext";
import { usePathname } from "next/navigation";
import Link from "next/link";

const UserDisplay = () => {
  const { username, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const isLoginPage = pathname === "/";

  if (!isAuthenticated || !username || isLoginPage) return null;

  return (
    <div style={{ position: "absolute", top: "10px", right: "10px", display: "flex", alignItems: "center" }}>
      <Link href="/user" aria-label="user information "style={{ marginRight: "10px", textDecoration: "none"}}>
        Hello, {username}
      </Link>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default UserDisplay;
