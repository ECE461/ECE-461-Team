// app/update/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useUpdateData } from "../context/UpdateContext";
import * as S from "../../styles/uploadPage.module";
import * as A from "../utils/api";

const UpdatePage = () => {
  const { name, version, id, clearUpdateData } = useUpdateData();
  const [inputName, setInputName] = useState(name || "");
  const [inputVersion, setInputVersion] = useState(version || "");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [jsProgram, setJsProgram] = useState("");
  const [message, setMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const isDisabled = !url && !file && !inputName && !inputVersion;

  
  console.log("name:", name);
  console.log("version:", version);
  console.log("ID:", id);


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
      let data;
      if (url) {
        data = { URL: url };
      } else if (file) {
        const base64Content = await handleFileRead(file);
        data = { Content: base64Content.split(",")[1] };
      }
      const requestPayload: any = {
        metadata: {
          Name: inputName,
          Version: inputVersion,
          ID: id,
        },
        data: {
          Name: inputName,
          Content: data?.Content || "",
          URL: data?.URL || "",
          debloat: true, 
          JSProgram : "",// Assuming `debloat` should always be true
        },
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
      <h1> select the package </h1>
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

      <S.updateButton onClick={handleUpdate}>Update</S.updateButton>
      </S.InputFieldContainer>
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
      {message && <p>{message}</p>}
      </S.updateCotainer>
    </div>
  );
};

export default UpdatePage;
