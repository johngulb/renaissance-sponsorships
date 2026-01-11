import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import styled, { keyframes } from 'styled-components';
import { useRouter } from 'next/router';
import { useUser } from '@/contexts/UserContext';
import { Loading } from '@/components/Loading';
import { CampaignCard, StatusBadge } from '@/components/shared';

interface SponsorProfile {
  id: string;
  name: string;
  industry?: string;
  description?: string;
  location?: string;
  budgetRangeMin?: number;
  budgetRangeMax?: number;
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
  creator?: { displayName: string };
  deliverables?: Array<{ status: string }>;
}

interface Credit {
  id: string;
  title: string;
  value: number;
  status: string;
  recipient?: { displayName?: string; username?: string };
}

const APP_NAME = 'Renaissance City';

const SponsorDashboard: React.FC = () => {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const [profile, setProfile] = useState<SponsorProfile | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
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
        // Fetch sponsor profile
        const profileRes = await fetch(`/api/sponsor/profile?userId=${user.id}`);
        if (profileRes.ok) {
          const { profile: sponsorProfile } = await profileRes.json();
          setProfile(sponsorProfile);

          // Fetch campaigns
          const campaignsRes = await fetch(`/api/campaigns?sponsorId=${sponsorProfile.id}`);
          if (campaignsRes.ok) {
            const { campaigns: campaignsList } = await campaignsRes.json();
            setCampaigns(campaignsList);
          }

          // Fetch credits
          const creditsRes = await fetch(`/api/credits?sponsorId=${sponsorProfile.id}`);
          if (creditsRes.ok) {
            const { credits: creditsList } = await creditsRes.json();
            setCredits(creditsList);
          }
        }
      } catch (error) {
        console.error('Error fetching sponsor data:', error);
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

  // No profile - redirect to setup
  if (!profile) {
    return (
      <Container>
        <Head>
          <title>Sponsor Setup | {APP_NAME}</title>
        </Head>
        <SetupPrompt>
          <SetupIcon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4" />
            </svg>
          </SetupIcon>
          <SetupTitle>Create Your Sponsor Profile</SetupTitle>
          <SetupText>
            Set up your business profile to start creating sponsorship campaigns
            and connecting with local creators.
          </SetupText>
          <SetupButton onClick={() => router.push('/sponsor/profile')}>
            Create Profile
          </SetupButton>
        </SetupPrompt>
      </Container>
    );
  }

  const activeCampaigns = campaigns.filter((c) => c.status === 'active');
  const totalCreditsIssued = credits.reduce((sum, c) => sum + c.value, 0);
  const activeCredits = credits.filter((c) => c.status === 'active');

  return (
    <Container>
      <Head>
        <title>Sponsor Dashboard | {APP_NAME}</title>
      </Head>

      <Header>
        <HeaderContent>
          <ProfileSection>
            <ProfileIcon>
              {profile.name[0].toUpperCase()}
            </ProfileIcon>
            <ProfileInfo>
              <ProfileName>{profile.name}</ProfileName>
              <ProfileMeta>
                {profile.industry && <span>{profile.industry}</span>}
                {profile.location && <span>{profile.location}</span>}
              </ProfileMeta>
            </ProfileInfo>
          </ProfileSection>
          <HeaderActions>
            <ActionButton onClick={() => router.push('/sponsor/profile')}>
              Edit Profile
            </ActionButton>
            <PrimaryButton onClick={() => router.push('/sponsor/campaigns/new')}>
              New Campaign
            </PrimaryButton>
          </HeaderActions>
        </HeaderContent>
      </Header>

      <Main>
        <StatsGrid>
          <StatCard>
            <StatIcon $variant="campaigns">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z" />
                <path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                <path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z" />
                <path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z" />
                <path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z" />
                <path d="M15.5 19H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z" />
                <path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z" />
                <path d="M8.5 5H10V3.5C10 2.67 9.33 2 8.5 2S7 2.67 7 3.5 7.67 5 8.5 5z" />
              </svg>
            </StatIcon>
            <StatContent>
              <StatValue>{activeCampaigns.length}</StatValue>
              <StatLabel>Active Campaigns</StatLabel>
            </StatContent>
          </StatCard>

          <StatCard>
            <StatIcon $variant="total">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </StatIcon>
            <StatContent>
              <StatValue>{campaigns.length}</StatValue>
              <StatLabel>Total Campaigns</StatLabel>
            </StatContent>
          </StatCard>

          <StatCard>
            <StatIcon $variant="credits">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </StatIcon>
            <StatContent>
              <StatValue>${totalCreditsIssued.toLocaleString()}</StatValue>
              <StatLabel>Credits Issued</StatLabel>
            </StatContent>
          </StatCard>

          <StatCard>
            <StatIcon $variant="active">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </StatIcon>
            <StatContent>
              <StatValue>{activeCredits.length}</StatValue>
              <StatLabel>Active Credits</StatLabel>
            </StatContent>
          </StatCard>
        </StatsGrid>

        <Section>
          <SectionHeader>
            <SectionTitle>Active Campaigns</SectionTitle>
            <ViewAllLink onClick={() => router.push('/sponsor/campaigns')}>
              View All
            </ViewAllLink>
          </SectionHeader>

          {activeCampaigns.length === 0 ? (
            <EmptyState>
              <EmptyIcon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                </svg>
              </EmptyIcon>
              <EmptyText>No active campaigns yet</EmptyText>
              <EmptyAction onClick={() => router.push('/sponsor/campaigns/new')}>
                Create your first campaign
              </EmptyAction>
            </EmptyState>
          ) : (
            <CampaignGrid>
              {activeCampaigns.slice(0, 3).map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  viewAs="sponsor"
                />
              ))}
            </CampaignGrid>
          )}
        </Section>

        <Section>
          <SectionHeader>
            <SectionTitle>Recent Credits</SectionTitle>
            <ViewAllLink onClick={() => router.push('/sponsor/credits')}>
              Manage Credits
            </ViewAllLink>
          </SectionHeader>

          {credits.length === 0 ? (
            <EmptyState>
              <EmptyIcon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </EmptyIcon>
              <EmptyText>No credits issued yet</EmptyText>
              <EmptyAction onClick={() => router.push('/sponsor/credits')}>
                Issue credits
              </EmptyAction>
            </EmptyState>
          ) : (
            <CreditsList>
              {credits.slice(0, 5).map((credit) => (
                <CreditItem key={credit.id}>
                  <CreditInfo>
                    <CreditTitle>{credit.title}</CreditTitle>
                    <CreditRecipient>
                      {credit.recipient?.displayName || credit.recipient?.username || 'Unassigned'}
                    </CreditRecipient>
                  </CreditInfo>
                  <CreditMeta>
                    <CreditValue>${credit.value}</CreditValue>
                    <StatusBadge status={credit.status as 'active' | 'redeemed' | 'expired' | 'cancelled'} size="small" />
                  </CreditMeta>
                </CreditItem>
              ))}
            </CreditsList>
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

const ProfileIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: linear-gradient(135deg, ${({ theme }) => theme.accent}, ${({ theme }) => theme.accentGold});
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.5rem;
  font-weight: 600;
`;

const ProfileInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
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
  gap: 0.75rem;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};

  span:not(:last-child)::after {
    content: '•';
    margin-left: 0.75rem;
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
      case 'campaigns': return 'rgba(46, 125, 50, 0.15)';
      case 'total': return 'rgba(21, 101, 192, 0.15)';
      case 'credits': return 'rgba(184, 134, 11, 0.15)';
      case 'active': return 'rgba(123, 31, 162, 0.15)';
      default: return 'rgba(107, 83, 68, 0.15)';
    }
  }};

  color: ${({ $variant }) => {
    switch ($variant) {
      case 'campaigns': return '#2E7D32';
      case 'total': return '#1565C0';
      case 'credits': return '#B8860B';
      case 'active': return '#7B1FA2';
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
  margin: 0 0 1rem;
`;

const EmptyAction = styled.button`
  border: none;
  background: none;
  color: ${({ theme }) => theme.accent};
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  cursor: pointer;
  text-decoration: underline;
`;

const CreditsList = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  overflow: hidden;
`;

const CreditItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};

  &:last-child {
    border-bottom: none;
  }
`;

const CreditInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const CreditTitle = styled.span`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`;

const CreditRecipient = styled.span`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textSecondary};
`;

const CreditMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const CreditValue = styled.span`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.accentGold};
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
  color: ${({ theme }) => theme.accent};

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

export default SponsorDashboard;
