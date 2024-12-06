"use client";

import React from "react";
import { useAuth } from "../context/AuthContext";

const UserPage = () => {

    const { username } = useAuth();
  return (
    <div style={{ padding: "20px" }}>
      <h1>User Page</h1>
      <p>Welcome ,{username}!</p>
    </div>
  );
};

export default UserPage;