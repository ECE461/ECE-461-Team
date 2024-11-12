// app/components/UserDisplay.tsx
"use client";

import React from "react";
import { useAuth } from "../context/AuthContext";
import { usePathname } from "next/navigation";

const UserDisplay = () => {
  const { username, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const isLoginPage = pathname === "/";

  if (!isAuthenticated || !username || isLoginPage) return null;

  return (
    <div style={{ position: "absolute", top: "10px", right: "10px", display: "flex", alignItems: "center" }}>
      <p style={{ marginRight: "10px" }}>Hello, {username}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default UserDisplay;
