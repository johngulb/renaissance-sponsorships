import React, { useEffect, useState } from "react";
import Head from "next/head";
import styled from "styled-components";
import { useRouter } from "next/router";
import { useUser } from "@/contexts/UserContext";
import { Loading } from "@/components/Loading";
import {
  Card,
  Stack,
  Row,
  Badge,
  Text,
  Heading,
  Spacer,
  Avatar,
  Section,
  SectionHeader,
  SectionTitle,
  EmptyState,
  EmptyStateTitle,
  EmptyStateText,
} from "@/components/shared";

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
        <title>Dashboard | Sponsorships</title>
        <meta name="description" content="Manage your sponsorships" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <Header>
        <HeaderContent>
          <Logo>Sponsorships</Logo>
        </HeaderContent>
      </Header>

      <Main>
        <UserCard>
          <Row $gap="md">
            <Avatar $size="lg">
              {user.pfpUrl && !imageError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.pfpUrl}
                  alt={displayName}
                  onError={() => setImageError(true)}
                />
              ) : (
                initials
              )}
            </Avatar>
            <Stack $gap="xs">
              <Heading $size="md">{displayName}</Heading>
              <Text $size="sm" $color="secondary">
                {hasSponsorProfile && hasCreatorProfile
                  ? 'Sponsor & Creator'
                  : hasSponsorProfile
                  ? 'Sponsor'
                  : hasCreatorProfile
                  ? 'Creator'
                  : 'New User'}
              </Text>
            </Stack>
          </Row>
        </UserCard>

        <Spacer $size="xl" />

        {hasAnyProfile ? (
          <>
            <Section>
              <SectionHeader>
                <SectionTitle>Your Profiles</SectionTitle>
              </SectionHeader>
              
              <Stack $gap="sm">
                {hasSponsorProfile && (
                  <ProfileCard onClick={() => router.push('/sponsor')}>
                    <ProfileIcon $variant="sponsor">
                      <BuildingIcon />
                    </ProfileIcon>
                    <ProfileInfo>
                      <ProfileName>{sponsorProfile?.name}</ProfileName>
                      <ProfileType>Sponsor</ProfileType>
                    </ProfileInfo>
                    <Badge $variant="success">Active</Badge>
                    <ChevronIcon />
                  </ProfileCard>
                )}

                {hasCreatorProfile && (
                  <ProfileCard onClick={() => router.push('/creator')}>
                    <ProfileIcon $variant="creator">
                      <StarIcon />
                    </ProfileIcon>
                    <ProfileInfo>
                      <ProfileName>{creatorProfile?.displayName}</ProfileName>
                      <ProfileType>Creator</ProfileType>
                    </ProfileInfo>
                    <Badge $variant="success">Active</Badge>
                    <ChevronIcon />
                  </ProfileCard>
                )}
              </Stack>
            </Section>

            {(!hasSponsorProfile || !hasCreatorProfile) && (
              <Section>
                <SectionHeader>
                  <SectionTitle>Add Profile</SectionTitle>
                </SectionHeader>
                
                <Stack $gap="sm">
                  {!hasSponsorProfile && (
                    <AddButton onClick={() => router.push('/sponsor/profile')}>
                      <PlusIcon />
                      <span>Create Sponsor Profile</span>
                    </AddButton>
                  )}
                  {!hasCreatorProfile && (
                    <AddButton onClick={() => router.push('/creator/profile')}>
                      <PlusIcon />
                      <span>Create Creator Profile</span>
                    </AddButton>
                  )}
                </Stack>
              </Section>
            )}
          </>
        ) : (
          <EmptyState>
            <WelcomeIcon />
            <EmptyStateTitle>Welcome to Sponsorships</EmptyStateTitle>
            <EmptyStateText>
              Get started by creating a profile. You can act as a sponsor, a creator, or both.
            </EmptyStateText>
            
            <Stack $gap="sm" style={{ width: '100%', maxWidth: '320px' }}>
              <RoleCard onClick={() => router.push('/sponsor/profile')}>
                <RoleIcon $variant="sponsor">
                  <BuildingIcon />
                </RoleIcon>
                <RoleContent>
                  <RoleName>Sponsor</RoleName>
                  <RoleDesc>Create campaigns & support creators</RoleDesc>
                </RoleContent>
                <ChevronIcon />
              </RoleCard>

              <RoleCard onClick={() => router.push('/creator/profile')}>
                <RoleIcon $variant="creator">
                  <StarIcon />
                </RoleIcon>
                <RoleContent>
                  <RoleName>Creator</RoleName>
                  <RoleDesc>Offer services & receive sponsorships</RoleDesc>
                </RoleContent>
                <ChevronIcon />
              </RoleCard>
            </Stack>
          </EmptyState>
        )}
      </Main>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.background};
`;

const Header = styled.header`
  background: ${({ theme }) => theme.surface};
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const HeaderContent = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
`;

const Logo = styled.h1`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const Main = styled.main`
  flex: 1;
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
  padding: ${({ theme }) => theme.spacing.lg};
`;

const UserCard = styled(Card)`
  background: ${({ theme }) => theme.surface};
`;

const ProfileCard = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.surfaceHover};
    border-color: ${({ theme }) => theme.textMuted};
  }
`;

const ProfileIcon = styled.div<{ $variant: 'sponsor' | 'creator' }>`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${({ $variant, theme }) =>
    $variant === 'sponsor' ? `${theme.accent}15` : `${theme.accentGold}15`};
  color: ${({ $variant, theme }) =>
    $variant === 'sponsor' ? theme.accent : theme.accentGold};
`;

const ProfileInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ProfileName = styled.div`
  font-size: 0.9375rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ProfileType = styled.div`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.textMuted};
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  width: 100%;
  background: transparent;
  border: 1px dashed ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  color: ${({ theme }) => theme.textSecondary};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.accent};
    color: ${({ theme }) => theme.accent};
  }
`;

const RoleCard = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.surfaceHover};
    border-color: ${({ theme }) => theme.textMuted};
  }
`;

const RoleIcon = styled.div<{ $variant: 'sponsor' | 'creator' }>`
  width: 44px;
  height: 44px;
  border-radius: ${({ theme }) => theme.radius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${({ $variant, theme }) =>
    $variant === 'sponsor' ? `${theme.accent}15` : `${theme.accentGold}15`};
  color: ${({ $variant, theme }) =>
    $variant === 'sponsor' ? theme.accent : theme.accentGold};
`;

const RoleContent = styled.div`
  flex: 1;
`;

const RoleName = styled.div`
  font-size: 0.9375rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`;

const RoleDesc = styled.div`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.textMuted};
`;

// Icons
const BuildingIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4" />
  </svg>
);

const StarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const ChevronIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const WelcomeIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export default DashboardPage;
