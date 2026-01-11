import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import styled from 'styled-components';
import { useRouter } from 'next/router';
import { useUser } from '@/contexts/UserContext';
import { Loading } from '@/components/Loading';
import { StatusBadge, DeliverableChecklist, ProofUploader } from '@/components/shared';

interface Deliverable {
  id: string;
  type: string;
  title: string;
  description?: string;
  deadline?: string;
  verificationMethod: string;
  status: string;
  proofs?: Array<{
    id: string;
    status: string;
    proofType: string;
    content: string;
  }>;
}

interface Campaign {
  id: string;
  title: string;
  description?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  compensationType: string;
  cashAmount?: number;
  creditAmount?: number;
  notes?: string;
  sponsor?: {
    id: string;
    name: string;
    logoUrl?: string;
    location?: string;
  };
  deliverables: Deliverable[];
}

const APP_NAME = 'Renaissance City';

const CreatorCampaignDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user, isLoading: isUserLoading } = useUser();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDeliverable, setSelectedDeliverable] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [isUserLoading, user, router]);

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!id || typeof id !== 'string') return;

      try {
        const res = await fetch(`/api/campaigns/${id}`);
        if (res.ok) {
          const { campaign: campaignData } = await res.json();
          setCampaign(campaignData);
        } else {
          router.push('/creator/campaigns');
        }
      } catch (error) {
        console.error('Error fetching campaign:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user && id) {
      fetchCampaign();
    }
  }, [user, id, router]);

  const handleProofSubmit = async (proof: {
    deliverableId: string;
    submittedBy: string;
    proofType: string;
    content: string;
    metadata?: Record<string, unknown>;
  }) => {
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/proofs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proof),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit proof');
      }

      // Refresh campaign data
      const campaignRes = await fetch(`/api/campaigns/${campaign?.id}`);
      if (campaignRes.ok) {
        const { campaign: updatedCampaign } = await campaignRes.json();
        setCampaign(updatedCampaign);
        setSelectedDeliverable(null);
      }
    } catch (error) {
      console.error('Error submitting proof:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading || isLoading) {
    return <Loading text="Loading campaign..." />;
  }

  if (!user || !campaign) {
    return null;
  }

  const formatDate = (date: string | undefined) => {
    if (!date) return 'TBD';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getCompensationDisplay = () => {
    const parts = [];
    if (campaign.cashAmount) {
      parts.push(`$${campaign.cashAmount.toLocaleString()}`);
    }
    if (campaign.creditAmount) {
      parts.push(`$${campaign.creditAmount} credit`);
    }
    return parts.join(' + ') || 'TBD';
  };

  const progress = {
    completed: campaign.deliverables.filter((d) => d.status === 'verified').length,
    total: campaign.deliverables.length,
  };

  const selectedDeliverableData = campaign.deliverables.find(
    (d) => d.id === selectedDeliverable
  );

  return (
    <Container>
      <Head>
        <title>{campaign.title} | {APP_NAME}</title>
      </Head>

      <Header>
        <BackButton onClick={() => router.push('/creator/campaigns')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Campaigns
        </BackButton>
      </Header>

      <Main>
        <ContentGrid>
          <MainContent>
            <TitleSection>
              <TitleRow>
                <Title>{campaign.title}</Title>
                <StatusBadge status={campaign.status as 'draft' | 'active' | 'completed' | 'disputed' | 'cancelled'} size="large" />
              </TitleRow>
              
              {campaign.sponsor && (
                <SponsorRow>
                  {campaign.sponsor.logoUrl ? (
                    <SponsorLogo src={campaign.sponsor.logoUrl} alt={campaign.sponsor.name} />
                  ) : (
                    <SponsorInitial>{campaign.sponsor.name[0]}</SponsorInitial>
                  )}
                  <SponsorInfo>
                    <SponsorName>{campaign.sponsor.name}</SponsorName>
                    {campaign.sponsor.location && (
                      <SponsorLocation>{campaign.sponsor.location}</SponsorLocation>
                    )}
                  </SponsorInfo>
                </SponsorRow>
              )}

              {campaign.description && (
                <Description>{campaign.description}</Description>
              )}
            </TitleSection>

            <Section>
              <SectionHeader>
                <SectionTitle>Your Deliverables</SectionTitle>
                <ProgressIndicator>
                  {progress.completed} of {progress.total} completed
                </ProgressIndicator>
              </SectionHeader>
              
              <ProgressBar>
                <ProgressFill $percentage={(progress.completed / progress.total) * 100} />
              </ProgressBar>

              <DeliverableChecklist
                deliverables={campaign.deliverables}
                showProofButton={campaign.status === 'active'}
                onSubmitProof={setSelectedDeliverable}
              />
            </Section>

            {campaign.notes && (
              <Section>
                <SectionTitle>Notes from Sponsor</SectionTitle>
                <Notes>{campaign.notes}</Notes>
              </Section>
            )}
          </MainContent>

          <Sidebar>
            <SidebarSection>
              <SidebarTitle>Campaign Details</SidebarTitle>
              
              <DetailItem>
                <DetailLabel>Status</DetailLabel>
                <StatusBadge status={campaign.status as 'draft' | 'active' | 'completed' | 'disputed' | 'cancelled'} />
              </DetailItem>

              <DetailItem>
                <DetailLabel>Start Date</DetailLabel>
                <DetailValue>{formatDate(campaign.startDate)}</DetailValue>
              </DetailItem>

              <DetailItem>
                <DetailLabel>End Date</DetailLabel>
                <DetailValue>{formatDate(campaign.endDate)}</DetailValue>
              </DetailItem>

              <DetailItem>
                <DetailLabel>Compensation</DetailLabel>
                <CompensationValue>{getCompensationDisplay()}</CompensationValue>
              </DetailItem>

              <DetailItem>
                <DetailLabel>Type</DetailLabel>
                <DetailValue style={{ textTransform: 'capitalize' }}>
                  {campaign.compensationType}
                </DetailValue>
              </DetailItem>
            </SidebarSection>

            <SidebarSection>
              <SidebarTitle>Progress</SidebarTitle>
              <ProgressCircle>
                <ProgressCircleValue>
                  {progress.total > 0 
                    ? Math.round((progress.completed / progress.total) * 100)
                    : 0}%
                </ProgressCircleValue>
                <ProgressCircleLabel>Complete</ProgressCircleLabel>
              </ProgressCircle>
              
              <ProgressStats>
                <ProgressStat>
                  <ProgressStatValue>{progress.completed}</ProgressStatValue>
                  <ProgressStatLabel>Verified</ProgressStatLabel>
                </ProgressStat>
                <ProgressStat>
                  <ProgressStatValue>
                    {campaign.deliverables.filter((d) => d.status === 'submitted').length}
                  </ProgressStatValue>
                  <ProgressStatLabel>Pending Review</ProgressStatLabel>
                </ProgressStat>
                <ProgressStat>
                  <ProgressStatValue>
                    {campaign.deliverables.filter((d) => 
                      d.status === 'pending' || d.status === 'in_progress'
                    ).length}
                  </ProgressStatValue>
                  <ProgressStatLabel>Remaining</ProgressStatLabel>
                </ProgressStat>
              </ProgressStats>
            </SidebarSection>
          </Sidebar>
        </ContentGrid>
      </Main>

      {selectedDeliverable && selectedDeliverableData && (
        <Modal onClick={() => setSelectedDeliverable(null)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Submit Proof: {selectedDeliverableData.title}</ModalTitle>
              <CloseButton onClick={() => setSelectedDeliverable(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </CloseButton>
            </ModalHeader>

            <ModalBody>
              {selectedDeliverableData.description && (
                <DeliverableDescription>
                  {selectedDeliverableData.description}
                </DeliverableDescription>
              )}

              {selectedDeliverableData.proofs && selectedDeliverableData.proofs.length > 0 && (
                <PreviousProofs>
                  <ProofsTitle>Previous Submissions</ProofsTitle>
                  {selectedDeliverableData.proofs.map((proof) => (
                    <ProofItem key={proof.id}>
                      <ProofType>{proof.proofType}</ProofType>
                      <StatusBadge status={proof.status as 'pending' | 'approved' | 'rejected'} size="small" />
                    </ProofItem>
                  ))}
                </PreviousProofs>
              )}

              <ProofUploader
                deliverableId={selectedDeliverable}
                userId={user.id}
                onSubmit={handleProofSubmit}
                onCancel={() => setSelectedDeliverable(null)}
                isLoading={isSubmitting}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
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

const Main = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 2rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const TitleSection = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  padding: 1.5rem;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
`;

const Title = styled.h1`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const SponsorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: ${({ theme }) => theme.backgroundAlt};
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const SponsorLogo = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
`;

const SponsorInitial = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: linear-gradient(135deg, ${({ theme }) => theme.accent}, ${({ theme }) => theme.accentGold});
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.1rem;
  font-weight: 600;
`;

const SponsorInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const SponsorName = styled.span`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`;

const SponsorLocation = styled.span`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textSecondary};
`;

const Description = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0;
  line-height: 1.6;
`;

const Section = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  padding: 1.5rem;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`;

const SectionTitle = styled.h2`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const ProgressIndicator = styled.span`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textSecondary};
`;

const ProgressBar = styled.div`
  height: 8px;
  background: ${({ theme }) => theme.backgroundAlt};
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1rem;
`;

const ProgressFill = styled.div<{ $percentage: number }>`
  height: 100%;
  width: ${({ $percentage }) => $percentage}%;
  background: linear-gradient(90deg, ${({ theme }) => theme.accent}, ${({ theme }) => theme.accentGold});
  border-radius: 4px;
  transition: width 0.3s ease;
`;

const Notes = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.text};
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
`;

const Sidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const SidebarSection = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  padding: 1.25rem;
`;

const SidebarTitle = styled.h3`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0 0 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.75rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const DetailLabel = styled.span`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const DetailValue = styled.span`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.text};
`;

const CompensationValue = styled.span`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.accentGold};
`;

const ProgressCircle = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${({ theme }) => theme.accent}20, ${({ theme }) => theme.accentGold}20);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
`;

const ProgressCircleValue = styled.span`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`;

const ProgressCircleLabel = styled.span`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textSecondary};
`;

const ProgressStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
`;

const ProgressStat = styled.div`
  text-align: center;
`;

const ProgressStatValue = styled.span`
  display: block;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`;

const ProgressStatLabel = styled.span`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.7rem;
  color: ${({ theme }) => theme.textSecondary};
`;

const Modal = styled.div`
  position: fixed;
  inset: 0;
  background: ${({ theme }) => theme.overlay};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: ${({ theme }) => theme.surface};
  border-radius: 12px;
  max-width: 560px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const ModalTitle = styled.h2`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.15rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const CloseButton = styled.button`
  padding: 0.25rem;
  border: none;
  background: none;
  color: ${({ theme }) => theme.textSecondary};
  cursor: pointer;

  svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    color: ${({ theme }) => theme.text};
  }
`;

const ModalBody = styled.div`
  padding: 1.25rem;
`;

const DeliverableDescription = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0 0 1rem;
  padding: 0.75rem;
  background: ${({ theme }) => theme.backgroundAlt};
  border-radius: 8px;
`;

const PreviousProofs = styled.div`
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const ProofsTitle = styled.h4`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  font-weight: 500;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0 0 0.5rem;
`;

const ProofItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
`;

const ProofType = styled.span`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.text};
  text-transform: capitalize;
`;

export default CreatorCampaignDetailPage;
