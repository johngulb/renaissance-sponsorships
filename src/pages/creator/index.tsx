import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import styled, { keyframes } from 'styled-components';
import { useRouter } from 'next/router';
import { useUser } from '@/contexts/UserContext';
import { Loading } from '@/components/Loading';
import { CampaignCard, StatusBadge } from '@/components/shared';

interface CreatorProfile {
  id: string;
  displayName: string;
  bio?: string;
  specialties: string[];
  reputationScore: number;
  completedCampaigns: number;
}

interface Campaign {
  id: string;
  title: string;
  description?: string;
  status: string;
  startDate?: Date;
  endDate?: Date;
  compensationType: string;
  cashAmount?: number;
  creditAmount?: number;
  sponsor?: { name: string; logoUrl?: string };
  deliverables?: Array<{ status: string }>;
}

interface Offering {
  id: string;
  title: string;
  description?: string;
  basePrice?: number;
  deliverableTypes: string[];
  isActive: boolean;
}

const APP_NAME = 'Renaissance City';

const CreatorDashboard: React.FC = () => {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [isUserLoading, user, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const profileRes = await fetch(`/api/creator/profile?userId=${user.id}`);
        if (profileRes.ok) {
          const { profile: creatorProfile } = await profileRes.json();
          setProfile(creatorProfile);

          const [campaignsRes, offeringsRes] = await Promise.all([
            fetch(`/api/campaigns?creatorId=${creatorProfile.id}`),
            fetch(`/api/creator/offerings?creatorId=${creatorProfile.id}`),
          ]);

          if (campaignsRes.ok) {
            const { campaigns: campaignsList } = await campaignsRes.json();
            setCampaigns(campaignsList);
          }

          if (offeringsRes.ok) {
            const { offerings: offeringsList } = await offeringsRes.json();
            setOfferings(offeringsList);
          }
        }
      } catch (error) {
        console.error('Error fetching creator data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  if (isUserLoading || isLoading) {
    return <Loading text="Loading dashboard..." />;
  }

  if (!user) {
    return null;
  }

  if (!profile) {
    return (
      <Container>
        <Head>
          <title>Creator Setup | {APP_NAME}</title>
        </Head>
        <SetupPrompt>
          <SetupIcon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </SetupIcon>
          <SetupTitle>Create Your Creator Profile</SetupTitle>
          <SetupText>
            Set up your creator profile to start receiving sponsorship opportunities
            and connecting with local businesses.
          </SetupText>
          <SetupButton onClick={() => router.push('/creator/profile')}>
            Create Profile
          </SetupButton>
        </SetupPrompt>
      </Container>
    );
  }

  const activeCampaigns = campaigns.filter((c) => c.status === 'active');
  const pendingDeliverables = campaigns
    .filter((c) => c.status === 'active')
    .flatMap((c) => c.deliverables || [])
    .filter((d) => d.status === 'pending' || d.status === 'in_progress').length;

  const totalEarnings = campaigns
    .filter((c) => c.status === 'completed')
    .reduce((sum, c) => sum + (c.cashAmount || 0) + (c.creditAmount || 0), 0);

  return (
    <Container>
      <Head>
        <title>Creator Hub | {APP_NAME}</title>
      </Head>

      <Header>
        <HeaderContent>
          <ProfileSection>
            <ProfileAvatar>
              {user.pfpUrl ? (
                <AvatarImage src={user.pfpUrl} alt={profile.displayName} />
              ) : (
                <AvatarInitial>{profile.displayName[0].toUpperCase()}</AvatarInitial>
              )}
            </ProfileAvatar>
            <ProfileInfo>
              <ProfileName>{profile.displayName}</ProfileName>
              <ProfileMeta>
                {profile.specialties?.slice(0, 2).map((s, i) => (
                  <SpecialtyTag key={i}>{s}</SpecialtyTag>
                ))}
                {profile.reputationScore > 0 && (
                  <ReputationBadge>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    {profile.reputationScore.toFixed(1)}
                  </ReputationBadge>
                )}
              </ProfileMeta>
            </ProfileInfo>
          </ProfileSection>
          <HeaderActions>
            <ActionButton onClick={() => router.push('/creator/profile')}>
              Edit Profile
            </ActionButton>
            <PrimaryButton onClick={() => router.push('/creator/offerings')}>
              Manage Offerings
            </PrimaryButton>
          </HeaderActions>
        </HeaderContent>
      </Header>

      <Main>
        <StatsGrid>
          <StatCard>
            <StatIcon $variant="active">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </StatIcon>
            <StatContent>
              <StatValue>{activeCampaigns.length}</StatValue>
              <StatLabel>Active Campaigns</StatLabel>
            </StatContent>
          </StatCard>

          <StatCard>
            <StatIcon $variant="pending">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </StatIcon>
            <StatContent>
              <StatValue>{pendingDeliverables}</StatValue>
              <StatLabel>Pending Tasks</StatLabel>
            </StatContent>
          </StatCard>

          <StatCard>
            <StatIcon $variant="completed">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="7" />
                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
              </svg>
            </StatIcon>
            <StatContent>
              <StatValue>{profile.completedCampaigns}</StatValue>
              <StatLabel>Completed</StatLabel>
            </StatContent>
          </StatCard>

          <StatCard>
            <StatIcon $variant="earnings">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </StatIcon>
            <StatContent>
              <StatValue>${totalEarnings.toLocaleString()}</StatValue>
              <StatLabel>Total Earnings</StatLabel>
            </StatContent>
          </StatCard>
        </StatsGrid>

        <Section>
          <SectionHeader>
            <SectionTitle>Active Campaigns</SectionTitle>
            <ViewAllLink onClick={() => router.push('/creator/campaigns')}>
              View All
            </ViewAllLink>
          </SectionHeader>

          {activeCampaigns.length === 0 ? (
            <EmptyState>
              <EmptyIcon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
              </EmptyIcon>
              <EmptyText>No active campaigns yet</EmptyText>
              <EmptySubtext>
                Complete your profile and offerings to attract sponsors
              </EmptySubtext>
            </EmptyState>
          ) : (
            <CampaignGrid>
              {activeCampaigns.slice(0, 3).map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  viewAs="creator"
                />
              ))}
            </CampaignGrid>
          )}
        </Section>

        <Section>
          <SectionHeader>
            <SectionTitle>Your Offerings</SectionTitle>
            <ViewAllLink onClick={() => router.push('/creator/offerings')}>
              Manage
            </ViewAllLink>
          </SectionHeader>

          {offerings.length === 0 ? (
            <EmptyState>
              <EmptyIcon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
              </EmptyIcon>
              <EmptyText>No offerings defined yet</EmptyText>
              <EmptyAction onClick={() => router.push('/creator/offerings')}>
                Create your first offering
              </EmptyAction>
            </EmptyState>
          ) : (
            <OfferingsGrid>
              {offerings.slice(0, 3).map((offering) => (
                <OfferingCard key={offering.id}>
                  <OfferingHeader>
                    <OfferingTitle>{offering.title}</OfferingTitle>
                    <StatusBadge status={offering.isActive ? 'active' : 'cancelled'} size="small" />
                  </OfferingHeader>
                  {offering.description && (
                    <OfferingDescription>{offering.description}</OfferingDescription>
                  )}
                  <OfferingMeta>
                    {offering.basePrice && (
                      <OfferingPrice>Starting at ${offering.basePrice}</OfferingPrice>
                    )}
                    <OfferingTypes>
                      {offering.deliverableTypes?.slice(0, 2).map((t, i) => (
                        <TypeTag key={i}>{t.replace(/_/g, ' ')}</TypeTag>
                      ))}
                    </OfferingTypes>
                  </OfferingMeta>
                </OfferingCard>
              ))}
            </OfferingsGrid>
          )}
        </Section>
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
  background: ${({ theme }) => theme.background};
`;

const Header = styled.header`
  background: ${({ theme }) => theme.surface};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  padding: 1.5rem;
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const ProfileSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  animation: ${fadeIn} 0.5s ease-out;
`;

const ProfileAvatar = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid ${({ theme }) => theme.accentGold};
  background: ${({ theme }) => theme.surface};
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const AvatarInitial = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, ${({ theme }) => theme.accent}, ${({ theme }) => theme.accentGold});
  color: #fff;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.5rem;
  font-weight: 600;
`;

const ProfileInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ProfileName = styled.h1`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const ProfileMeta = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
`;

const SpecialtyTag = styled.span`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  background: ${({ theme }) => theme.backgroundAlt};
  color: ${({ theme }) => theme.textSecondary};
  border-radius: 4px;
  text-transform: capitalize;
`;

const ReputationBadge = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.accentGold};
  font-weight: 500;

  svg {
    width: 14px;
    height: 14px;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const ActionButton = styled.button`
  padding: 0.6rem 1.25rem;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  background: transparent;
  color: ${({ theme }) => theme.text};
  cursor: pointer;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.backgroundAlt};
  }
`;

const PrimaryButton = styled.button`
  padding: 0.6rem 1.25rem;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, ${({ theme }) => theme.accent}, ${({ theme }) => theme.accentGold});
  color: #fff;
  cursor: pointer;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px ${({ theme }) => theme.shadow};
  }
`;

const Main = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  animation: ${fadeIn} 0.5s ease-out;
`;

const StatIcon = styled.div<{ $variant: string }>`
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  background: ${({ $variant }) => {
    switch ($variant) {
      case 'active': return 'rgba(46, 125, 50, 0.15)';
      case 'pending': return 'rgba(239, 108, 0, 0.15)';
      case 'completed': return 'rgba(21, 101, 192, 0.15)';
      case 'earnings': return 'rgba(184, 134, 11, 0.15)';
      default: return 'rgba(107, 83, 68, 0.15)';
    }
  }};

  color: ${({ $variant }) => {
    switch ($variant) {
      case 'active': return '#2E7D32';
      case 'pending': return '#EF6C00';
      case 'completed': return '#1565C0';
      case 'earnings': return '#B8860B';
      default: return '#6B5344';
    }
  }};

  svg {
    width: 24px;
    height: 24px;
  }
`;

const StatContent = styled.div`
  display: flex;
  flex-direction: column;
`;

const StatValue = styled.span`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`;

const StatLabel = styled.span`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textSecondary};
`;

const Section = styled.section`
  margin-bottom: 2rem;
  animation: ${fadeIn} 0.5s ease-out;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const SectionTitle = styled.h2`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const ViewAllLink = styled.button`
  border: none;
  background: none;
  color: ${({ theme }) => theme.accent};
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
`;

const CampaignGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
`;

const OfferingsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
`;

const OfferingCard = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  padding: 1.25rem;
`;

const OfferingHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
`;

const OfferingTitle = styled.h3`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.05rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const OfferingDescription = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0 0 0.75rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const OfferingMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
`;

const OfferingPrice = styled.span`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 0.95rem;
  font-weight: 600;
  color: ${({ theme }) => theme.accentGold};
`;

const OfferingTypes = styled.div`
  display: flex;
  gap: 0.25rem;
`;

const TypeTag = styled.span`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.7rem;
  padding: 0.15rem 0.4rem;
  background: ${({ theme }) => theme.backgroundAlt};
  color: ${({ theme }) => theme.textSecondary};
  border-radius: 4px;
  text-transform: capitalize;
`;

const EmptyState = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px dashed ${({ theme }) => theme.border};
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
`;

const EmptyIcon = styled.div`
  width: 48px;
  height: 48px;
  margin: 0 auto 1rem;
  color: ${({ theme }) => theme.textSecondary};

  svg {
    width: 100%;
    height: 100%;
  }
`;

const EmptyText = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0;
`;

const EmptySubtext = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0.5rem 0 0;
  opacity: 0.8;
`;

const EmptyAction = styled.button`
  border: none;
  background: none;
  color: ${({ theme }) => theme.accent};
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  cursor: pointer;
  text-decoration: underline;
  margin-top: 0.75rem;
`;

const SetupPrompt = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  text-align: center;
`;

const SetupIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: linear-gradient(135deg, ${({ theme }) => theme.accent}20, ${({ theme }) => theme.accentGold}20);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  color: ${({ theme }) => theme.accentGold};

  svg {
    width: 40px;
    height: 40px;
  }
`;

const SetupTitle = styled.h1`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 2rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.75rem;
`;

const SetupText = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.textSecondary};
  max-width: 400px;
  margin: 0 0 2rem;
  line-height: 1.6;
`;

const SetupButton = styled.button`
  padding: 0.9rem 2rem;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, ${({ theme }) => theme.accent}, ${({ theme }) => theme.accentGold});
  color: #fff;
  cursor: pointer;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px ${({ theme }) => theme.shadow};
  }
`;

export default CreatorDashboard;
