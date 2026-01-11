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
  FormGroup,
  FormRow,
  Label,
  Input,
  TextArea,
  Select,
  Button,
} from '@/components/shared';

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
    <Layout 
      title={isEditing ? 'Edit Profile' : 'Create Profile'} 
      showBack 
      backHref="/dashboard"
    >
      <Head>
        <title>{isEditing ? 'Edit' : 'Create'} Sponsor Profile</title>
      </Head>

      <Form onSubmit={handleSubmit}>
        <Stack $gap="lg">
          <Card>
            <SectionTitle>Business Information</SectionTitle>
            <Stack $gap="md">
              <FormGroup>
                <Label htmlFor="name">Business Name</Label>
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
                />
              </FormGroup>

              <FormRow>
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
                    placeholder="https://your-site.com"
                  />
                </FormGroup>
              </FormRow>

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
            </Stack>
          </Card>

          <Card>
            <SectionTitle>Sponsorship Preferences</SectionTitle>
            <Stack $gap="md">
              <FormRow>
                <FormGroup>
                  <Label htmlFor="budgetMin">Budget Min ($)</Label>
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
                  <Label htmlFor="budgetMax">Budget Max ($)</Label>
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
                  <RadioOption $selected={paymentMethod === 'off-chain'}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="off-chain"
                      checked={paymentMethod === 'off-chain'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <RadioContent>
                      <RadioTitle>Traditional</RadioTitle>
                      <RadioDesc>Bank transfer, check, etc.</RadioDesc>
                    </RadioContent>
                  </RadioOption>

                  <RadioOption $selected={paymentMethod === 'wallet'}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="wallet"
                      checked={paymentMethod === 'wallet'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <RadioContent>
                      <RadioTitle>Crypto</RadioTitle>
                      <RadioDesc>Blockchain payment</RadioDesc>
                    </RadioContent>
                  </RadioOption>

                  <RadioOption $selected={paymentMethod === 'both'}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="both"
                      checked={paymentMethod === 'both'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <RadioContent>
                      <RadioTitle>Both</RadioTitle>
                      <RadioDesc>Flexible options</RadioDesc>
                    </RadioContent>
                  </RadioOption>
                </RadioGroup>
              </FormGroup>
            </Stack>
          </Card>

          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}

          <Actions>
            <Button type="button" $variant="secondary" onClick={() => router.push('/dashboard')}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </Actions>
        </Stack>
      </Form>
    </Layout>
  );
};

const Form = styled.form``;

const SectionTitle = styled.h2`
  font-size: 0.8125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  padding-bottom: ${({ theme }) => theme.spacing.sm};
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const LogoPreview = styled.div`
  width: 64px;
  height: 64px;
  border-radius: ${({ theme }) => theme.radius.md};
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.border};
  margin-top: ${({ theme }) => theme.spacing.xs};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const RadioGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing.sm};

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const RadioOption = styled.label<{ $selected?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme, $selected }) => $selected ? theme.accent : theme.border};
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;
  background: ${({ theme, $selected }) => $selected ? `${theme.accent}08` : 'transparent'};
  transition: all 0.15s ease;

  input {
    margin-top: 2px;
    accent-color: ${({ theme }) => theme.accent};
  }
`;

const RadioContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const RadioTitle = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`;

const RadioDesc = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textMuted};
`;

const ErrorMessage = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.errorBg};
  color: ${({ theme }) => theme.error};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 0.875rem;
`;

const SuccessMessage = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.successBg};
  color: ${({ theme }) => theme.success};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 0.875rem;
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  justify-content: flex-end;
`;

export default SponsorProfilePage;
