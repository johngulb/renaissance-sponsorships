import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import styled from 'styled-components';
import { useRouter } from 'next/router';
import { useUser } from '@/contexts/UserContext';
import { Loading } from '@/components/Loading';
import { StatusBadge } from '@/components/shared';

interface SponsorProfile {
  id: string;
  name: string;
}

interface Credit {
  id: string;
  title: string;
  description?: string;
  value: number;
  status: string;
  expiresAt?: string;
  redeemedAt?: string;
  recipient?: {
    id: string;
    displayName?: string;
    username?: string;
  };
  campaign?: {
    id: string;
    title: string;
  };
}

const APP_NAME = 'Renaissance City';

const CreditsPage: React.FC = () => {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const [profile, setProfile] = useState<SponsorProfile | null>(null);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

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

          const creditsRes = await fetch(`/api/credits?sponsorId=${sponsorProfile.id}`);
          if (creditsRes.ok) {
            const { credits: creditsList } = await creditsRes.json();
            setCredits(creditsList);
          }
        } else {
          router.push('/sponsor');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, router]);

  const handleCreateCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    if (!title.trim() || !value) {
      setError('Title and value are required');
      setIsSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sponsorId: profile?.id,
          title: title.trim(),
          description: description.trim() || null,
          value: parseFloat(value),
          expiresAt: expiresAt || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create credit');
      }

      const { credit } = await res.json();
      setCredits([credit, ...credits]);
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelCredit = async (creditId: string) => {
    try {
      const res = await fetch('/api/credits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: creditId, status: 'cancelled' }),
      });

      if (res.ok) {
        setCredits(
          credits.map((c) =>
            c.id === creditId ? { ...c, status: 'cancelled' } : c
          )
        );
      }
    } catch (error) {
      console.error('Error cancelling credit:', error);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setValue('');
    setExpiresAt('');
    setError(null);
  };

  if (isUserLoading || isLoading) {
    return <Loading text="Loading credits..." />;
  }

  if (!user || !profile) {
    return null;
  }

  const stats = {
    total: credits.reduce((sum, c) => sum + c.value, 0),
    active: credits.filter((c) => c.status === 'active').reduce((sum, c) => sum + c.value, 0),
    redeemed: credits.filter((c) => c.status === 'redeemed').reduce((sum, c) => sum + c.value, 0),
    count: credits.length,
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return 'No expiration';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Container>
      <Head>
        <title>Credits | {APP_NAME}</title>
      </Head>

      <Header>
        <HeaderContent>
          <BackButton onClick={() => router.push('/sponsor')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Dashboard
          </BackButton>
          <HeaderTitle>Credits & Offers</HeaderTitle>
        </HeaderContent>
        <CreateButton onClick={() => setShowCreateModal(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Issue Credit
        </CreateButton>
      </Header>

      <Main>
        <StatsGrid>
          <StatCard>
            <StatLabel>Total Issued</StatLabel>
            <StatValue>${stats.total.toLocaleString()}</StatValue>
          </StatCard>
          <StatCard>
            <StatLabel>Active</StatLabel>
            <StatValue>${stats.active.toLocaleString()}</StatValue>
          </StatCard>
          <StatCard>
            <StatLabel>Redeemed</StatLabel>
            <StatValue>${stats.redeemed.toLocaleString()}</StatValue>
          </StatCard>
          <StatCard>
            <StatLabel>Total Credits</StatLabel>
            <StatValue>{stats.count}</StatValue>
          </StatCard>
        </StatsGrid>

        {credits.length === 0 ? (
          <EmptyState>
            <EmptyIcon>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </EmptyIcon>
            <EmptyText>No credits issued yet</EmptyText>
            <EmptyAction onClick={() => setShowCreateModal(true)}>
              Issue your first credit
            </EmptyAction>
          </EmptyState>
        ) : (
          <CreditsList>
            {credits.map((credit) => (
              <CreditCard key={credit.id}>
                <CreditHeader>
                  <CreditTitle>{credit.title}</CreditTitle>
                  <CreditValue>${credit.value}</CreditValue>
                </CreditHeader>
                
                {credit.description && (
                  <CreditDescription>{credit.description}</CreditDescription>
                )}

                <CreditMeta>
                  <StatusBadge status={credit.status as 'active' | 'redeemed' | 'expired' | 'cancelled'} />
                  
                  {credit.recipient && (
                    <MetaItem>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      {credit.recipient.displayName || credit.recipient.username}
                    </MetaItem>
                  )}
                  
                  {credit.campaign && (
                    <MetaItem>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      {credit.campaign.title}
                    </MetaItem>
                  )}
                  
                  <MetaItem>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {credit.status === 'redeemed'
                      ? `Redeemed ${formatDate(credit.redeemedAt)}`
                      : `Expires ${formatDate(credit.expiresAt)}`}
                  </MetaItem>
                </CreditMeta>

                {credit.status === 'active' && (
                  <CreditActions>
                    <CancelCreditButton onClick={() => handleCancelCredit(credit.id)}>
                      Cancel Credit
                    </CancelCreditButton>
                  </CreditActions>
                )}
              </CreditCard>
            ))}
          </CreditsList>
        )}
      </Main>

      {showCreateModal && (
        <Modal onClick={() => setShowCreateModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Issue New Credit</ModalTitle>
              <CloseButton onClick={() => setShowCreateModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </CloseButton>
            </ModalHeader>

            <Form onSubmit={handleCreateCredit}>
              <FormGroup>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., 10% off any item"
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="description">Description</Label>
                <TextArea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details about this credit..."
                  rows={2}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="value">Value ($) *</Label>
                <Input
                  id="value"
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="0"
                  min="0"
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="expiresAt">Expiration Date</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </FormGroup>

              {error && <ErrorMessage>{error}</ErrorMessage>}

              <ModalActions>
                <CancelButton type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </CancelButton>
                <SubmitButton type="submit" disabled={isSaving}>
                  {isSaving ? 'Creating...' : 'Issue Credit'}
                </SubmitButton>
              </ModalActions>
            </Form>
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
`;

const HeaderContent = styled.div`
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

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px ${({ theme }) => theme.shadow};
  }
`;

const Main = styled.main`
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StatCard = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  padding: 1.25rem;
  text-align: center;
`;

const StatLabel = styled.span`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textSecondary};
  display: block;
  margin-bottom: 0.25rem;
`;

const StatValue = styled.span`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`;

const CreditsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const CreditCard = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  padding: 1.25rem;
`;

const CreditHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.5rem;
`;

const CreditTitle = styled.h3`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.15rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const CreditValue = styled.span`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ theme }) => theme.accentGold};
`;

const CreditDescription = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0 0 1rem;
`;

const CreditMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
`;

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textSecondary};

  svg {
    width: 14px;
    height: 14px;
  }
`;

const CreditActions = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid ${({ theme }) => theme.border};
`;

const CancelCreditButton = styled.button`
  padding: 0.4rem 0.75rem;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 6px;
  background: transparent;
  color: ${({ theme }) => theme.textSecondary};
  cursor: pointer;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.8rem;
  transition: all 0.2s ease;

  &:hover {
    border-color: #C62828;
    color: #C62828;
  }
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
  color: ${({ theme }) => theme.textSecondary};
  margin: 0 0 1rem;
`;

const EmptyAction = styled.button`
  border: none;
  background: none;
  color: ${({ theme }) => theme.accent};
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.95rem;
  cursor: pointer;
  text-decoration: underline;
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
  max-width: 480px;
  width: 100%;
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

const Form = styled.form`
  padding: 1.25rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const Label = styled.label`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`;

const Input = styled.input`
  padding: 0.75rem 1rem;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 16px;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
  }
`;

const TextArea = styled.textarea`
  padding: 0.75rem 1rem;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 16px;
  resize: vertical;
  min-height: 60px;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
  }
`;

const ErrorMessage = styled.p`
  color: #C62828;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  margin: 0 0 1rem;
  padding: 0.5rem 0.75rem;
  background: rgba(198, 40, 40, 0.1);
  border-radius: 6px;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
`;

const CancelButton = styled.button`
  padding: 0.6rem 1.25rem;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  background: transparent;
  color: ${({ theme }) => theme.textSecondary};
  cursor: pointer;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.backgroundAlt};
  }
`;

const SubmitButton = styled.button`
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

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px ${({ theme }) => theme.shadow};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export default CreditsPage;
