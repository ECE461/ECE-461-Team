// app/update/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useUpdateData } from "../context/UpdateContext";
import * as S from "../../styles/uploadPage.module";
import * as A from "../utils/api";
import {useId} from "../context/IdContext";

const UpdatePage = () => {
  const { name, version, id, clearUpdateData } = useUpdateData();
  const [inputName, setInputName] = useState(name || "");
  const [inputVersion, setInputVersion] = useState(version || "");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [jsProgram, setJsProgram] = useState("");
  const [message, setMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [newVersion, setNewVersion] = useState("");
  const [debloat, setDebloat] = useState<boolean>(false);
  const isDisabled = !url && !file && !inputName && !inputVersion;


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
      setUrl(""); 
    } else {
      setMessage("Please drop a ZIP file.");
    }
  };

  const handleDeblaotChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDebloat(event.target.checked);
  };
  const handleUpdate = async () => {
    if (!inputName || !inputVersion) {
      setMessage("Please provide a name and version.");
      return;
    }
    else if (!url && !file) {
      setMessage("Please provide either a URL or a ZIP file.");
      return;
    }
    try {
      let data: { URL?: string; Content?: string } = {};
      if (url) {
        data = { URL: url };
      } else if (file) {
        const base64Content = await handleFileRead(file);
        data = { Content: base64Content.split(",")[1] };
      }

      const requestData = {
        Name: inputName,
        Version : newVersion,
        ...data,
        debloat: true,
        ...(jsProgram ? { JSProgram: jsProgram } : {}), 
      };
      const requestPayload = {
        metadata: {
          Name: inputName,
          Version: inputVersion,
          ID: id,
        },
        data: requestData,
      };  
    
      console.log("Request payload:", requestPayload);
      const response = A.updatePackageByID(id!, requestPayload);
      console.log("Response:", response);
      clearUpdateData();
    } catch (error) {
      setMessage("Failed to update package.");
    }
  };
  

  return (
    <div>
      <S.updateCotainer>
      <h1> Type package you want to update </h1>
      <S.InputFieldContainer>
        <S.NameVersionField
          type="text"
          placeholder="Name"
          value={inputName}
          onChange={(e) => setInputName(e.target.value)}
          readOnly={!!name} 
        />

        <S.NameVersionField
          type="text"
          placeholder="Version"
          value={inputVersion}
          onChange={(e) => setInputVersion(e.target.value)}
          readOnly={!!version} 
        />

      <S.updateButton onClick={handleUpdate} disabled = {isDisabled}>Update</S.updateButton>
      </S.InputFieldContainer>
      <S.NameVersionField
          type="text"
          placeholder="Version"
          value={newVersion}
          onChange={(e) => setNewVersion(e.target.value)}
          
        />
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
      {/* <S.DropdownContainer> */}
      <S.UploadBox
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}

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
      {/* </S.DropdownContainer> */}
      <S.Divider>
          <span> (optional) </span>
        </S.Divider>
        <S.InputField
            type="text"
            value={jsProgram}
            onChange={(e) => setJsProgram(e.target.value)}
            placeholder="type a JS program"
          />
          <label>
            <input
              type="checkbox"
              checked={debloat}
              onChange={handleDeblaotChange}
              style={{ marginRight: "5px" }}
            />
            Debloat
          </label>
       
      {message && <p>{message}</p>}
      </S.updateCotainer>
    </div>
  );
};

export default UpdatePage;
