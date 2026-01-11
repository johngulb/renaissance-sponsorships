import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useRouter } from 'next/router';
import { User } from '@/db/user';

interface SplashProps {
  user?: User | null;
  isLoading?: boolean;
  redirectDelay?: number;
  appName?: string;
}

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

const progressAnimation = keyframes`
  from {
    width: 0%;
  }
  to {
    width: 100%;
  }
`;

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const SplashContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.background} 0%,
    ${({ theme }) => theme.surface} 50%,
    ${({ theme }) => theme.background} 100%
  );
  z-index: 9999;
  gap: 2rem;
`;

const LogoContainer = styled.div`
  animation: ${scaleIn} 0.6s ease-out;
`;

const Logo = styled.h1`
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 4rem;
  margin: 0;
  text-align: center;
  color: ${({ theme }) => theme.text};
  
  span {
    color: ${({ theme }) => theme.accent};
  }
  
  @media (max-width: 768px) {
    font-size: 3rem;
  }
`;

const ProfileSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  animation: ${fadeIn} 0.6s ease-out 0.3s both;
`;

const ProfileImageContainer = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid ${({ theme }) => theme.accent};
  background: ${({ theme }) => theme.surface};
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px ${({ theme }) => theme.shadow};
`;

const ProfileImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const DefaultAvatar = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, ${({ theme }) => theme.accent} 0%, ${({ theme }) => theme.accent}dd 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2.5rem;
  font-weight: bold;
  font-family: 'Space Grotesk', sans-serif;
`;

const LoadingSpinner = styled.div`
  width: 80px;
  height: 80px;
  border: 4px solid ${({ theme }) => theme.border};
  border-top-color: ${({ theme }) => theme.accent};
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const WelcomeText = styled.h2`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.8rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0;
  text-align: center;
  
  @media (max-width: 768px) {
    font-size: 1.4rem;
  }
`;

const SubText = styled.p`
  font-size: 1.1rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0;
  animation: ${pulse} 2s ease-in-out infinite;
`;

const ProgressContainer = styled.div`
  width: 200px;
  height: 4px;
  background: ${({ theme }) => theme.border};
  border-radius: 2px;
  overflow: hidden;
  animation: ${fadeIn} 0.6s ease-out 0.6s both;
`;

const ProgressBar = styled.div<{ duration: number }>`
  height: 100%;
  background: ${({ theme }) => theme.accent};
  border-radius: 2px;
  animation: ${progressAnimation} ${({ duration }) => duration}ms linear forwards;
`;

const Splash: React.FC<SplashProps> = ({ 
  user, 
  isLoading = false, 
  redirectDelay = 2500,
  appName = 'App'
}) => {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Only start redirect timer when we have a user (authenticated)
  useEffect(() => {
    if (user && !isLoading) {
      setShouldRedirect(true);
      const timer = setTimeout(() => {
        router.replace('/dashboard');
      }, redirectDelay);

      return () => clearTimeout(timer);
    }
  }, [router, redirectDelay, user, isLoading]);

  const displayName = user?.username || user?.displayName || (user?.fid ? `User ${user.fid}` : '');
  const initials = displayName
    ? displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '';

  return (
    <SplashContainer>
      <LogoContainer>
        <Logo>
          {appName}
        </Logo>
      </LogoContainer>
      
      <ProfileSection>
        {user ? (
          <>
            <ProfileImageContainer>
              {user.pfpUrl && !imageError ? (
                <ProfileImage
                  src={user.pfpUrl}
                  alt={displayName}
                  onError={() => setImageError(true)}
                />
              ) : (
                <DefaultAvatar>{initials}</DefaultAvatar>
              )}
            </ProfileImageContainer>
            <WelcomeText>Welcome back, {displayName}!</WelcomeText>
            <SubText>Loading your dashboard...</SubText>
          </>
        ) : (
          <>
            <LoadingSpinner />
            <WelcomeText>Welcome to {appName}</WelcomeText>
            <SubText>{isLoading ? 'Checking authentication...' : 'Preparing your experience...'}</SubText>
          </>
        )}
      </ProfileSection>
      
      {shouldRedirect && (
        <ProgressContainer>
          <ProgressBar duration={redirectDelay} />
        </ProgressContainer>
      )}
    </SplashContainer>
  );
};

export default Splash;
