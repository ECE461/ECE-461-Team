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

  const {isAdmin} = useAuth();
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
          setMessage("No results found.");
        }
      } else {
        response = await A.fetchRegexResults(formattedInputs);
        if (response && response.length > 0) {
          setRegexResults(response);
          setMessage(""); // Clear message if there are results
          console.log(response);
        } else {
          setRegexResults([]);
        
          setError(response.data)
        }
      }
    } catch (error: any) {
      console.error("Full error object:", error); 

      if (error.response) {
        
        console.log("Error response:", error.response);
        console.log("Error data:", error.response.data);
        const apiMessage = error.response.data?.description || "Unknown error occurred";
        console.log("API message:", apiMessage);
        setError(apiMessage);
    } else if (error.request) {
        
        console.log("No response received:", error.request);
        setError("No response received from server.");
    } else {
       
        console.log("Error setting up request:", error.message);
        setError("Error setting up request.");
    }

    
    }
  };
  const handleChangeInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };



  return (
    <div>
       <title>search page</title>
      <S.SearchBox>
        <form onSubmit={handleSubmit}>
        <S.SearchHeader>Search Package!</S.SearchHeader>
        <S.InitialInputContainer>
          <label>Search Type:
        <S.DropdownContainer onChange={handleChangeSearchType} value={searchType}>
            <option value="Query">Query</option>
            <option value="Regex">Regex</option>
        </S.DropdownContainer>
        </label>
        
        {searchType === "Query" ? (
        <>
          <S.InputField
            placeholder="Enter name"
            value={inputs[0].name}
            onChange={(e) => handleChange(0, "name", e.target.value)}
          />
          <S.InputField
            placeholder="Enter version"
            value={(inputs[0] as QueryInput).version}
            onChange={(e) => handleChange(0, "version", e.target.value)}
          />
        </>
      ) : (
        <S.InputField
          placeholder="Enter regex pattern"
          value={inputValue}
          onChange={handleChangeInput}
        />
      )}
        </S.InitialInputContainer>
        <S.AdditionalInputContainer>
          {inputs.slice(1).map((input, index) => (
            <S.InputFieldContainer>
              {searchType === "Query" ? (
                <>
                  
                  <S.InputField
                    placeholder="Enter name"
                    value={input.name}
                    onChange={(e) => handleChange(index +1, "name", e.target.value)}
                    style={{ marginRight: "10px" }}
                  />
                  <S.InputField
                    type = "text"
                    placeholder="Enter version"
                    value={(input as QueryInput).version}
                    onChange={(e) => handleChange(index +1 , "version", e.target.value)}
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
                <S.StyledButton type="button" onClick={() => handleDeleteInput(index + 1)} >
                  Delete
                </S.StyledButton>
              )}
            </S.InputFieldContainer>
          ))}
          
          </S.AdditionalInputContainer>
         

          <S.StyledButton onClick={handleAddInput} type="button">
            Add More
          </S.StyledButton>
          <S.StyledButton type="submit">Find IDs</S.StyledButton>
        </form>
      </S.SearchBox>
     
        <div>
          <p style={{ color: "red" }}>{message}</p>
        </div>
      

      {searchType === "Query" && queryResults.length>0 &&(
        <S.ResultBox>
          <S.ResultTitle>Results</S.ResultTitle>
          <S.ResultList>
          <S.ResultItem>
            {queryResults.map((result ) => (
              <S.Result key={result.ID}
              onClick={() => handleNavigate(result.Name, result.Version, result.ID)}>
                <strong>Package Name </strong> {result.Name} <br />
                <strong>Version </strong> {result.Version} <br />
               
              </S.Result>
            ))}
          </S.ResultItem>
          </S.ResultList>
        </S.ResultBox>
      )}

      {searchType === "Regex" && regexResults.length > 0 &&(
        <S.ResultBox>
          <S.ResultTitle>Results</S.ResultTitle>
          <S.ResultList>
          <S.ResultItem>
            {regexResults.map((result) => (
              <S.Result key={result.ID } onClick={() => handleNavigate(result.Name, result.Version, result.ID)}>
                <strong>Package Name </strong> {result.Name} <br />
                <strong>Version:</strong> {result.Version} <br />
          
              </S.Result>
            ))}
          </S.ResultItem>
          </S.ResultList>
        </S.ResultBox>
      )}

      {error && (
        <S.ErrorContainer>
          {error}
        </S.ErrorContainer>
      )}
      <S.resetContainer>
        {isAdmin && (
      <S.resetButton type="button" onClick={handleReset}>
        Reset
      </S.resetButton>
        )}
      </S.resetContainer>
    </div>
  );
}
export default App;
