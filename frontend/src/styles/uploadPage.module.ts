import styled from '@emotion/styled';


export const UploadContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

export const UploadBox = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  flex-direction: column;
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