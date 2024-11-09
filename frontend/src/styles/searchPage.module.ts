import styled from '@emotion/styled';

export const NavBar = styled.div`
    display: flex;
    justify-content: center;
    padding-bottom : 20px;
`
export const NavItem = styled.button<{ isActive: boolean }>`
  padding: 10px 20px;
  border: none;
  background-color: ${({ isActive }) => (isActive ? '#0070f3' : '#f0f0f0')};
  color: ${({ isActive }) => (isActive ? 'white' : 'black')};
  cursor: pointer;
  font-size: 16px;
  border-radius: 0px 0px 5px 5px;
`;

export const SearchContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

export const DropdownContainer = styled.select`
  padding: 12px 20px;
  margin-right: 10px;
  border-radius: 5px;
  border: 1px solid #ccc;
  outline: none;
  font-size: 16px;
  cursor: pointer;
`;
export const SearchBox  = styled.div`
display: flex;
justify-content: center;
align-items: center;
padding: 20px;
flex-direction: column;
`

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
  flex-grow: 1;
  &:focus {
    border-color: #0070f3;
    box-shadow: 0 2px 8px rgba(0, 112, 243, 0.2);
  }
`;

export const StyledButton = styled.button`
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

  &:hover {
    background-color: #005bb5;
  }
`;

export const ResultBox = styled.div`
    display: flex;
    justify-content: center;
    flex-direction : column;
`

export const ResultTitle = styled.div`
  font-size: 24px;
  display: flex;
  justify-content: center;
  width: 80%;
  border-bottom: 1px solid black; 
  margin: 0 auto 16px auto;
  padding-bottom: 8px; 
  margin-bottom: 16px;
  padding-top : 20px;
`

export const ResultList = styled.div`
  display: flex;
  justify-content: center;

`

export const ResultItem = styled.ul`
  list-style-type: none;
  padding: 0;
  margin: 0;
`

export const Result = styled.li`
  padding : 10px;
`

export const resetContainer = styled.div`
  display: flex;
  align-items: bottom;
  // flex-direction: column;
  justify-content: bottom;
  padding : 0px 10px;
`
export const resetButton = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 25px;
  background-color: #0070f3;
  color: white;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s ease;
  display: flex;

  &:hover {
    background-color: #005bb5;
  }
`

export const InputContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`

export const InputFieldContainer = styled.div`
display: flex;
algin-items: center;
flex-direction: row;

`;

export const InitialInputContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;  
  gap: 10px;
`

export const AdditionalInputContainer = styled.div`
display: flex;
flex-direction: column;
gap: 10px;
width: 100%;

`;

export const InitialRow = styled.div`
display: flex;
  align-items: center;
  gap: 10px;
`;

