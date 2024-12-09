"use client";

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import * as A from "../utils/api";
import * as S from "../../styles/userPage.module";
const UserPage = () => {

  const { username ,isAdmin} = useAuth();

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [newUserIsAdmin, setNewUserIsAdmin] = useState(false);
  const [message, setMessage] = useState("");

  const handleRegisterUser = async () => {
    if (password.length < 8) {
      setMessage("Password must be at least 8 characters long.");
      return;
    }
    try{
      const userData = {
        name,
        password,
        isAdmin:newUserIsAdmin
      }
      const response = await A.registerUser(userData);
      setMessage(`User ${name} registered successfully!`);
      console.log("Registration response:", response);
    }catch (error) {
      setMessage("Failed to register user.");
      console.error("Registration error:", error);
    }
   
  };
  return (
    <S.UserContainer>
      <title> User Page </title>
      <S.UserHeader>User Page</S.UserHeader>
      <p>Welcome, {username}!</p>

      {/* Admin-only section */}
      {isAdmin && (
        <div style={{ marginTop: "20px" }}>
          <S.RegisterHeader>Register New User</S.RegisterHeader>
          <S.InputFieldContainer>
          <S.InputField
            type="text"
            placeholder="Enter username"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ display: "block", marginBottom: "10px" }}
          />
          <S.InputField
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: "block", marginBottom: "10px" }}
          />
          <S.CheckboxContainer>
          <label>
            <S.Checkbox
              type="checkbox"
              checked={newUserIsAdmin}
              onChange={(e) => setNewUserIsAdmin(e.target.checked)}
              
            />
            Is Admin
          </label>
          </S.CheckboxContainer>
          </S.InputFieldContainer>
          <S.ButtonContainer>
          <S.StyledButton onClick={handleRegisterUser} >
            Register User
          </S.StyledButton>
          </S.ButtonContainer>
          {message && <p>{message}</p>}
        </div>
      )}
    </S.UserContainer>
  );
};

export default UserPage;