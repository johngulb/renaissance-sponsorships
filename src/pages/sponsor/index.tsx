import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import styled from 'styled-components';
import { useRouter } from 'next/router';
import { useUser } from '@/contexts/UserContext';
import { Loading } from '@/components/Loading';
import {
  Layout,
  Card,
  Stack,
  Row,
  Text,
  Button,
  Section,
  SectionHeader,
  SectionTitle,
  EmptyState,
  EmptyStateTitle,
  EmptyStateText,
  Avatar,
} from '@/components/shared';
import { CampaignCard, StatusBadge } from '@/components/shared';

interface SponsorProfile {
  id: string;
  name: string;
  industry?: string;
  location?: string;
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
        const profileRes = await fetch(`/api/sponsor/profile?userId=${user.id}`);
        if (profileRes.ok) {
          const { profile: sponsorProfile } = await profileRes.json();
          setProfile(sponsorProfile);

          const campaignsRes = await fetch(`/api/campaigns?sponsorId=${sponsorProfile.id}`);
          if (campaignsRes.ok) {
            const { campaigns: campaignsList } = await campaignsRes.json();
            setCampaigns(campaignsList);
          }

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
    return <Loading text="Loading..." />;
  }

  if (!user) {
    return null;
  }

  if (!profile) {
    return (
      <Layout title="Sponsor" showBack backHref="/dashboard">
        <Head>
          <title>Create Profile | Sponsor</title>
        </Head>
        <EmptyState>
          <SetupIcon />
          <EmptyStateTitle>Create Your Sponsor Profile</EmptyStateTitle>
          <EmptyStateText>
            Set up your business profile to start creating sponsorship campaigns.
          </EmptyStateText>
          <Button onClick={() => router.push('/sponsor/profile')}>
            Create Profile
          </Button>
        </EmptyState>
      </Layout>
    );
  }

  const activeCampaigns = campaigns.filter((c) => c.status === 'active');
  const totalCreditsIssued = credits.reduce((sum, c) => sum + c.value, 0);

  return (
    <Layout 
      title="Sponsor" 
      showBack 
      backHref="/dashboard"
      rightAction={
        <Button $size="sm" onClick={() => router.push('/sponsor/campaigns/new')}>
          + Campaign
        </Button>
      }
    >
      <Head>
        <title>Dashboard | Sponsor</title>
      </Head>

      <Stack $gap="lg">
        <ProfileCard>
          <Row $gap="md">
            <Avatar $size="lg">
              {profile.name[0].toUpperCase()}
            </Avatar>
            <ProfileInfo>
              <ProfileName>{profile.name}</ProfileName>
              <ProfileMeta>
                {profile.industry && <span>{profile.industry}</span>}
                {profile.industry && profile.location && <Dot />}
                {profile.location && <span>{profile.location}</span>}
              </ProfileMeta>
            </ProfileInfo>
            <EditButton onClick={() => router.push('/sponsor/profile')}>
              <EditIcon />
            </EditButton>
          </Row>
        </ProfileCard>

        <StatsRow>
          <StatItem>
            <StatValue>{activeCampaigns.length}</StatValue>
            <StatLabel>Active</StatLabel>
          </StatItem>
          <StatDivider />
          <StatItem>
            <StatValue>{campaigns.length}</StatValue>
            <StatLabel>Total</StatLabel>
          </StatItem>
          <StatDivider />
          <StatItem>
            <StatValue>${totalCreditsIssued.toLocaleString()}</StatValue>
            <StatLabel>Credits</StatLabel>
          </StatItem>
        </StatsRow>

        <Section>
          <SectionHeader>
            <SectionTitle>Campaigns</SectionTitle>
            <ViewAll onClick={() => router.push('/sponsor/campaigns')}>View All</ViewAll>
          </SectionHeader>
          
          {activeCampaigns.length === 0 ? (
            <EmptyCard>
              <Text $color="muted" $size="sm">No active campaigns</Text>
              <Button $variant="ghost" $size="sm" onClick={() => router.push('/sponsor/campaigns/new')}>
                Create Campaign
              </Button>
            </EmptyCard>
          ) : (
            <Stack $gap="sm">
              {activeCampaigns.slice(0, 3).map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  viewAs="sponsor"
                />
              ))}
            </Stack>
          )}
        </Section>

        <Section>
          <SectionHeader>
            <SectionTitle>Credits</SectionTitle>
            <ViewAll onClick={() => router.push('/sponsor/credits')}>Manage</ViewAll>
          </SectionHeader>
          
          {credits.length === 0 ? (
            <EmptyCard>
              <Text $color="muted" $size="sm">No credits issued</Text>
              <Button $variant="ghost" $size="sm" onClick={() => router.push('/sponsor/credits')}>
                Issue Credit
              </Button>
            </EmptyCard>
          ) : (
            <Card>
              {credits.slice(0, 5).map((credit, idx) => (
                <CreditItem key={credit.id} $last={idx === Math.min(credits.length, 5) - 1}>
                  <CreditInfo>
                    <CreditTitle>{credit.title}</CreditTitle>
                    <CreditRecipient>
                      {credit.recipient?.displayName || credit.recipient?.username || 'Unassigned'}
                    </CreditRecipient>
                  </CreditInfo>
                  <Row $gap="sm">
                    <CreditValue>${credit.value}</CreditValue>
                    <StatusBadge 
                      status={credit.status as 'active' | 'redeemed' | 'expired' | 'cancelled'} 
                      size="small" 
                    />
                  </Row>
                </CreditItem>
              ))}
            </Card>
          )}
        </Section>
      </Stack>
    </Layout>
  );
};

// Styled Components
const ProfileCard = styled(Card)`
  padding: ${({ theme }) => theme.spacing.md};
`;

const ProfileInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ProfileName = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const ProfileMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.textMuted};
  margin-top: 2px;
`;

const Dot = styled.span`
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: ${({ theme }) => theme.textMuted};
`;

const EditButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: ${({ theme }) => theme.backgroundAlt};
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;
  color: ${({ theme }) => theme.textMuted};
  transition: all 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.border};
    color: ${({ theme }) => theme.text};
  }
`;

const StatsRow = styled(Card)`
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: ${({ theme }) => theme.spacing.md};
`;

const StatItem = styled.div`
  text-align: center;
  flex: 1;
`;

const StatValue = styled.div`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`;

const StatLabel = styled.div`
  font-size: 0.6875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 2px;
`;

const StatDivider = styled.div`
  width: 1px;
  height: 32px;
  background: ${({ theme }) => theme.border};
`;

const ViewAll = styled.button`
  border: none;
  background: none;
  color: ${({ theme }) => theme.accent};
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0;

  &:hover {
    text-decoration: underline;
  }
`;

const EmptyCard = styled(Card)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.xl};
`;

const CreditItem = styled.div<{ $last?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md} 0;
  border-bottom: ${({ theme, $last }) => $last ? 'none' : `1px solid ${theme.border}`};
`;

const CreditInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
`;

const CreditTitle = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`;

const CreditRecipient = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textMuted};
`;

const CreditValue = styled.span`
  font-size: 0.9375rem;
  font-weight: 600;
  color: ${({ theme }) => theme.accent};
`;

// Icons
const SetupIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3, marginBottom: 16 }}>
    <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4" />
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export default SponsorDashboard;
