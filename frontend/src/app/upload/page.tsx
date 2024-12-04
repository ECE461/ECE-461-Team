"use client";

import React, { useState } from "react";
import * as S from "../../styles/uploadPage.module"; 
import * as A from "../utils/api";


const Upload = () => {
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [jsProgram, setJsProgram] = useState("");
  const [message, setMessage] = useState("");
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

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if ( (!url && !file)) {
      setMessage("Please provide either a URL or a ZIP file.");
      return;
    }

    try {
      let data;
      if (url) {
        data = { URL: url };
      } else if (file) {
        const base64Content = await handleFileRead(file);
        data = {  Content: base64Content.split(",")[1] }; // Extract base64 string after prefix
      }
      
      const response = A.uploadPackage(data);
      setMessage("Upload successful!");
      console.log("Response:", response);
    } catch (error) {
      setMessage("Failed to upload package.");
      console.error("Upload error:", error);
    }
  };

  return (
    <S.UploadContainer>
      
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
          <input
            type="file"
            accept=".zip"
            onChange={handleFileSelect}
            style={{
              opacity: 0,
              cursor: "pointer",
            }}
          />
        </S.UploadBox>
        <S.buttonContainer>
        <S.uploadButton disabled = {isDisabled} type="submit">Upload</S.uploadButton>
        </S.buttonContainer>
      </form>
      {message && <p>{message}</p>}
    </S.UploadContainer>
  );
};

export default Upload;