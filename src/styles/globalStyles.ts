import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html,
  body {
    font-family: 'Crimson Pro', Georgia, 'Times New Roman', serif;
    background-color: ${props => props.theme.background};
    color: ${props => props.theme.text};
    transition: background-color 0.3s ease, color 0.3s ease;
    line-height: 1.6;
    font-size: 16px;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-weight: 600;
    line-height: 1.2;
  }

  a {
    color: ${props => props.theme.accent};
    text-decoration: none;
    transition: color 0.2s ease;
    
    &:hover {
      color: ${props => props.theme.accentGold};
    }
  }

  button {
    cursor: pointer;
    border: none;
    outline: none;
    background: none;
    font-family: 'Crimson Pro', Georgia, serif;
  }

  input, textarea {
    font-family: 'Crimson Pro', Georgia, serif;
  }

  ::selection {
    background: ${props => props.theme.accent};
    color: white;
  }
`;
