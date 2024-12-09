import styled from '@emotion/styled';


export const UserContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    flex-direction: column;
    `;


export const UserHeader = styled.h1`
    font-size: 24px;
    padding: 20px;
`;

export const UserForm = styled.form`
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
    justify-content: center;
    padding: 20px;
`;
export const RegisterButton = styled.button`
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
export const RegisterHeader = styled.h2`
  font-size: 18px;
  padding : 20px;
  display: flex;
    justify-content: center;
`;

export const InputField = styled.input`
    padding: 12px 20px;
    margin: 10px;
    font-size: 16px;
    border: 1px solid #ccc;
    border-radius: 25px;
    outline: none;
    `;

export const InputFieldContainer = styled.div`
    display: flex;
    justify-content: center;
    padding: 20px;
    flex-direction: row;
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

export const ButtonContainer = styled.div`
    display: flex;
    justify-content: center;
    `;

export const CheckboxContainer = styled.div`
    display: flex;
    justify-content: center;
    padding: 20px;
    `;
export const Checkbox = styled.input`
    margin-right: 5px;
    `;