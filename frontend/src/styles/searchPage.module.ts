import styled from '@emotion/styled';

export const NavBar = styled.div`
    display: flex;
    justify-content: center;
`
export const NavItem = styled.button`

    padding: 10px;
    border-radius: 5px;
    border: none;
    background-color: #f0f0f0;
    cursor: pointer;
    font-size: 16px;
    &:hover {
        color: #0070f3;
    }
    
`

export const SearchBox  = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    padding : 20px;
    `

    export const active = `
  color: #0070f3;
  font-weight: bold;
`;