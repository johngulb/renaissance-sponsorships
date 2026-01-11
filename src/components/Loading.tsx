import styled from "styled-components";

export const Loading = ({ text }: { text?: string }) => {
  return (
    <LoadingOverlay>
      <Spinner />
      <LoadingText>{text || "Loading..."}</LoadingText>
    </LoadingOverlay>
  );
};

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: ${({ theme }) => theme.background}e6;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const Spinner = styled.div`
  border: 4px solid ${({ theme }) => theme.border};
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border-left-color: ${({ theme }) => theme.accent};
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.h3`
  font-family: "Space Grotesk", sans-serif;
  color: ${({ theme }) => theme.text};
  margin-top: 1rem;
`;

export { LoadingOverlay, Spinner, LoadingText };
