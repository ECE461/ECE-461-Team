"use client";

import React, { useState } from "react";
import * as S from "../../styles/uploadPage.module"; 
import * as A from "../utils/api";


const Upload = () => {
  const [name, setName] = useState("");
  const [version, setVersion] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [jsProgram, setJsProgram] = useState("");
  const [debloat, setDebloat] = useState<boolean>(false);
  const [message, setMessage] = useState("");
  const [error,setError]= useState("");
  const [isDragging, setIsDragging] = useState(false);
  const isDisabled = !url && !file;

  const handleFileRead = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };


  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    if (selectedFile && selectedFile.type === "application/zip") {
      setFile(selectedFile);
      setUrl("");
      setMessage("");
    } else {
      setMessage("Please select a ZIP file.");
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/zip") {
      setFile(droppedFile);
      setUrl(""); // Clear the URL input if a file is dropped
    } else {
      setMessage("Please drop a ZIP file.");
    }
  };
  
  const handleDeblaotChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDebloat(event.target.checked);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !version) {
      setMessage("Please provide a name and version.");
      return;
    }
    if ( (!url && !file)) {
      setMessage("Please provide either a URL or a ZIP file.");
      return;
    }

    try {
      let requestBody: {
        Name: string;
        Version: string;
        JSProgram?: string;
        URL?: string;
        Content?: string;
        debloat: boolean;
      } = {
        Name: name,
        Version: version,
        debloat, // Boolean value
      };
  
      if (url) {
        requestBody.URL = url;
      } else if (file) {
        const base64Content = await handleFileRead(file);
        requestBody.Content =base64Content.split(",")[1] // Extract base64 string after prefix
      }
      
      if (jsProgram.trim()) {
        requestBody.JSProgram = jsProgram.trim();
      }
      
      const response = A.uploadPackage(requestBody);
      console.log("Response:", response);
    } catch (error) {
      setError(error);
      console.error("Upload error:", error);
    }
  };

  return (
    <S.UploadContainer>
      <S.pageHeader><title>Upload a Package</title></S.pageHeader>
      <S.InputFieldContainer>
        <S.NameVersionField
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          
        />

        <S.NameVersionField
          type="text"
          placeholder="Version"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
         
        />

     
      </S.InputFieldContainer>
      <form onSubmit={handleUpload}>
      <S.urlHeader>GitHub URL</S.urlHeader> 
        <S.urlContainer>
          <S.InputField
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={!!file}
            placeholder="Enter a GitHub URL"
          />
  
        </S.urlContainer>
        <S.Divider>
          <span> or </span>
        </S.Divider> 
        <label htmlFor="file-upload" style={{ cursor: "pointer" }}>
     Upload ZIP File
        </label>
        <S.UploadBox
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          style={{
            border: "2px dashed #ccc",
            padding: "20px",
            textAlign: "center",
            backgroundColor: isDragging ? "#f0f8ff" : "#ffffff",
            marginTop: "10px",
            cursor: "pointer",
          }}
        >
          {file ? (
            <p>{file.name} ready to upload</p>
          ) : (
            <p>Drag & drop a ZIP file here, or click to select</p>
          )}
          <div>
          <label htmlFor="file-upload"></label>
          <input
            type="file"
            accept=".zip"
            onChange={handleFileSelect}
            aria-label="Upload ZIP file"
            style={{
              
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              opacity: 0,
              zIndex: -1,
            }}
            
           
          />
          </div>
        </S.UploadBox>
        <S.Divider>
          <span> (optional) </span>
        </S.Divider>
        <S.InputField
            type="text"
            value={jsProgram}
            onChange={(e) => setJsProgram(e.target.value)}
            placeholder="Enter a JS program"
          />
        <S.buttonContainer>
        <label>
            <input
              type="checkbox"
              checked={debloat}
              onChange={handleDeblaotChange}
              style={{ marginRight: "5px" }}
            />
            Debloat
          </label>
        <S.uploadButton disabled = {isDisabled} type="submit">Upload</S.uploadButton>
        </S.buttonContainer>
      </form>
      {error && <p>{error}</p>}
    </S.UploadContainer>
  );
};

export default Upload;