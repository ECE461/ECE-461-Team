// app/login/page.tsx
"use client";

import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import { useRouter } from "next/navigation";
import * as S from "../styles/loginPage.module";

const LoginPage = () => {
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("")
  const router = useRouter();
  
  const handleLogin = async () => {
    if (!name || !password) {
      setError("Please enter both name and password.");
      return;
    }

    try {
      // Call the login function from AuthContext
      const loginSuccess = await login({ name, password });
      if (loginSuccess) {
        router.push("/search"); // Redirect to search page on success
      }
      else {
        setError("Failed to log in. Please check your credentials.");
      }
    } catch (err) {
      setError("Failed to log in. Please check your credentials.");
    }
  };

  return (
    <div>
      <S.LoginContainer>
      <S.LoginHeader>Login</S.LoginHeader>
      <S.InputField placeholder ="username" type="text" value={name} onChange={(e) => setName(e.target.value)} />
      <S.InputField placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      
      <S.LoginButton onClick={handleLogin}>Login</S.LoginButton>
      
      </S.LoginContainer>
      {error && <div>{error}</div>}
    </div>
  );
};

export default LoginPage;
