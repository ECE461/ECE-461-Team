// app/login/page.tsx
"use client";

import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import { useRouter } from "next/navigation";
import * as S from "../styles/loginPage.module";
import Head from "next/head";

const LoginPage = () => {
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("")
  const router = useRouter();
  
  const handleLogin = async () => {
    if (!name || !password) {
      setError("Please enter both name and password.");
      return;
    }

    try {
      // Call the login function from AuthContext
      const loginSuccess = await login({ name, password,isAdmin });
      if (loginSuccess) {
        router.push("/search"); // Redirect to search page on success
      }
    } catch (error:any) {
      console.error("Login failed(login page dd):", error.message); // Log the error message
      setError(error.message);
      console.log(error)
      }
    
  
  };

  return (
    <div>
      <S.LoginContainer>
      <title> login page</title>
      <S.LoginHeader>Login</S.LoginHeader>
      <S.InputField placeholder ="username" type="text" value={name} onChange={(e) => setName(e.target.value)} />
      <S.InputField placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <label style={{ display: "flex", alignItems: "center", marginTop: "10px" }}>
          <input
            type="checkbox"
            checked={isAdmin}
            onChange={(e) => setIsAdmin(e.target.checked)}
            style={{ marginRight: "5px" }}
          />
          Login as Admin
        </label>
      <S.LoginButton onClick={handleLogin} type="submit">Login</S.LoginButton>
      <div style={{ color: "red", marginTop: "10px" }}>{error}</div>
      </S.LoginContainer>
      
    </div>
  );
};

export default LoginPage;
