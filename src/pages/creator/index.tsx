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
    return <Loading text="Loading..." />;
  }

  if (!user) {
    return null;
  }

  if (!profile) {
    return (
      <Layout title="Creator" showBack backHref="/dashboard">
        <Head>
          <title>Create Profile | Creator</title>
        </Head>
        <EmptyState>
          <SetupIcon />
          <EmptyStateTitle>Create Your Creator Profile</EmptyStateTitle>
          <EmptyStateText>
            Set up your profile to start receiving sponsorship opportunities.
          </EmptyStateText>
          <Button onClick={() => router.push('/creator/profile')}>
            Create Profile
          </Button>
        </EmptyState>
      </Layout>
    );
  }

  const activeCampaigns = campaigns.filter((c) => c.status === 'active');
  const pendingTasks = campaigns
    .filter((c) => c.status === 'active')
    .flatMap((c) => c.deliverables || [])
    .filter((d) => d.status === 'pending' || d.status === 'in_progress').length;

  const totalEarnings = campaigns
    .filter((c) => c.status === 'completed')
    .reduce((sum, c) => sum + (c.cashAmount || 0) + (c.creditAmount || 0), 0);

  return (
    <Layout 
      title="Creator" 
      showBack 
      backHref="/dashboard"
      rightAction={
        <Button $size="sm" onClick={() => router.push('/creator/offerings')}>
          Offerings
        </Button>
      }
    >
      <Head>
        <title>Dashboard | Creator</title>
      </Head>

      <Stack $gap="lg">
        <ProfileCard>
          <Row $gap="md">
            <Avatar $size="lg">
              {user.pfpUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.pfpUrl} alt={profile.displayName} />
              ) : (
                profile.displayName[0].toUpperCase()
              )}
            </Avatar>
            <ProfileInfo>
              <ProfileName>{profile.displayName}</ProfileName>
              <ProfileMeta>
                {profile.specialties?.slice(0, 2).map((s, i) => (
                  <SpecialtyTag key={i}>{s}</SpecialtyTag>
                ))}
                {profile.reputationScore > 0 && (
                  <StarRating>
                    <StarIcon />
                    {profile.reputationScore.toFixed(1)}
                  </StarRating>
                )}
              </ProfileMeta>
            </ProfileInfo>
            <EditButton onClick={() => router.push('/creator/profile')}>
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
            <StatValue>{pendingTasks}</StatValue>
            <StatLabel>Tasks</StatLabel>
          </StatItem>
          <StatDivider />
          <StatItem>
            <StatValue>${totalEarnings.toLocaleString()}</StatValue>
            <StatLabel>Earned</StatLabel>
          </StatItem>
        </StatsRow>

        <Section>
          <SectionHeader>
            <SectionTitle>Campaigns</SectionTitle>
            <ViewAll onClick={() => router.push('/creator/campaigns')}>View All</ViewAll>
          </SectionHeader>
          
          {activeCampaigns.length === 0 ? (
            <EmptyCard>
              <Text $color="muted" $size="sm">No active campaigns</Text>
              <Text $color="muted" $size="sm">Complete your profile to attract sponsors</Text>
            </EmptyCard>
          ) : (
            <Stack $gap="sm">
              {activeCampaigns.slice(0, 3).map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  viewAs="creator"
                />
              ))}
            </Stack>
          )}
        </Section>

        <Section>
          <SectionHeader>
            <SectionTitle>Offerings</SectionTitle>
            <ViewAll onClick={() => router.push('/creator/offerings')}>Manage</ViewAll>
          </SectionHeader>
          
          {offerings.length === 0 ? (
            <EmptyCard>
              <Text $color="muted" $size="sm">No offerings defined</Text>
              <Button $variant="ghost" $size="sm" onClick={() => router.push('/creator/offerings')}>
                Create Offering
              </Button>
            </EmptyCard>
          ) : (
            <Stack $gap="sm">
              {offerings.slice(0, 3).map((offering) => (
                <OfferingItem key={offering.id}>
                  <OfferingInfo>
                    <OfferingTitle>{offering.title}</OfferingTitle>
                    {offering.description && (
                      <OfferingDesc>{offering.description}</OfferingDesc>
                    )}
                  </OfferingInfo>
                  <Row $gap="sm">
                    {offering.basePrice && (
                      <OfferingPrice>${offering.basePrice}</OfferingPrice>
                    )}
                    <StatusBadge 
                      status={offering.isActive ? 'active' : 'cancelled'} 
                      size="small" 
                    />
                  </Row>
                </OfferingItem>
              ))}
            </Stack>
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
  flex-wrap: wrap;
  margin-top: 4px;
`;

const SpecialtyTag = styled.span`
  font-size: 0.6875rem;
  padding: 2px 6px;
  background: ${({ theme }) => theme.backgroundAlt};
  color: ${({ theme }) => theme.textSecondary};
  border-radius: ${({ theme }) => theme.radius.sm};
  text-transform: capitalize;
`;

const StarRating = styled.span`
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${({ theme }) => theme.accentGold};
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

const OfferingItem = styled(Card)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md};
`;

const OfferingInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const OfferingTitle = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`;

const OfferingDesc = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textMuted};
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const OfferingPrice = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.accent};
`;

// Icons
const SetupIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3, marginBottom: 16 }}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const StarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export default CreatorDashboard;
