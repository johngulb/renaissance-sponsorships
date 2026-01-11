import React, { useEffect, useState } from "react";
import Head from "next/head";
import styled, { keyframes } from "styled-components";
import { useRouter } from "next/router";
import { useUser } from "@/contexts/UserContext";
import { Loading } from "@/components/Loading";
import { RoleSelector } from "@/components/shared";

// App configuration
const APP_NAME = "Renaissance City";

interface SponsorProfile {
  id: string;
  name: string;
}

interface CreatorProfile {
  id: string;
  displayName: string;
}

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const [imageError, setImageError] = useState(false);
  const [sponsorProfile, setSponsorProfile] = useState<SponsorProfile | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [isUserLoading, user, router]);

  // Fetch user profiles
  useEffect(() => {
    const fetchProfiles = async () => {
      if (!user) return;

      try {
        const [sponsorRes, creatorRes] = await Promise.all([
          fetch(`/api/sponsor/profile?userId=${user.id}`),
          fetch(`/api/creator/profile?userId=${user.id}`),
        ]);

        if (sponsorRes.ok) {
          const { profile } = await sponsorRes.json();
          setSponsorProfile(profile);
        }

        if (creatorRes.ok) {
          const { profile } = await creatorRes.json();
          setCreatorProfile(profile);
        }
      } catch (error) {
        console.error('Error fetching profiles:', error);
      } finally {
        setIsLoadingProfiles(false);
      }
    };

    if (user) {
      fetchProfiles();
    }
  }, [user]);

  // Signal to Farcaster that the app is ready
  useEffect(() => {
    const callReady = async () => {
      if (typeof window === 'undefined') return;
      
      try {
        const { sdk } = await import("@farcaster/miniapp-sdk");
        
        if (sdk && sdk.actions && typeof sdk.actions.ready === 'function') {
          await sdk.actions.ready();
        }
      } catch (error) {
        console.error('Error calling sdk.actions.ready():', error);
      }
    };

    callReady();
  }, []);

  // Show loading while checking auth
  if (isUserLoading || isLoadingProfiles) {
    return <Loading text="Loading..." />;
  }

  // Don't render anything while redirecting
  if (!user) {
    return null;
  }

  const displayName = user.username || user.displayName || `User ${user.fid}`;
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const hasSponsorProfile = !!sponsorProfile;
  const hasCreatorProfile = !!creatorProfile;
  const hasAnyProfile = hasSponsorProfile || hasCreatorProfile;

  return (
    <Container>
      <Head>
        <title>Dashboard | {APP_NAME}</title>
        <meta name="description" content={`Your ${APP_NAME} dashboard`} />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <Main>
        <DashboardHeader>
          <UserSection>
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
            <WelcomeText>
              <Greeting>Welcome, {displayName}</Greeting>
              <SubGreeting>Sponsor Management Platform</SubGreeting>
            </WelcomeText>
          </UserSection>
          <BrandMark>
            <BrandName>Renaissance City</BrandName>
          </BrandMark>
        </DashboardHeader>

        <ContentSection>
          {hasAnyProfile ? (
            <>
              <SectionTitle>Your Profiles</SectionTitle>
              <Divider />
              
              <RoleSelectorWrapper>
                <RoleSelector
                  hasSponsorProfile={hasSponsorProfile}
                  hasCreatorProfile={hasCreatorProfile}
                />
              </RoleSelectorWrapper>

              <ProfileCards>
                {hasSponsorProfile && (
                  <ProfileCard onClick={() => router.push('/sponsor')}>
                    <ProfileCardIcon $variant="sponsor">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4" />
                      </svg>
                    </ProfileCardIcon>
                    <ProfileCardContent>
                      <ProfileCardTitle>{sponsorProfile?.name}</ProfileCardTitle>
                      <ProfileCardLabel>Sponsor Profile</ProfileCardLabel>
                    </ProfileCardContent>
                    <ProfileCardArrow>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </ProfileCardArrow>
                  </ProfileCard>
                )}

                {hasCreatorProfile && (
                  <ProfileCard onClick={() => router.push('/creator')}>
                    <ProfileCardIcon $variant="creator">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </ProfileCardIcon>
                    <ProfileCardContent>
                      <ProfileCardTitle>{creatorProfile?.displayName}</ProfileCardTitle>
                      <ProfileCardLabel>Creator Profile</ProfileCardLabel>
                    </ProfileCardContent>
                    <ProfileCardArrow>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </ProfileCardArrow>
                  </ProfileCard>
                )}
              </ProfileCards>

              {(!hasSponsorProfile || !hasCreatorProfile) && (
                <AddProfileSection>
                  <AddProfileTitle>Add Another Profile</AddProfileTitle>
                  {!hasSponsorProfile && (
                    <AddProfileButton onClick={() => router.push('/sponsor/profile')}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Create Sponsor Profile
                    </AddProfileButton>
                  )}
                  {!hasCreatorProfile && (
                    <AddProfileButton onClick={() => router.push('/creator/profile')}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Create Creator Profile
                    </AddProfileButton>
                  )}
                </AddProfileSection>
              )}
            </>
          ) : (
            <>
              <OnboardingTitle>Get Started</OnboardingTitle>
              <Divider />
              <OnboardingText>
                Choose how you want to participate in the local sponsorship ecosystem.
                You can create both profiles to act as a sponsor and a creator.
              </OnboardingText>

              <OnboardingCards>
                <OnboardingCard onClick={() => router.push('/sponsor/profile')}>
                  <OnboardingCardIcon $variant="sponsor">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4" />
                    </svg>
                  </OnboardingCardIcon>
                  <OnboardingCardTitle>I&apos;m a Sponsor</OnboardingCardTitle>
                  <OnboardingCardDescription>
                    Create campaigns, connect with creators, and support your local creative community
                  </OnboardingCardDescription>
                  <OnboardingCardButton>
                    Create Sponsor Profile
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </OnboardingCardButton>
                </OnboardingCard>

                <OnboardingCard onClick={() => router.push('/creator/profile')}>
                  <OnboardingCardIcon $variant="creator">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </OnboardingCardIcon>
                  <OnboardingCardTitle>I&apos;m a Creator</OnboardingCardTitle>
                  <OnboardingCardDescription>
                    Define your offerings, receive sponsorships, and grow your creative practice
                  </OnboardingCardDescription>
                  <OnboardingCardButton>
                    Create Creator Profile
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </OnboardingCardButton>
                </OnboardingCard>
              </OnboardingCards>
            </>
          )}
        </ContentSection>
      </Main>
    </Container>
  );
};

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.background};
`;

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const DashboardHeader = styled.div`
  width: 100%;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  background: ${({ theme }) => theme.surface};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  box-shadow: 0 2px 8px ${({ theme }) => theme.shadow};
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  animation: ${fadeIn} 0.5s ease-out;
`;

const ProfileImageContainer = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid ${({ theme }) => theme.accentGold};
  background: ${({ theme }) => theme.surface};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px ${({ theme }) => theme.shadow};
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
  font-size: 1.2rem;
  font-weight: 600;
  font-family: 'Cormorant Garamond', Georgia, serif;
`;

