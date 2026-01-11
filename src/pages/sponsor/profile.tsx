import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import styled from 'styled-components';
import { useRouter } from 'next/router';
import { useUser } from '@/contexts/UserContext';
import { Loading } from '@/components/Loading';

interface SponsorProfile {
  id: string;
  name: string;
  industry?: string;
  description?: string;
  location?: string;
  website?: string;
  logoUrl?: string;
  budgetRangeMin?: number;
  budgetRangeMax?: number;
  paymentMethod?: string;
}

const APP_NAME = 'Renaissance City';

const INDUSTRIES = [
  'Restaurant',
  'Bar / Lounge',
  'Cafe',
  'Retail',
  'Art Gallery',
  'Music Venue',
  'Studio / Workshop',
  'Fitness',
  'Beauty / Wellness',
  'Tech',
  'Professional Services',
  'Other',
];

const SponsorProfilePage: React.FC = () => {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const [profile, setProfile] = useState<SponsorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [budgetRangeMin, setBudgetRangeMin] = useState('');
  const [budgetRangeMax, setBudgetRangeMax] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('off-chain');

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [isUserLoading, user, router]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const res = await fetch(`/api/sponsor/profile?userId=${user.id}`);
        if (res.ok) {
          const { profile: existingProfile } = await res.json();
          setProfile(existingProfile);
          
          // Populate form
          setName(existingProfile.name || '');
          setIndustry(existingProfile.industry || '');
          setDescription(existingProfile.description || '');
          setLocation(existingProfile.location || '');
          setWebsite(existingProfile.website || '');
          setLogoUrl(existingProfile.logoUrl || '');
          setBudgetRangeMin(existingProfile.budgetRangeMin?.toString() || '');
          setBudgetRangeMax(existingProfile.budgetRangeMax?.toString() || '');
          setPaymentMethod(existingProfile.paymentMethod || 'off-chain');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    if (!name.trim()) {
      setError('Business name is required');
      setIsSaving(false);
      return;
    }

    try {
      const payload = {
        ...(profile && { id: profile.id }),
        userId: user?.id,
        name: name.trim(),
        industry: industry || null,
        description: description.trim() || null,
        location: location.trim() || null,
        website: website.trim() || null,
        logoUrl: logoUrl.trim() || null,
        budgetRangeMin: budgetRangeMin ? parseFloat(budgetRangeMin) : null,
        budgetRangeMax: budgetRangeMax ? parseFloat(budgetRangeMax) : null,
        paymentMethod,
      };

      const res = await fetch('/api/sponsor/profile', {
        method: profile ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save profile');
      }

      const { profile: savedProfile } = await res.json();
      setProfile(savedProfile);
      setSuccess('Profile saved successfully!');

      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push('/sponsor');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  if (isUserLoading || isLoading) {
    return <Loading text="Loading..." />;
  }

  if (!user) {
    return null;
  }

  const isEditing = !!profile;

  return (
    <Container>
      <Head>
        <title>{isEditing ? 'Edit' : 'Create'} Sponsor Profile | {APP_NAME}</title>
      </Head>

      <Header>
        <BackButton onClick={() => router.push('/sponsor')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </BackButton>
        <HeaderTitle>{isEditing ? 'Edit' : 'Create'} Sponsor Profile</HeaderTitle>
      </Header>

      <Main>
        <Form onSubmit={handleSubmit}>
          <Section>
            <SectionTitle>Business Information</SectionTitle>
            
            <FormGroup>
              <Label htmlFor="name">Business Name *</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your business name"
                required
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="industry">Industry</Label>
              <Select
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              >
                <option value="">Select an industry</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="description">Description</Label>
              <TextArea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell creators about your business..."
                rows={4}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City or neighborhood"
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://your-business.com"
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
              />
              {logoUrl && (
                <LogoPreview>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoUrl} alt="Logo preview" />
                </LogoPreview>
              )}
            </FormGroup>
          </Section>

          <Section>
            <SectionTitle>Sponsorship Preferences</SectionTitle>

            <FormRow>
              <FormGroup>
                <Label htmlFor="budgetMin">Budget Range (Min)</Label>
                <Input
                  id="budgetMin"
                  type="number"
                  value={budgetRangeMin}
                  onChange={(e) => setBudgetRangeMin(e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="budgetMax">Budget Range (Max)</Label>
                <Input
                  id="budgetMax"
                  type="number"
                  value={budgetRangeMax}
                  onChange={(e) => setBudgetRangeMax(e.target.value)}
                  placeholder="10000"
                  min="0"
                />
              </FormGroup>
            </FormRow>

            <FormGroup>
              <Label>Payment Method</Label>
              <RadioGroup>
                <RadioOption>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="off-chain"
                    checked={paymentMethod === 'off-chain'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <RadioLabel>
                    <RadioTitle>Traditional Payment</RadioTitle>
                    <RadioDescription>Bank transfer, check, etc.</RadioDescription>
                  </RadioLabel>
                </RadioOption>

                <RadioOption>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="wallet"
                    checked={paymentMethod === 'wallet'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <RadioLabel>
                    <RadioTitle>Crypto Wallet</RadioTitle>
                    <RadioDescription>Pay via blockchain</RadioDescription>
                  </RadioLabel>
                </RadioOption>

                <RadioOption>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="both"
                    checked={paymentMethod === 'both'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <RadioLabel>
                    <RadioTitle>Both</RadioTitle>
                    <RadioDescription>Flexible payment options</RadioDescription>
                  </RadioLabel>
                </RadioOption>
              </RadioGroup>
            </FormGroup>
          </Section>

          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}

          <Actions>
            <CancelButton type="button" onClick={() => router.push('/sponsor')}>
              Cancel
            </CancelButton>
            <SubmitButton type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : isEditing ? 'Update Profile' : 'Create Profile'}
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
  max-width: 680px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 2rem;
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
  margin: 0 0 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
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

  &::placeholder {
    color: ${({ theme }) => theme.textSecondary};
    opacity: 0.7;
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
  min-height: 100px;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
  }

  &::placeholder {
    color: ${({ theme }) => theme.textSecondary};
    opacity: 0.7;
  }
`;

const LogoPreview = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.border};
  margin-top: 0.5rem;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const RadioGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const RadioOption = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:has(input:checked) {
    border-color: ${({ theme }) => theme.accent};
    background: ${({ theme }) => theme.accent}10;
  }

  input {
    margin-top: 0.25rem;
  }
`;

const RadioLabel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`;

const RadioTitle = styled.span`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.95rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`;

const RadioDescription = styled.span`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textSecondary};
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

const SuccessMessage = styled.p`
  color: #2E7D32;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  margin: 0;
  padding: 0.75rem 1rem;
  background: rgba(46, 125, 50, 0.1);
  border-radius: 8px;
`;

const Actions = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
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

export default SponsorProfilePage;
