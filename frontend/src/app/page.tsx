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
        console.log(password); 
      }
      else {
        setError("Failed to log in. Please check your credentials.");
        console.log(password); 
      

      }
    } catch (err) {
      setError("Failed to log in. Please check your credentials.");
      console.log(password); 
    }
  };

  return (
    <div>
      <S.LoginContainer>
        <title> Login page </title>
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
      <S.LoginButton onClick={handleLogin}>Login</S.LoginButton>
      
      </S.LoginContainer>
      {error && <div>{error}</div>}
    </div>
  );
};

export default LoginPage;
