import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import styled from 'styled-components';
import { useRouter } from 'next/router';
import { useUser } from '@/contexts/UserContext';
import { Loading } from '@/components/Loading';
import { StatusBadge, DeliverableChecklist } from '@/components/shared';

interface Deliverable {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  deadline?: Date | string | null;
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
  };
  creator?: {
    id: string;
    displayName: string;
    bio?: string;
  };
  deliverables: Deliverable[];
}

const APP_NAME = 'Renaissance City';

const CampaignDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user, isLoading: isUserLoading } = useUser();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

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
          router.push('/sponsor/campaigns');
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

  const handleStatusChange = async (newStatus: string) => {
    if (!campaign) return;
    setIsUpdating(true);

    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const { campaign: updatedCampaign } = await res.json();
        setCampaign(updatedCampaign);
      }
    } catch (error) {
      console.error('Error updating campaign:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleProofReview = async (proofId: string, status: 'approved' | 'rejected') => {
    setIsUpdating(true);

    try {
      const res = await fetch('/api/proofs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: proofId,
          status,
          reviewedBy: user?.id,
        }),
      });

      if (res.ok) {
        // Refresh campaign data
        const campaignRes = await fetch(`/api/campaigns/${campaign?.id}`);
        if (campaignRes.ok) {
          const { campaign: updatedCampaign } = await campaignRes.json();
          setCampaign(updatedCampaign);
          setSelectedDeliverable(null);
        }
      }
    } catch (error) {
      console.error('Error reviewing proof:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isUserLoading || isLoading) {
    return <Loading text="Loading campaign..." />;
  }

  if (!user || !campaign) {
    return null;
  }

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'TBD';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
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

  return (
    <Container>
      <Head>
        <title>{campaign.title} | {APP_NAME}</title>
      </Head>

      <Header>
        <BackButton onClick={() => router.push('/sponsor/campaigns')}>
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
              {campaign.description && (
                <Description>{campaign.description}</Description>
              )}
            </TitleSection>

            <Section>
              <SectionTitle>Deliverables</SectionTitle>
              <ProgressBar>
                <ProgressFill $percentage={(progress.completed / progress.total) * 100} />
              </ProgressBar>
              <ProgressText>
                {progress.completed} of {progress.total} completed
              </ProgressText>

              <DeliverableChecklist
                deliverables={campaign.deliverables}
                onDeliverableClick={(d) => {
                  const found = campaign.deliverables.find(del => del.id === d.id);
                  if (found) setSelectedDeliverable(found);
                }}
              />
            </Section>

            {campaign.notes && (
              <Section>
                <SectionTitle>Notes</SectionTitle>
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
                <DetailValue>{getCompensationDisplay()}</DetailValue>
              </DetailItem>

              {campaign.creator && (
                <DetailItem>
                  <DetailLabel>Creator</DetailLabel>
                  <DetailValue>{campaign.creator.displayName}</DetailValue>
                </DetailItem>
              )}
            </SidebarSection>

            <SidebarSection>
              <SidebarTitle>Actions</SidebarTitle>
              
              {campaign.status === 'draft' && (
                <ActionButton
                  onClick={() => handleStatusChange('active')}
                  disabled={isUpdating}
                >
                  Activate Campaign
                </ActionButton>
              )}

              {campaign.status === 'active' && (
                <>
                  <ActionButton
                    onClick={() => handleStatusChange('completed')}
                    disabled={isUpdating}
                  >
                    Mark Complete
                  </ActionButton>
                  <SecondaryActionButton
                    onClick={() => handleStatusChange('disputed')}
                    disabled={isUpdating}
                  >
                    Flag Dispute
                  </SecondaryActionButton>
                </>
              )}

              {campaign.status === 'draft' && (
                <SecondaryActionButton
                  onClick={() => handleStatusChange('cancelled')}
                  disabled={isUpdating}
                >
                  Cancel Campaign
                </SecondaryActionButton>
              )}
            </SidebarSection>
          </Sidebar>
        </ContentGrid>
      </Main>

      {selectedDeliverable && (
        <Modal onClick={() => setSelectedDeliverable(null)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>{selectedDeliverable.title}</ModalTitle>
              <CloseButton onClick={() => setSelectedDeliverable(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </CloseButton>
            </ModalHeader>

            <ModalBody>
              <DetailItem>
                <DetailLabel>Type</DetailLabel>
                <DetailValue style={{ textTransform: 'capitalize' }}>
                  {selectedDeliverable.type.replace(/_/g, ' ')}
                </DetailValue>
              </DetailItem>

              <DetailItem>
                <DetailLabel>Status</DetailLabel>
                <StatusBadge status={selectedDeliverable.status as 'pending' | 'submitted' | 'verified' | 'rejected'} />
              </DetailItem>

              {selectedDeliverable.description && (
                <DetailItem>
                  <DetailLabel>Description</DetailLabel>
                  <DetailValue>{selectedDeliverable.description}</DetailValue>
                </DetailItem>
              )}

              {selectedDeliverable.deadline && (
                <DetailItem>
                  <DetailLabel>Deadline</DetailLabel>
                  <DetailValue>{formatDate(selectedDeliverable.deadline)}</DetailValue>
                </DetailItem>
              )}

              {selectedDeliverable.proofs && selectedDeliverable.proofs.length > 0 && (
                <ProofsSection>
                  <SectionTitle>Submitted Proofs</SectionTitle>
                  {selectedDeliverable.proofs.map((proof) => (
                    <ProofItem key={proof.id}>
                      <ProofHeader>
                        <ProofType>{proof.proofType}</ProofType>
                        <StatusBadge status={proof.status as 'pending' | 'approved' | 'rejected'} size="small" />
                      </ProofHeader>
                      
                      {proof.proofType === 'link' || proof.proofType === 'image' ? (
                        <ProofLink href={proof.content} target="_blank" rel="noopener noreferrer">
                          {proof.content}
                        </ProofLink>
                      ) : (
                        <ProofText>{proof.content}</ProofText>
                      )}

                      {proof.status === 'pending' && (
                        <ProofActions>
                          <ApproveButton
                            onClick={() => handleProofReview(proof.id, 'approved')}
                            disabled={isUpdating}
                          >
                            Approve
                          </ApproveButton>
                          <RejectButton
                            onClick={() => handleProofReview(proof.id, 'rejected')}
                            disabled={isUpdating}
                          >
                            Reject
                          </RejectButton>
                        </ProofActions>
                      )}
                    </ProofItem>
                  ))}
                </ProofsSection>
              )}
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
`;

const Title = styled.h1`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const Description = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 1rem 0 0;
  line-height: 1.6;
`;

const Section = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  padding: 1.5rem;
`;

const SectionTitle = styled.h2`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0 0 1rem;
`;

const ProgressBar = styled.div`
  height: 8px;
  background: ${({ theme }) => theme.backgroundAlt};
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
`;

const ProgressFill = styled.div<{ $percentage: number }>`
  height: 100%;
  width: ${({ $percentage }) => $percentage}%;
  background: linear-gradient(90deg, ${({ theme }) => theme.accent}, ${({ theme }) => theme.accentGold});
  border-radius: 4px;
  transition: width 0.3s ease;
`;

const ProgressText = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0 0 1rem;
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

const ActionButton = styled.button`
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, ${({ theme }) => theme.accent}, ${({ theme }) => theme.accentGold});
  color: #fff;
  cursor: pointer;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px ${({ theme }) => theme.shadow};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SecondaryActionButton = styled.button`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  background: transparent;
  color: ${({ theme }) => theme.textSecondary};
  cursor: pointer;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.backgroundAlt};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
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
  font-size: 1.25rem;
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

const ProofsSection = styled.div`
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid ${({ theme }) => theme.border};
`;

const ProofItem = styled.div`
  padding: 1rem;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  margin-bottom: 0.75rem;
  background: ${({ theme }) => theme.background};

  &:last-child {
    margin-bottom: 0;
  }
`;

const ProofHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const ProofType = styled.span`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textSecondary};
  text-transform: capitalize;
`;

const ProofLink = styled.a`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.accent};
  word-break: break-all;
  display: block;
`;

const ProofText = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const ProofActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
`;

const ApproveButton = styled.button`
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  background: rgba(46, 125, 50, 0.15);
  color: #2E7D32;
  cursor: pointer;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: rgba(46, 125, 50, 0.25);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const RejectButton = styled.button`
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  background: rgba(198, 40, 40, 0.15);
  color: #C62828;
  cursor: pointer;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: rgba(198, 40, 40, 0.25);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export default CampaignDetailPage;
