import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import styled from 'styled-components';
import { useRouter } from 'next/router';
import { useUser } from '@/contexts/UserContext';
import { Loading } from '@/components/Loading';
import { CampaignCard } from '@/components/shared';

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

interface CreatorProfile {
  id: string;
  displayName: string;
}

const APP_NAME = 'Renaissance City';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'draft', label: 'Pending' },
];

const CreatorCampaignsPage: React.FC = () => {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

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

          const campaignsRes = await fetch(`/api/campaigns?creatorId=${creatorProfile.id}`);
          if (campaignsRes.ok) {
            const { campaigns: campaignsList } = await campaignsRes.json();
            setCampaigns(campaignsList);
          }
        } else {
          router.push('/creator');
        }
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, router]);

  if (isUserLoading || isLoading) {
    return <Loading text="Loading campaigns..." />;
  }

  if (!user || !profile) {
    return null;
  }

  const filteredCampaigns = statusFilter === 'all'
    ? campaigns
    : campaigns.filter((c) => c.status === statusFilter);

  const stats = {
    total: campaigns.length,
    active: campaigns.filter((c) => c.status === 'active').length,
    completed: campaigns.filter((c) => c.status === 'completed').length,
    pending: campaigns.filter((c) => c.status === 'draft').length,
  };

  const totalEarnings = campaigns
    .filter((c) => c.status === 'completed')
    .reduce((sum, c) => sum + (c.cashAmount || 0) + (c.creditAmount || 0), 0);

  return (
    <Container>
      <Head>
        <title>My Campaigns | {APP_NAME}</title>
      </Head>

      <Header>
        <BackButton onClick={() => router.push('/creator')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Dashboard
        </BackButton>
        <HeaderTitle>My Campaigns</HeaderTitle>
      </Header>

      <Main>
        <StatsRow>
          <StatItem>
            <StatValue>{stats.total}</StatValue>
            <StatLabel>Total</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>{stats.active}</StatValue>
            <StatLabel>Active</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>{stats.completed}</StatValue>
            <StatLabel>Completed</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>${totalEarnings.toLocaleString()}</StatValue>
            <StatLabel>Earnings</StatLabel>
          </StatItem>
        </StatsRow>

        <Filters>
          {STATUS_FILTERS.map((filter) => (
            <FilterButton
              key={filter.value}
              $isActive={statusFilter === filter.value}
              onClick={() => setStatusFilter(filter.value)}
            >
              {filter.label}
            </FilterButton>
          ))}
        </Filters>

        {filteredCampaigns.length === 0 ? (
          <EmptyState>
            <EmptyIcon>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
            </EmptyIcon>
            <EmptyText>
              {statusFilter === 'all'
                ? 'No campaigns yet'
                : `No ${statusFilter} campaigns`}
            </EmptyText>
            <EmptySubtext>
              Complete your profile and offerings to attract sponsors
            </EmptySubtext>
          </EmptyState>
        ) : (
          <CampaignGrid>
            {filteredCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                viewAs="creator"
              />
            ))}
          </CampaignGrid>
        )}
      </Main>
    </Container>
  );
};

const Container = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.background};
`;

const Header = styled.header`
  background: ${({ theme }) => theme.surface};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border: none;
  background: none;
  color: ${({ theme }) => theme.textSecondary};
  cursor: pointer;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover {
    color: ${({ theme }) => theme.text};
  }
`;

const HeaderTitle = styled.h1`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const Main = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
`;

const StatsRow = styled.div`
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  flex-wrap: wrap;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
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

const Filters = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`;

const FilterButton = styled.button<{ $isActive: boolean }>`
  padding: 0.5rem 1rem;
  border: 1px solid ${({ $isActive, theme }) => ($isActive ? theme.accent : theme.border)};
  border-radius: 8px;
  background: ${({ $isActive, theme }) => ($isActive ? `${theme.accent}15` : 'transparent')};
  color: ${({ $isActive, theme }) => ($isActive ? theme.accent : theme.textSecondary)};
  cursor: pointer;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${({ theme }) => theme.accent};
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
  padding: 4rem 2rem;
  text-align: center;
`;

const EmptyIcon = styled.div`
  width: 56px;
  height: 56px;
  margin: 0 auto 1rem;
  color: ${({ theme }) => theme.textSecondary};

  svg {
    width: 100%;
    height: 100%;
  }
`;

const EmptyText = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const EmptySubtext = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0.5rem 0 0;
`;

export default CreatorCampaignsPage;
