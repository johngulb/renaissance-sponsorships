import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import styled from 'styled-components';
import { useRouter } from 'next/router';
import { useUser } from '@/contexts/UserContext';
import { Loading } from '@/components/Loading';

interface SponsorProfile {
  id: string;
  name: string;
}

interface Creator {
  id: string;
  displayName: string;
  bio?: string;
  specialties: string[];
  user?: { pfpUrl?: string };
}

interface Deliverable {
  type: string;
  title: string;
  description: string;
  deadline: string;
  verificationMethod: string;
}

const APP_NAME = 'Renaissance City';

const DELIVERABLE_TYPES = [
  { value: 'event_appearance', label: 'Event Appearance' },
  { value: 'content_post', label: 'Content Post' },
  { value: 'check_in', label: 'Check-in / Attendance' },
  { value: 'custom', label: 'Custom' },
];

const VERIFICATION_METHODS = [
  { value: 'manual_upload', label: 'Manual Proof Upload' },
  { value: 'link_submission', label: 'Link Submission' },
  { value: 'qr_checkin', label: 'QR Check-in' },
];

const NewCampaignPage: React.FC = () => {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const [profile, setProfile] = useState<SponsorProfile | null>(null);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCreator, setSelectedCreator] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [compensationType, setCompensationType] = useState('cash');
  const [cashAmount, setCashAmount] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);

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
        } else {
          router.push('/sponsor');
          return;
        }

        const creatorsRes = await fetch('/api/creators');
        if (creatorsRes.ok) {
          const { creators: creatorsList } = await creatorsRes.json();
          setCreators(creatorsList);
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

  const addDeliverable = () => {
    setDeliverables([
      ...deliverables,
      {
        type: 'custom',
        title: '',
        description: '',
        deadline: '',
        verificationMethod: 'manual_upload',
      },
    ]);
  };

  const updateDeliverable = (index: number, field: keyof Deliverable, value: string) => {
    const updated = [...deliverables];
    updated[index] = { ...updated[index], [field]: value };
    setDeliverables(updated);
  };

  const removeDeliverable = (index: number) => {
    setDeliverables(deliverables.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent, asDraft: boolean = false) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    if (!title.trim()) {
      setError('Campaign title is required');
      setIsSaving(false);
      return;
    }

    if (deliverables.length === 0) {
      setError('At least one deliverable is required');
      setIsSaving(false);
      return;
    }

    const invalidDeliverable = deliverables.find((d) => !d.title.trim());
    if (invalidDeliverable) {
      setError('All deliverables must have a title');
      setIsSaving(false);
      return;
    }

    try {
      const payload = {
        sponsorId: profile?.id,
        creatorId: selectedCreator || null,
        title: title.trim(),
        description: description.trim() || null,
        status: asDraft ? 'draft' : 'active',
        startDate: startDate || null,
        endDate: endDate || null,
        compensationType,
        cashAmount: cashAmount ? parseFloat(cashAmount) : null,
        creditAmount: creditAmount ? parseFloat(creditAmount) : null,
        notes: notes.trim() || null,
        deliverablesList: deliverables.map((d) => ({
          type: d.type,
          title: d.title.trim(),
          description: d.description.trim() || null,
          deadline: d.deadline || null,
          verificationMethod: d.verificationMethod,
        })),
      };

      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create campaign');
      }

      const { campaign } = await res.json();
      router.push(`/sponsor/campaigns/${campaign.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  if (isUserLoading || isLoading) {
    return <Loading text="Loading..." />;
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <Container>
      <Head>
        <title>New Campaign | {APP_NAME}</title>
      </Head>

      <Header>
        <BackButton onClick={() => router.push('/sponsor/campaigns')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Campaigns
        </BackButton>
        <HeaderTitle>New Campaign</HeaderTitle>
      </Header>

      <Main>
        <Form onSubmit={(e) => handleSubmit(e, false)}>
          <Section>
            <SectionTitle>Campaign Details</SectionTitle>

            <FormGroup>
              <Label htmlFor="title">Campaign Title *</Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Summer Music Series Sponsorship"
                required
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="description">Description</Label>
              <TextArea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this campaign is about..."
                rows={3}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="creator">Select Creator (Optional)</Label>
              <Select
                id="creator"
                value={selectedCreator}
                onChange={(e) => setSelectedCreator(e.target.value)}
              >
                <option value="">Open campaign (no specific creator)</option>
                {creators.map((creator) => (
                  <option key={creator.id} value={creator.id}>
                    {creator.displayName}
                    {creator.specialties?.length > 0 && ` - ${creator.specialties.join(', ')}`}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormRow>
              <FormGroup>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </FormGroup>
            </FormRow>
          </Section>

          <Section>
            <SectionTitle>Compensation</SectionTitle>

            <FormGroup>
              <Label>Compensation Type</Label>
              <RadioGroup>
                <RadioOption>
                  <input
                    type="radio"
                    name="compensationType"
                    value="cash"
                    checked={compensationType === 'cash'}
                    onChange={(e) => setCompensationType(e.target.value)}
                  />
                  <RadioLabel>Cash Only</RadioLabel>
                </RadioOption>
                <RadioOption>
                  <input
                    type="radio"
                    name="compensationType"
                    value="credit"
                    checked={compensationType === 'credit'}
                    onChange={(e) => setCompensationType(e.target.value)}
                  />
                  <RadioLabel>Credit Only</RadioLabel>
                </RadioOption>
                <RadioOption>
                  <input
                    type="radio"
                    name="compensationType"
                    value="hybrid"
                    checked={compensationType === 'hybrid'}
                    onChange={(e) => setCompensationType(e.target.value)}
                  />
                  <RadioLabel>Cash + Credit</RadioLabel>
                </RadioOption>
              </RadioGroup>
            </FormGroup>

            <FormRow>
              {(compensationType === 'cash' || compensationType === 'hybrid') && (
                <FormGroup>
                  <Label htmlFor="cashAmount">Cash Amount ($)</Label>
                  <Input
                    id="cashAmount"
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                </FormGroup>
              )}

              {(compensationType === 'credit' || compensationType === 'hybrid') && (
                <FormGroup>
                  <Label htmlFor="creditAmount">Credit Value ($)</Label>
                  <Input
                    id="creditAmount"
                    type="number"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                </FormGroup>
              )}
            </FormRow>
          </Section>

          <Section>
            <SectionHeader>
              <SectionTitle>Deliverables *</SectionTitle>
              <AddButton type="button" onClick={addDeliverable}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Deliverable
              </AddButton>
            </SectionHeader>

            {deliverables.length === 0 ? (
              <EmptyDeliverables>
                <p>No deliverables added yet</p>
                <button type="button" onClick={addDeliverable}>
                  Add your first deliverable
                </button>
              </EmptyDeliverables>
            ) : (
              <DeliverablesList>
                {deliverables.map((deliverable, index) => (
                  <DeliverableItem key={index}>
                    <DeliverableHeader>
                      <DeliverableNumber>#{index + 1}</DeliverableNumber>
                      <RemoveButton
                        type="button"
                        onClick={() => removeDeliverable(index)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </RemoveButton>
                    </DeliverableHeader>

                    <FormRow>
                      <FormGroup>
                        <Label>Type</Label>
                        <Select
                          value={deliverable.type}
                          onChange={(e) => updateDeliverable(index, 'type', e.target.value)}
                        >
                          {DELIVERABLE_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </Select>
                      </FormGroup>

                      <FormGroup>
                        <Label>Verification Method</Label>
                        <Select
                          value={deliverable.verificationMethod}
                          onChange={(e) =>
                            updateDeliverable(index, 'verificationMethod', e.target.value)
                          }
                        >
                          {VERIFICATION_METHODS.map((method) => (
                            <option key={method.value} value={method.value}>
                              {method.label}
                            </option>
                          ))}
                        </Select>
                      </FormGroup>
                    </FormRow>

                    <FormGroup>
                      <Label>Title *</Label>
                      <Input
                        type="text"
                        value={deliverable.title}
                        onChange={(e) => updateDeliverable(index, 'title', e.target.value)}
                        placeholder="e.g., Instagram Post"
                      />
                    </FormGroup>

                    <FormGroup>
                      <Label>Description</Label>
                      <TextArea
                        value={deliverable.description}
                        onChange={(e) =>
                          updateDeliverable(index, 'description', e.target.value)
                        }
                        placeholder="Details about this deliverable..."
                        rows={2}
                      />
                    </FormGroup>

                    <FormGroup>
                      <Label>Deadline</Label>
                      <Input
                        type="date"
                        value={deliverable.deadline}
                        onChange={(e) => updateDeliverable(index, 'deadline', e.target.value)}
                      />
                    </FormGroup>
                  </DeliverableItem>
                ))}
              </DeliverablesList>
            )}
          </Section>

          <Section>
            <SectionTitle>Additional Notes</SectionTitle>
            <FormGroup>
              <TextArea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional terms, expectations, or notes..."
                rows={3}
              />
            </FormGroup>
          </Section>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <Actions>
            <CancelButton type="button" onClick={() => router.push('/sponsor/campaigns')}>
              Cancel
            </CancelButton>
            <DraftButton
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={isSaving}
            >
              Save as Draft
            </DraftButton>
            <SubmitButton type="submit" disabled={isSaving}>
              {isSaving ? 'Creating...' : 'Create & Activate'}
            </SubmitButton>
          </Actions>
        </Form>
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
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const Main = styled.main`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const SectionTitle = styled.h2`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0;

  ${SectionHeader} & {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
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
  font-size: 0.95rem;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
  }
`;

const Select = styled.select`
  padding: 0.75rem 1rem;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.95rem;
  cursor: pointer;
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
  font-size: 0.95rem;
  resize: vertical;
  min-height: 80px;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
  }
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
`;

const RadioOption = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
`;

const RadioLabel = styled.span`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.text};
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border: 1px solid ${({ theme }) => theme.accent};
  border-radius: 6px;
  background: transparent;
  color: ${({ theme }) => theme.accent};
  cursor: pointer;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  transition: all 0.2s ease;

  svg {
    width: 14px;
    height: 14px;
  }

  &:hover {
    background: ${({ theme }) => theme.accent};
    color: #fff;
  }
`;

const EmptyDeliverables = styled.div`
  text-align: center;
  padding: 2rem;
  border: 1px dashed ${({ theme }) => theme.border};
  border-radius: 8px;

  p {
    font-family: 'Crimson Pro', Georgia, serif;
    color: ${({ theme }) => theme.textSecondary};
    margin: 0 0 1rem;
  }

  button {
    border: none;
    background: none;
    color: ${({ theme }) => theme.accent};
    font-family: 'Crimson Pro', Georgia, serif;
    cursor: pointer;
    text-decoration: underline;
  }
`;

const DeliverablesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const DeliverableItem = styled.div`
  padding: 1rem;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  background: ${({ theme }) => theme.background};
`;

const DeliverableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const DeliverableNumber = styled.span`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: ${({ theme }) => theme.accent};
`;

const RemoveButton = styled.button`
  padding: 0.25rem;
  border: none;
  background: none;
  color: ${({ theme }) => theme.textSecondary};
  cursor: pointer;
  transition: color 0.2s ease;

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover {
    color: #C62828;
  }
`;

const ErrorMessage = styled.p`
  color: #C62828;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  margin: 0;
  padding: 0.75rem 1rem;
  background: rgba(198, 40, 40, 0.1);
  border-radius: 8px;
`;

const Actions = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  flex-wrap: wrap;
`;

const CancelButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  background: transparent;
  color: ${({ theme }) => theme.textSecondary};
  cursor: pointer;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.95rem;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.backgroundAlt};
  }
`;

const DraftButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  background: ${({ theme }) => theme.surface};
  color: ${({ theme }) => theme.text};
  cursor: pointer;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.95rem;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.backgroundAlt};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SubmitButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, ${({ theme }) => theme.accent}, ${({ theme }) => theme.accentGold});
  color: #fff;
  cursor: pointer;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.95rem;
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

export default NewCampaignPage;