const WelcomeText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`;

const Greeting = styled.h1`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: ${({ theme }) => theme.text};
  
  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const SubGreeting = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0;
  font-style: italic;
`;

const BrandMark = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  animation: ${fadeIn} 0.5s ease-out 0.2s both;
`;

const BrandName = styled.span`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.accent};
  letter-spacing: 0.05em;
  
  @media (max-width: 480px) {
    display: none;
  }
`;

const ContentSection = styled.section`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 2rem;
  text-align: center;
  animation: ${fadeIn} 0.6s ease-out 0.3s both;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
`;

const SectionTitle = styled.h2`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 2rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const Divider = styled.div`
  width: 60px;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    ${({ theme }) => theme.accentGold},
    transparent
  );
  margin: 1.5rem 0;
`;

const RoleSelectorWrapper = styled.div`
  margin-bottom: 2rem;
`;

const ProfileCards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 480px;
`;

const ProfileCard = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;

  &:hover {
    border-color: ${({ theme }) => theme.accent};
    box-shadow: 0 4px 16px ${({ theme }) => theme.shadow};
    transform: translateY(-2px);
  }
`;

const ProfileCardIcon = styled.div<{ $variant: 'sponsor' | 'creator' }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  background: ${({ $variant }) =>
    $variant === 'sponsor'
      ? 'rgba(158, 59, 29, 0.15)'
      : 'rgba(184, 134, 11, 0.15)'};
  
  color: ${({ $variant, theme }) =>
    $variant === 'sponsor' ? theme.accent : theme.accentGold};

  svg {
    width: 24px;
    height: 24px;
  }
`;

const ProfileCardContent = styled.div`
  flex: 1;
`;

const ProfileCardTitle = styled.h3`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.15rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const ProfileCardLabel = styled.span`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textSecondary};
`;

const ProfileCardArrow = styled.div`
  color: ${({ theme }) => theme.textSecondary};

  svg {
    width: 20px;
    height: 20px;
  }
`;

const AddProfileSection = styled.div`
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid ${({ theme }) => theme.border};
  width: 100%;
  max-width: 480px;
`;

const AddProfileTitle = styled.h3`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0 0 1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const AddProfileButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px dashed ${({ theme }) => theme.border};
  border-radius: 8px;
  background: transparent;
  color: ${({ theme }) => theme.textSecondary};
  cursor: pointer;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  margin-bottom: 0.75rem;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    border-color: ${({ theme }) => theme.accent};
    color: ${({ theme }) => theme.accent};
  }
`;

const OnboardingTitle = styled.h2`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 2.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const OnboardingText = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.textSecondary};
  max-width: 520px;
  line-height: 1.7;
  margin: 0 0 2rem;
`;

const OnboardingCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  width: 100%;
`;

const OnboardingCard = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 16px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;

  &:hover {
    border-color: ${({ theme }) => theme.accent};
    box-shadow: 0 8px 24px ${({ theme }) => theme.shadow};
    transform: translateY(-4px);
  }
`;

const OnboardingCardIcon = styled.div<{ $variant: 'sponsor' | 'creator' }>`
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.25rem;
  
  background: ${({ $variant }) =>
    $variant === 'sponsor'
      ? 'linear-gradient(135deg, rgba(158, 59, 29, 0.2), rgba(184, 134, 11, 0.2))'
      : 'linear-gradient(135deg, rgba(184, 134, 11, 0.2), rgba(158, 59, 29, 0.2))'};
  
  color: ${({ $variant, theme }) =>
    $variant === 'sponsor' ? theme.accent : theme.accentGold};

  svg {
    width: 32px;
    height: 32px;
  }
`;

const OnboardingCardTitle = styled.h3`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.75rem;
`;

const OnboardingCardDescription = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.textSecondary};
  line-height: 1.6;
  margin: 0 0 1.5rem;
`;

const OnboardingCardButton = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.95rem;
  font-weight: 500;
  color: ${({ theme }) => theme.accent};

  svg {
    width: 16px;
    height: 16px;
  }
`;

export default DashboardPage;
