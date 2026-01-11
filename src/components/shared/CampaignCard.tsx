import React from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/router';
import { StatusBadge } from './StatusBadge';

interface CampaignCardProps {
  campaign: {
    id: string;
    title: string;
    description?: string | null;
    status: string;
    startDate?: Date | null;
    endDate?: Date | null;
    compensationType: string;
    cashAmount?: number | null;
    creditAmount?: number | null;
    sponsor?: {
      name: string;
      logoUrl?: string | null;
    } | null;
    creator?: {
      displayName: string;
    } | null;
    deliverables?: Array<{ status: string }>;
  };
  viewAs: 'sponsor' | 'creator';
  onClick?: () => void;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign,
  viewAs,
  onClick,
}) => {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/${viewAs}/campaigns/${campaign.id}`);
    }
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return null;
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getCompensationDisplay = () => {
    const parts = [];
    if (campaign.cashAmount) {
      parts.push(`$${campaign.cashAmount.toLocaleString()}`);
    }
    if (campaign.creditAmount) {
      parts.push(`${campaign.creditAmount} credits`);
    }
    return parts.join(' + ') || 'TBD';
  };

  const getProgress = () => {
    if (!campaign.deliverables || campaign.deliverables.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }
    const completed = campaign.deliverables.filter(
      (d) => d.status === 'verified'
    ).length;
    const total = campaign.deliverables.length;
    return { completed, total, percentage: Math.round((completed / total) * 100) };
  };

  const progress = getProgress();

  return (
    <Card onClick={handleClick}>
      <CardHeader>
        <TitleSection>
          <Title>{campaign.title}</Title>
          <StatusBadge status={campaign.status as 'draft' | 'active' | 'completed' | 'disputed' | 'cancelled'} />
        </TitleSection>
        {viewAs === 'creator' && campaign.sponsor && (
          <SponsorInfo>
            {campaign.sponsor.logoUrl ? (
              <SponsorLogo src={campaign.sponsor.logoUrl} alt={campaign.sponsor.name} />
            ) : (
              <SponsorInitial>{campaign.sponsor.name[0]}</SponsorInitial>
            )}
            <SponsorName>{campaign.sponsor.name}</SponsorName>
          </SponsorInfo>
        )}
        {viewAs === 'sponsor' && campaign.creator && (
          <CreatorInfo>
            <CreatorName>{campaign.creator.displayName}</CreatorName>
          </CreatorInfo>
        )}
      </CardHeader>

      {campaign.description && (
        <Description>{campaign.description}</Description>
      )}

      <MetaGrid>
        <MetaItem>
          <MetaIcon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </MetaIcon>
          <MetaText>
            {formatDate(campaign.startDate) || 'TBD'}
            {campaign.endDate && ` - ${formatDate(campaign.endDate)}`}
          </MetaText>
        </MetaItem>

        <MetaItem>
          <MetaIcon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </MetaIcon>
          <MetaText>{getCompensationDisplay()}</MetaText>
        </MetaItem>
      </MetaGrid>

      {progress.total > 0 && (
        <ProgressSection>
          <ProgressHeader>
            <ProgressLabel>Deliverables</ProgressLabel>
            <ProgressCount>
              {progress.completed} / {progress.total}
            </ProgressCount>
          </ProgressHeader>
          <ProgressBar>
            <ProgressFill $percentage={progress.percentage} />
          </ProgressBar>
        </ProgressSection>
      )}

      <CardFooter>
        <ViewButton>
          View Details
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </ViewButton>
      </CardFooter>
    </Card>
  );
};

const Card = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${({ theme }) => theme.accent};
    box-shadow: 0 4px 16px ${({ theme }) => theme.shadow};
    transform: translateY(-2px);
  }
`;

const CardHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`;

const TitleSection = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
`;

const Title = styled.h3`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.15rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0;
  flex: 1;
`;

const SponsorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SponsorLogo = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 6px;
  object-fit: cover;
`;

const SponsorInitial = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: linear-gradient(135deg, ${({ theme }) => theme.accent}, ${({ theme }) => theme.accentGold});
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 0.8rem;
  font-weight: 600;
`;

const SponsorName = styled.span`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textSecondary};
`;

const CreatorInfo = styled.div`
  display: flex;
  align-items: center;
`;

const CreatorName = styled.span`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textSecondary};
`;

const Description = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0 0 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const MetaGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

const MetaIcon = styled.span`
  width: 16px;
  height: 16px;
  color: ${({ theme }) => theme.textSecondary};

  svg {
    width: 100%;
    height: 100%;
  }
`;

const MetaText = styled.span`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textSecondary};
`;

const ProgressSection = styled.div`
  margin-bottom: 1rem;
`;

const ProgressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4rem;
`;

const ProgressLabel = styled.span`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textSecondary};
`;

const ProgressCount = styled.span`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.8rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`;

const ProgressBar = styled.div`
  height: 6px;
  background: ${({ theme }) => theme.backgroundAlt};
  border-radius: 3px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $percentage: number }>`
  height: 100%;
  width: ${({ $percentage }) => $percentage}%;
  background: linear-gradient(90deg, ${({ theme }) => theme.accent}, ${({ theme }) => theme.accentGold});
  border-radius: 3px;
  transition: width 0.3s ease;
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  padding-top: 0.75rem;
  border-top: 1px solid ${({ theme }) => theme.border};
`;

const ViewButton = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.accent};
  font-weight: 500;

  svg {
    width: 16px;
    height: 16px;
  }
`;

export default CampaignCard;
