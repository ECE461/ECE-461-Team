"use client";

import { Input, Button } from "@nextui-org/react";
import axios from "axios";
import React, { useEffect, useState } from "react";
import * as S from "../styles/searchPage.module"; 
import {useRouter} from 'next/router';
import Link from 'next/link';

function App() {

  const [inputs, setInputs] = useState([{ name: "", version: "" }]); // Holds multiple packages
  const [id, setId] = useState([]);
  const [error, setError] = useState(""); // For error handling
  const [isMounted, setIsMounted] = useState(false);
  const [activePage, setActivePage] = useState("search");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle input field changes
  const handleChange = (index: number, field: string, value: string) => {
    const newInputs = [...inputs];
    newInputs[index][field] = value; // Update the value of the specific field (name or version)
    setInputs(newInputs);
  };

  // Handle adding more input fields for more packages
  const handleAddInput = () => {
    setInputs([...inputs, { name: "", version: "" }]); // Adds an additional input for name and version
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setId([]);
  
    console.log(inputs);
    // Construct the payload directly without the 'packages' wrapper
    const formattedInputs = inputs.map((input) => ({
      Version: input.version,
      Name: input.name,
    }));
  
    // Log the payload for debugging
    console.log("Request Payload:", JSON.stringify(formattedInputs));
  
    try {
      // Send the payload directly as an array, no 'packages' wrapper
      const response = await axios.post("http://localhost:3000/api/v1/packages", formattedInputs, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      setId(response.data);
    } catch (error) {
      console.error("Error fetching ID:", error);
      if (error.response) {
        console.error("Response Data:", error.response.data);
        setError(`Error: ${error.response.data.message || 'ID not found for the given versions and names.'}`);
      } else {
        setError("An unknown error occurred.");
      }
    }
  };
  
  
  
  return (
    <div>
      <S.NavBar>
        <S.NavItem className={activePage === "search" ? S.active : ""}
          onClick={() => setActivePage("search")}>
          Search</S.NavItem>
        <S.NavItem>Upload</S.NavItem>
        <S.NavItem>Update</S.NavItem>
      </S.NavBar>
      <S.SearchBox>
      <form onSubmit={handleSubmit}>
        {inputs.map((input, index) => (
          <div key={index} style={{ marginBottom: "10px" }}>
            <Input
              label={`Version ${index + 1}`}
              placeholder="Enter version"
              value={input.version}
              onChange={(e) => handleChange(index, "version", e.target.value)}
            />
            <Input
              label={`Name ${index + 1}`}
              placeholder="Enter name"
              value={input.name}
              onChange={(e) => handleChange(index, "name", e.target.value)}
            />
          </div>
        ))}
        <Button onClick={handleAddInput} type="button">
          Add More
        </Button>
        <Button type="submit">Find IDs</Button>
      </form>
      </S.SearchBox>

      {id.length > 0 && (
        <div>
          <h2>Results:</h2>
          <ul>
          {id.map((result, index) => (
        <li key={index}>
         
          <strong>Name:</strong> {result.Name} <br />
          <strong>Version:</strong> {result.Version}  <br />
          <strong>ID:</strong> {result.ID} <br />
        </li>
      ))}
          </ul>
        </div>
      )}

      {error && (
        <div>
          <p style={{ color: "red" }}>{error}</p>
        </div>
      )}
     
    </div>
  );
}

export default App;
