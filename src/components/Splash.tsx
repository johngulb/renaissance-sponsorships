import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useRouter } from 'next/router';
import { User } from '@/db/user';

interface SplashProps {
  user?: User | null;
  isLoading?: boolean;
  redirectDelay?: number;
  appName?: string;
  onCreateAccount?: () => void;
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
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
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

const floatIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 0.6;
    transform: translateY(0);
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
    165deg,
    ${({ theme }) => theme.background} 0%,
    ${({ theme }) => theme.backgroundAlt} 40%,
    ${({ theme }) => theme.background} 100%
  );
  z-index: 9999;
  gap: 2.5rem;
  overflow: hidden;

  /* Renaissance-inspired decorative corner flourishes */
  &::before,
  &::after {
    content: '❧';
    position: absolute;
    font-size: 3rem;
    color: ${({ theme }) => theme.accent};
    opacity: 0.15;
    animation: ${floatIn} 1s ease-out 0.5s both;
  }

  &::before {
    top: 2rem;
    left: 2rem;
  }

  &::after {
    bottom: 2rem;
    right: 2rem;
    transform: rotate(180deg);
  }
`;

const LogoContainer = styled.div`
  animation: ${scaleIn} 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
  text-align: center;
`;

const Logo = styled.h1`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-weight: 700;
  font-size: 3.5rem;
  margin: 0;
  text-align: center;
  color: ${({ theme }) => theme.text};
  letter-spacing: 0.02em;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const LogoAccent = styled.span`
  display: block;
  font-size: 1.1rem;
  font-weight: 500;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.accent};
  margin-top: 0.5rem;
  
  @media (max-width: 768px) {
    font-size: 0.9rem;
    letter-spacing: 0.25em;
  }
`;

const GoldBar = styled.div`
  width: 80px;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    ${({ theme }) => theme.accentGold},
    transparent
  );
  margin: 1rem auto 0;
  animation: ${fadeIn} 0.6s ease-out 0.4s both;
`;

const ProfileSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  animation: ${fadeIn} 0.6s ease-out 0.3s both;
`;

const ProfileImageContainer = styled.div`
  width: 110px;
  height: 110px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid ${({ theme }) => theme.accentGold};
  background: ${({ theme }) => theme.surface};
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 8px 32px ${({ theme }) => theme.shadow},
    inset 0 0 0 1px ${({ theme }) => theme.accent}22;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 1px solid ${({ theme }) => theme.accentGold}40;
  }
`;

const ProfileImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const DefaultAvatar = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.accent} 0%,
    ${({ theme }) => theme.accentGold} 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2.5rem;
  font-weight: 600;
  font-family: 'Cormorant Garamond', Georgia, serif;
`;

const LoadingSpinner = styled.div`
  width: 70px;
  height: 70px;
  border: 3px solid ${({ theme }) => theme.border};
  border-top-color: ${({ theme }) => theme.accentGold};
  border-radius: 50%;
  animation: ${spin} 1.2s linear infinite;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    inset: 6px;
    border: 2px solid transparent;
    border-top-color: ${({ theme }) => theme.accent};
    border-radius: 50%;
    animation: ${spin} 0.8s linear infinite reverse;
  }
`;

const WelcomeText = styled.h2`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0;
  text-align: center;
  
  @media (max-width: 768px) {
    font-size: 1.4rem;
  }
`;

const SubText = styled.p<{ $animate?: boolean }>`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0;
  animation: ${({ $animate }) => $animate ? pulse : 'none'} 2.5s ease-in-out infinite;
  font-style: italic;
`;

const CreateAccountButton = styled.button`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.15rem;
  font-weight: 600;
  padding: 1rem 2.5rem;
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.accent} 0%,
    ${({ theme }) => theme.accentGold} 100%
  );
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius};
  cursor: pointer;
  box-shadow: 
    0 4px 16px ${({ theme }) => theme.shadow},
    0 0 0 1px ${({ theme }) => theme.accentGold}40;
  transition: all 0.3s ease;
  animation: ${fadeIn} 0.6s ease-out;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 
      0 8px 24px ${({ theme }) => theme.shadow},
      0 0 0 1px ${({ theme }) => theme.accentGold}60;
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const NoAccountSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  animation: ${fadeIn} 0.6s ease-out 0.3s both;
  text-align: center;
  max-width: 320px;
`;

const NoAccountText = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1.05rem;
  color: ${({ theme }) => theme.textSecondary};
  line-height: 1.6;
  margin: 0;
`;

const ProgressContainer = styled.div`
  width: 180px;
  height: 3px;
  background: ${({ theme }) => theme.border};
  border-radius: 2px;
  overflow: hidden;
  animation: ${fadeIn} 0.6s ease-out 0.6s both;
`;

const ProgressBar = styled.div<{ duration: number }>`
  height: 100%;
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.accent},
    ${({ theme }) => theme.accentGold},
    ${({ theme }) => theme.accent}
  );
  background-size: 200% 100%;
  border-radius: 2px;
  animation: 
    ${progressAnimation} ${({ duration }) => duration}ms linear forwards,
    ${shimmer} 2s linear infinite;
`;

const Splash: React.FC<SplashProps> = ({ 
  user, 
  isLoading = false, 
  redirectDelay = 2500,
  appName = 'Renaissance City',
  onCreateAccount
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

  // Show create account when not loading and no user
  const showCreateAccount = !isLoading && !user;

  const handleCreateAccount = () => {
    if (onCreateAccount) {
      onCreateAccount();
    } else {
      // Default behavior: open Renaissance signup
      window.open('https://renaissance.city/signup', '_blank');
    }
  };

  return (
    <SplashContainer>
      <LogoContainer>
        <Logo>Renaissance City</Logo>
        <LogoAccent>Detroit&apos;s Digital Renaissance</LogoAccent>
        <GoldBar />
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
            <WelcomeText>Welcome, {displayName}</WelcomeText>
            <SubText $animate>Let&apos;s build...</SubText>
          </>
        ) : showCreateAccount ? (
          <NoAccountSection>
            <WelcomeText>Join the Renaissance</WelcomeText>
            <NoAccountText>
              Create your Renaissance account to claim your block and start building.
            </NoAccountText>
            <CreateAccountButton onClick={handleCreateAccount}>
              Create Renaissance Account
            </CreateAccountButton>
          </NoAccountSection>
        ) : (
          <>
            <LoadingSpinner />
            <WelcomeText>Welcome to {appName}</WelcomeText>
            <SubText $animate>Verifying your identity...</SubText>
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
