import styled from '@emotion/styled';


export const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  padding: 20px;
  align-items: center;
  flex-direction: column;
  height: 100vh;
`;

export const LoginHeader = styled.header`
    display: flex;
    font-size: 30px;
`;

export const LoginButton = styled.button`
padding: 10px 20px;
border: none;
border-radius: 25px;
background-color: #0070f3;
color: white;
cursor: pointer;
font-size: 16px;
margin : 10px;
margin-bottom: 40px;
transition: all 0.2s ease;
display: flex;
justify-content: center;
width: 100%;
max-width: 300px;
&:hover {
  background-color: #005bb5;
}
`;

export const InputField = styled.input`
  width: 100%;
  max-width: 300px;
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

export const ErrorMessage = styled.div`
 
`;
