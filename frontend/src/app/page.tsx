// app/login/page.tsx
"use client";

import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import { useRouter } from "next/navigation";

const LoginPage = () => {
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const Router = useRouter();
  const handleLogin = () => {
  
    Router.push('/search')  // Pass the credentials to the login function
  };

  return (
    <div>
      <h1>Login Page</h1>
      
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default LoginPage;
