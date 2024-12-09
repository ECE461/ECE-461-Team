import styled from '@emotion/styled';


export const UploadContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  flex-direction: column;
`;
export const pageHeader = styled.header`
  font-size: 24px;
  display: flex;
  justify-content: center;
  padding-bottom: 10px;
`;
export const UploadBox = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  flex-direction: column;
  border: 2px dashed #ccc;
  text-align: center;
  background-color: #ffffff;
`;

export const InputField = styled.input`
  width: 100%;
  max-width: 600px;
  padding: 12px 20px;
  margin: 10px 0;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 25px;
  outline: none;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;

  &:focus {
    border-color: #0070f3;
    box-shadow: 0 2px 8px rgba(0, 112, 243, 0.2);
  }
`;

export const uploadButton = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 25px;
  background-color: #0070f3;
  color: white;
  cursor: pointer;
  font-size: 16px;
  margin-top: 10px;
  transition: all 0.2s ease;
  display: flex;
  justify-content: center;
  opacity: 1;

  &:hover {
    background-color: #005bb5;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

export const buttonContainer = styled.div` 
  display: flex;
  justify-content: center;
`
export const urlContainer = styled.div`
  display: flex;
  justify-content: center;
  padding: 20px;
`
export const urlHeader = styled.div`
  font-size: 24px;
  display: flex;
  justify-content: center;
  padding: 10px;
`
export const InputFieldContainer = styled.div` 
 display: flex;
 justify-content: center;
 padding: 20px;
//  flex-direction: column;
//  width: 100%;
//  max-width: 600px;
 `

 export const NameVersionField = styled.input`
 
  padding: 12px 20px;
  margin: 10px ;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 25px;
  outline: none;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;

  &:focus {
    border-color: #0070f3;
    box-shadow: 0 2px 8px rgba(0, 112, 243, 0.2);
  }
`;

export const updateButton = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 25px;
  background-color: #0070f3;
  color: white;
  cursor: pointer;
  font-size: 16px;
  margin: 10px;
`

export const updateCotainer = styled.div`
 display: flex;
 padding: 20px;
 flex-direction: column;
 justify-content: center;
 align-items: center;
`

export const DropdownContainer = styled.div`
  padding: 20px;
  display: flex;
  justify-content: center;

`
export const Divider = styled.div`
display: flex;
align-items: center;
width: 100%;
max-width: 600px;
margin: 15px 0;
padding: 20px;
&::before,
  &::after {
    content: "";
    flex: 1;
    border-top: 1px dashed #ccc;
  }
&::before {
  margin-right: 10px;
}

&::after {
  margin-left: 10px;
}

span {
  font-size: 18px;
  color: #666;
  text-align: center;
}
`;

export const CheckboxContainer = styled.div`
display: flex;
justify-content: center;
padding : 10px;
`;
export const CheckboxLabel = styled.label`
`;
export const Checkbox = styled.input`
   
`;