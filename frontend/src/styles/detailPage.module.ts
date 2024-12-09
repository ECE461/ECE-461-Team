import styled from "@emotion/styled";


export const Header = styled.header`

    display: flex;
    justify-content: center;
    align-items: center;
    padding : 20px;
    font-size: 30px;
`;

export const Container = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    flex-direction: column;
`;

export const CheckboxContainer = styled.div`
    padding-top: 20px;
    display: flex;
    
`;
export const CheckboxLabel = styled.label`
`;
export const Checkbox = styled.input`
`;

export const deleteButton = styled.button`
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
`;
export const downloadButton = styled.button`
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
`;

export const updateButton = styled.button`
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
`;

export const buttonContainer = styled.div`
    display: flex;
    justify-content: center;
    flex-direction: column;
    padding : 20px;
`;

export const table = styled.table`
    border-collapse: collapse;
    width: 100%;
    border: 1px solid #ddd;
    margin-top: 20px;
  
`;

export const td = styled.td`
    border: 1px solid #ddd;
    padding: 8px;
   
    text-align: center;
`;


export const th = styled.th`
    border: 1px solid #ddd;
    padding: 8px;
    text-align: center;
    background-color: #f2f2f2;
  
`;

export const RateContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
`;

export const RateItem = styled.div`
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px;
  background-color: #f9f9f9;
`;

export const RateKey = styled.strong`
  display: block;
  margin-bottom: 2px;
  font-weight: bold;
`;

export const RateValue = styled.p`
  margin: 0;
`;