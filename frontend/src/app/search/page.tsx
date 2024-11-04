"use client";

import React, { useEffect, useState } from "react";
import * as S from "../../styles/searchPage.module"; 
import {usePathname,useRouter} from 'next/navigation';
import * as A from "../utils/api";
import { useId } from "../context/IdContext";
import {useAuth} from "../context/AuthContext"; 

type QueryInput = { name: string; version: string };
type RegexInput = { name: string };
type InputType = QueryInput | RegexInput;

function App() {

  const [inputs, setInputs] =useState<InputType[]>([{ name: "", version: "" }]);  // Holds multiple packages
  const [error, setError] = useState(""); // For error handling
  const [message , setMessage] = useState(""); // For message handling
  const [queryResults, setQueryResults] = useState<any[]>([]); 
  const [regexResults, setRegexResults] = useState<any[]>([]);
  const pathname = usePathname(); // Get the current pathname
  const [currentPage, setCurrentPage] = useState("");
  const [searchType, setSearchType] = useState<"Query" | "Regex">("Query");
  const [inputValue, setInputValue] = useState("");
  const {setId} = useId();
  const isDisabled = !inputs.some((input) => input.name); 
  const router = useRouter();


  useEffect(() => {
    if (pathname === "/") {
      setCurrentPage("search");
    } else if (pathname.includes("/upload")) {
      setCurrentPage("upload");
    } else if (pathname.includes("/update")) {
      setCurrentPage("update");
    }
  }, [pathname]);



  const handleNavigate = (name: string, version: string, id: string) => {
    setId(id);
    router.push(`/details/${name}/${version}`);
  };

  // Handle input field changes
  const handleChange = (index: number, field: string, value: string) => {
    const newInputs = [...inputs];
    newInputs[index][field] = value; // Update the value of the specific field (name or version)
    setInputs(newInputs);
  };

  const handleChangeSearchType = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchType(event.target.value as "Query" | "Regex");
    setInputValue(""); // Reset input when changing search type
    setInputs([{ name: "", version: "" }]);
    setMessage("");
  };

  const handleAddInput = () => {
    if (searchType === "Query") {
    setInputs([...inputs, { name: "", version: "" }]);
    }
    else {
      setInputs([...inputs, { name: "" }]); // Adds an additional input for Regex (name only)
    } 
  };

  const handleDeleteInput = (index: number) => {
    if (inputs.length > 1) { 
      const newInputs = [...inputs];
      newInputs.splice(index, 1); 
      setInputs(newInputs);
    }
  };
  const handleReset = async() => {

    try{
      const response = await A.resetPackage();
      console.log("Reset response:", response);
      setMessage(response.message)
    }
    catch (error: any) {
      console.error("Error deleting items:", error);
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message); // Display the error message from API
      } else {
        setError("An error occurred while resetting. Please try again.");
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");

    let formattedInputs;
    if (searchType === "Query") {
      formattedInputs = (inputs as QueryInput[]).map((input) => ({
        Version: input.version,
        Name: input.name,
      }));
    } else {
      // Construct the payload for Regex type (only one input)
      formattedInputs = { RegEx: inputValue.trim()};
    }
  

    console.log("Request Payload:", JSON.stringify(formattedInputs));
  
    try {
      let response;
      if (searchType === "Query") {
        response = await A.fetchQueryResults(formattedInputs);
        if (response && response.length > 0) {
          setQueryResults(response);
          setMessage(""); // Clear message if there are results
        } else {
          setQueryResults([]);
          // setMessage(response.message);
        }
      } else {
        response = await A.fetchRegexResults(formattedInputs);
        if (response && response.length > 0) {
          setRegexResults(response);
          setMessage(""); // Clear message if there are results
          console.log(response);
        } else {
          setRegexResults([]);
        
          // setMessage("No matching results for the regex pattern.");
        }
      }
    } catch (error: any) {
      console.error("Error fetching results:", error);
      // Check if the error response has a message matching the API response for missing fields or invalid token
      if (error.response && error.response.data && error.response.data.message) {
        const apiMessage = error.response.data.message;
        if (apiMessage.includes("There is missing field(s) in the PackageQuery/AuthenticationToken or it is formed improperly, or the AuthenticationToken is invalid.")) {
          setMessage(apiMessage);
        } else {
          setError(`Error: ${apiMessage}`);
        }
      } else {
        setError("An unknown error occurred.");
      }
    }
  };
  const handleChangeInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };



  return (
    <div>
      <S.SearchBox>
        <form onSubmit={handleSubmit}>
        <S.DropdownContainer onChange={handleChangeSearchType} value={searchType}>
            <option value="Query">Query</option>
            <option value="Regex">Regex</option>
        </S.DropdownContainer>

          {inputs.map((input, index) => (
            <div key={index} style={{ marginBottom: "10px", display: "flex", alignItems: "center" }}>
              {searchType === "Query" ? (
                <>
                  
                  <S.InputField
                    placeholder="Enter name"
                    value={input.name}
                    onChange={(e) => handleChange(index, "name", e.target.value)}
                    style={{ marginRight: "10px" }}
                  />
                  <S.InputField
                    type = "text"
                    placeholder="Enter version"
                    value={(input as QueryInput).version}
                    onChange={(e) => handleChange(index, "version", e.target.value)}
                    style={{ marginRight: "10px" }}
                  />
                </>
              ) : (
                <S.InputField
                  
                  placeholder="Enter regex pattern"
                  value={inputValue}
                  onChange={handleChangeInput}
                  style={{ marginRight: "10px" }}
                />
              )}
              {inputs.length > 1 && (
                <S.StyledButton type="button" onClick={() => handleDeleteInput(index)} >
                  Delete
                </S.StyledButton>
              )}
            </div>
          ))}

          <S.StyledButton onClick={handleAddInput} type="button">
            Add More
          </S.StyledButton>
          <S.StyledButton type="submit">Find IDs</S.StyledButton>
        </form>
      </S.SearchBox>
     
        <div>
          <p style={{ color: "red" }}>{message}</p>
        </div>
      

      {searchType === "Query" && (
        <S.ResultBox>
          <S.ResultTitle>Results</S.ResultTitle>
          <S.ResultList>
          <S.ResultItem>
            {queryResults.map((result: any, index: number) => (
              <S.Result key={index}
              onClick={() => handleNavigate(result.Name, result.Version, result.ID)}>
                <strong>Name:</strong> {result.Name} <br />
                <strong>Version:</strong> {result.Version} <br />
               
              </S.Result>
            ))}
          </S.ResultItem>
          </S.ResultList>
        </S.ResultBox>
      )}

      {searchType === "Regex" && (
        <S.ResultBox>
          <S.ResultTitle>Results</S.ResultTitle>
          <S.ResultList>
          <S.ResultItem>
            {regexResults.map((result: any, index: number) => (
              <S.Result key={index} onClick={() => handleNavigate(result.Name, result.Version, result.ID)}>
                <strong>Name:</strong> {result.Name} <br />
                <strong>Version:</strong> {result.Version} <br />
          
              </S.Result>
            ))}
          </S.ResultItem>
          </S.ResultList>
        </S.ResultBox>
      )}

      {error && (
        <div>
          <p style={{ color: "red" }}>{error}</p>
        </div>
      )}
      <S.resetContainer>
      <S.resetButton type="button" onClick={handleReset}>
        Reset
      </S.resetButton>
      </S.resetContainer>
    </div>
  );
}
export default App;
