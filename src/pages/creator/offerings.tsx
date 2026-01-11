import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import styled from 'styled-components';
import { useRouter } from 'next/router';
import { useUser } from '@/contexts/UserContext';
import { Loading } from '@/components/Loading';
import { StatusBadge } from '@/components/shared';

interface CreatorProfile {
  id: string;
  displayName: string;
}

interface Offering {
  id: string;
  title: string;
  description?: string;
  deliverableTypes: string[];
  basePrice?: number;
  estimatedDuration?: string;
  isActive: boolean;
}

const APP_NAME = 'Renaissance City';

const DELIVERABLE_TYPES = [
  { value: 'event_appearance', label: 'Event Appearance' },
  { value: 'content_post', label: 'Content Post' },
  { value: 'check_in', label: 'Check-in' },
  { value: 'custom', label: 'Custom' },
];

const OfferingsPage: React.FC = () => {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOffering, setEditingOffering] = useState<Offering | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deliverableTypes, setDeliverableTypes] = useState<string[]>([]);
  const [basePrice, setBasePrice] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');

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

          const offeringsRes = await fetch(`/api/creator/offerings?creatorId=${creatorProfile.id}`);
          if (offeringsRes.ok) {
            const { offerings: offeringsList } = await offeringsRes.json();
            setOfferings(offeringsList);
          }
        } else {
          router.push('/creator');
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

  const toggleDeliverableType = (type: string) => {
    if (deliverableTypes.includes(type)) {
      setDeliverableTypes(deliverableTypes.filter((t) => t !== type));
    } else {
      setDeliverableTypes([...deliverableTypes, type]);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDeliverableTypes([]);
    setBasePrice('');
    setEstimatedDuration('');
    setError(null);
    setEditingOffering(null);
  };

  const openEditModal = (offering: Offering) => {
    setEditingOffering(offering);
    setTitle(offering.title);
    setDescription(offering.description || '');
    setDeliverableTypes(offering.deliverableTypes);
    setBasePrice(offering.basePrice?.toString() || '');
    setEstimatedDuration(offering.estimatedDuration || '');
    setShowCreateModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    if (!title.trim() || deliverableTypes.length === 0) {
      setError('Title and at least one deliverable type are required');
      setIsSaving(false);
      return;
    }

    try {
      const payload = {
        ...(editingOffering && { id: editingOffering.id }),
        creatorId: profile?.id,
        title: title.trim(),
        description: description.trim() || null,
        deliverableTypes,
        basePrice: basePrice ? parseFloat(basePrice) : null,
        estimatedDuration: estimatedDuration.trim() || null,
      };

      const res = await fetch('/api/creator/offerings', {
        method: editingOffering ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save offering');
      }

      const { offering } = await res.json();
      
      if (editingOffering) {
        setOfferings(offerings.map((o) => (o.id === offering.id ? offering : o)));
      } else {
        setOfferings([offering, ...offerings]);
      }
      
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleOfferingStatus = async (offering: Offering) => {
    try {
      const res = await fetch('/api/creator/offerings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: offering.id, isActive: !offering.isActive }),
      });

      if (res.ok) {
        setOfferings(
          offerings.map((o) =>
            o.id === offering.id ? { ...o, isActive: !o.isActive } : o
          )
        );
      }
    } catch (error) {
      console.error('Error updating offering:', error);
    }
  };

  const deleteOffering = async (offeringId: string) => {
    try {
      const res = await fetch(`/api/creator/offerings?id=${offeringId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setOfferings(offerings.filter((o) => o.id !== offeringId));
      }
    } catch (error) {
      console.error('Error deleting offering:', error);
    }
  };

  if (isUserLoading || isLoading) {
    return <Loading text="Loading offerings..." />;
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <Container>
      <Head>
        <title>My Offerings | {APP_NAME}</title>
      </Head>

      <Header>
        <HeaderContent>
          <BackButton onClick={() => router.push('/creator')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Dashboard
          </BackButton>
          <HeaderTitle>My Offerings</HeaderTitle>
        </HeaderContent>
        <CreateButton onClick={() => {
          resetForm();
          setShowCreateModal(true);
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Offering
        </CreateButton>
      </Header>

      <Main>
        <Intro>
          <IntroTitle>Sponsorship Packages</IntroTitle>
          <IntroText>
            Create offerings that sponsors can browse. Each offering defines what you
            can deliver and your suggested pricing.
          </IntroText>
        </Intro>

        {offerings.length === 0 ? (
          <EmptyState>
            <EmptyIcon>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
            </EmptyIcon>
            <EmptyText>No offerings yet</EmptyText>
            <EmptySubtext>
              Create your first offering to let sponsors know what you can deliver
            </EmptySubtext>
            <EmptyAction onClick={() => setShowCreateModal(true)}>
              Create Offering
            </EmptyAction>
          </EmptyState>
        ) : (
          <OfferingsGrid>
            {offerings.map((offering) => (
              <OfferingCard key={offering.id}>
                <OfferingHeader>
                  <OfferingTitle>{offering.title}</OfferingTitle>
                  <StatusBadge 
                    status={offering.isActive ? 'active' : 'cancelled'} 
                    size="small" 
                  />
                </OfferingHeader>

                {offering.description && (
                  <OfferingDescription>{offering.description}</OfferingDescription>
                )}

                <OfferingMeta>
                  {offering.basePrice && (
                    <MetaItem>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="1" x2="12" y2="23" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                      Starting at ${offering.basePrice}
                    </MetaItem>
                  )}
                  {offering.estimatedDuration && (
                    <MetaItem>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {offering.estimatedDuration}
                    </MetaItem>
                  )}
                </OfferingMeta>

                <DeliverableTypes>
                  {offering.deliverableTypes.map((type, i) => (
                    <TypeChip key={i}>
                      {DELIVERABLE_TYPES.find((t) => t.value === type)?.label || type}
                    </TypeChip>
                  ))}
                </DeliverableTypes>

                <OfferingActions>
                  <ActionBtn onClick={() => openEditModal(offering)}>
                    Edit
                  </ActionBtn>
                  <ActionBtn onClick={() => toggleOfferingStatus(offering)}>
                    {offering.isActive ? 'Deactivate' : 'Activate'}
                  </ActionBtn>
                  <ActionBtn 
                    $danger 
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this offering?')) {
                        deleteOffering(offering.id);
                      }
                    }}
                  >
                    Delete
                  </ActionBtn>
                </OfferingActions>
              </OfferingCard>
            ))}
          </OfferingsGrid>
        )}
      </Main>

      {showCreateModal && (
        <Modal onClick={() => { setShowCreateModal(false); resetForm(); }}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {editingOffering ? 'Edit Offering' : 'Create Offering'}
              </ModalTitle>
              <CloseButton onClick={() => { setShowCreateModal(false); resetForm(); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </CloseButton>
            </ModalHeader>

            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Event Appearance Package"
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="description">Description</Label>
                <TextArea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's included in this offering..."
                  rows={3}
                />
              </FormGroup>

              <FormGroup>
                <Label>Deliverable Types *</Label>
                <TypesGrid>
                  {DELIVERABLE_TYPES.map((type) => (
                    <TypeButton
                      key={type.value}
                      type="button"
                      $isSelected={deliverableTypes.includes(type.value)}
                      onClick={() => toggleDeliverableType(type.value)}
                    >
                      {type.label}
                    </TypeButton>
                  ))}
                </TypesGrid>
              </FormGroup>

              <FormRow>
                <FormGroup>
                  <Label htmlFor="basePrice">Base Price ($)</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="estimatedDuration">Duration</Label>
                  <Input
                    id="estimatedDuration"
                    type="text"
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(e.target.value)}
                    placeholder="e.g., 1 week"
                  />
                </FormGroup>
              </FormRow>

              {error && <ErrorMessage>{error}</ErrorMessage>}

              <ModalActions>
                <CancelButton type="button" onClick={() => { setShowCreateModal(false); resetForm(); }}>
                  Cancel
                </CancelButton>
                <SubmitButton type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : editingOffering ? 'Update' : 'Create'}
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

const Intro = styled.div`
  margin-bottom: 2rem;
`;

const IntroTitle = styled.h2`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.5rem;
`;

const IntroText = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0;
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
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const OfferingDescription = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
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
  gap: 1rem;
  margin-bottom: 0.75rem;
`;

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textSecondary};

  svg {
    width: 14px;
    height: 14px;
  }
`;

const DeliverableTypes = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1rem;
`;

const TypeChip = styled.span`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  background: ${({ theme }) => theme.backgroundAlt};
  color: ${({ theme }) => theme.textSecondary};
  border-radius: 4px;
`;

const OfferingActions = styled.div`
  display: flex;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid ${({ theme }) => theme.border};
`;

const ActionBtn = styled.button<{ $danger?: boolean }>`
  padding: 0.35rem 0.65rem;
  border: 1px solid ${({ $danger, theme }) => ($danger ? 'rgba(198, 40, 40, 0.3)' : theme.border)};
  border-radius: 6px;
  background: transparent;
  color: ${({ $danger, theme }) => ($danger ? '#C62828' : theme.textSecondary)};
  cursor: pointer;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.8rem;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ $danger, theme }) => ($danger ? 'rgba(198, 40, 40, 0.1)' : theme.backgroundAlt)};
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
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const EmptySubtext = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0.5rem 0 1rem;
`;

const EmptyAction = styled.button`
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
  max-width: 520px;
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

const Form = styled.form`
  padding: 1.25rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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
  min-height: 80px;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
  }
`;

const TypesGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const TypeButton = styled.button<{ $isSelected: boolean }>`
  padding: 0.5rem 0.75rem;
  border: 1px solid ${({ $isSelected, theme }) => ($isSelected ? theme.accent : theme.border)};
  border-radius: 6px;
  background: ${({ $isSelected, theme }) => ($isSelected ? `${theme.accent}15` : 'transparent')};
  color: ${({ $isSelected, theme }) => ($isSelected ? theme.accent : theme.textSecondary)};
  cursor: pointer;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  transition: all 0.2s ease;

  &:hover {
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

export default OfferingsPage;
