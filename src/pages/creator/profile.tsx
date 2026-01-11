import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import styled from 'styled-components';
import { useRouter } from 'next/router';
import { useUser } from '@/contexts/UserContext';
import { Loading } from '@/components/Loading';

interface CreatorProfile {
  id: string;
  displayName: string;
  bio?: string;
  specialties: string[];
  communities: string[];
  portfolioUrl?: string;
  socialLinks: Record<string, string>;
  payoutMethod?: string;
  walletAddress?: string;
}

const APP_NAME = 'Renaissance City';

const SPECIALTY_OPTIONS = [
  'Music',
  'Visual Art',
  'Photography',
  'Writing',
  'Events',
  'DJing',
  'Film/Video',
  'Design',
  'Development',
  'Community',
  'Other',
];

const CreatorProfilePage: React.FC = () => {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [communities, setCommunities] = useState<string[]>([]);
  const [communityInput, setCommunityInput] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [twitter, setTwitter] = useState('');
  const [instagram, setInstagram] = useState('');
  const [website, setWebsite] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('off-chain');
  const [walletAddress, setWalletAddress] = useState('');

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [isUserLoading, user, router]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const res = await fetch(`/api/creator/profile?userId=${user.id}`);
        if (res.ok) {
          const { profile: existingProfile } = await res.json();
          setProfile(existingProfile);
          
          setDisplayName(existingProfile.displayName || user.displayName || user.username || '');
          setBio(existingProfile.bio || '');
          setSpecialties(existingProfile.specialties || []);
          setCommunities(existingProfile.communities || []);
          setPortfolioUrl(existingProfile.portfolioUrl || '');
          setTwitter(existingProfile.socialLinks?.twitter || '');
          setInstagram(existingProfile.socialLinks?.instagram || '');
          setWebsite(existingProfile.socialLinks?.website || '');
          setPayoutMethod(existingProfile.payoutMethod || 'off-chain');
          setWalletAddress(existingProfile.walletAddress || '');
        } else {
          // Pre-populate from user data
          setDisplayName(user.displayName || user.username || '');
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

  const toggleSpecialty = (specialty: string) => {
    if (specialties.includes(specialty)) {
      setSpecialties(specialties.filter((s) => s !== specialty));
    } else {
      setSpecialties([...specialties, specialty]);
    }
  };

  const addCommunity = () => {
    if (communityInput.trim() && !communities.includes(communityInput.trim())) {
      setCommunities([...communities, communityInput.trim()]);
      setCommunityInput('');
    }
  };

  const removeCommunity = (community: string) => {
    setCommunities(communities.filter((c) => c !== community));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    if (!displayName.trim()) {
      setError('Display name is required');
      setIsSaving(false);
      return;
    }

    try {
      const socialLinks: Record<string, string> = {};
      if (twitter.trim()) socialLinks.twitter = twitter.trim();
      if (instagram.trim()) socialLinks.instagram = instagram.trim();
      if (website.trim()) socialLinks.website = website.trim();

      const payload = {
        ...(profile && { id: profile.id }),
        userId: user?.id,
        displayName: displayName.trim(),
        bio: bio.trim() || null,
        specialties,
        communities,
        portfolioUrl: portfolioUrl.trim() || null,
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : null,
        payoutMethod,
        walletAddress: walletAddress.trim() || null,
      };

      const res = await fetch('/api/creator/profile', {
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
        router.push('/creator');
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
        <title>{isEditing ? 'Edit' : 'Create'} Creator Profile | {APP_NAME}</title>
      </Head>

      <Header>
        <BackButton onClick={() => router.push('/creator')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </BackButton>
        <HeaderTitle>{isEditing ? 'Edit' : 'Create'} Creator Profile</HeaderTitle>
      </Header>

      <Main>
        <Form onSubmit={handleSubmit}>
          <Section>
            <SectionTitle>Basic Information</SectionTitle>
            
            <FormGroup>
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your creative name"
                required
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="bio">Bio</Label>
              <TextArea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell sponsors about yourself and your work..."
                rows={4}
              />
            </FormGroup>

            <FormGroup>
              <Label>Specialties</Label>
              <SpecialtiesGrid>
                {SPECIALTY_OPTIONS.map((specialty) => (
                  <SpecialtyChip
                    key={specialty}
                    type="button"
                    $isSelected={specialties.includes(specialty)}
                    onClick={() => toggleSpecialty(specialty)}
                  >
                    {specialty}
                  </SpecialtyChip>
                ))}
              </SpecialtiesGrid>
            </FormGroup>

            <FormGroup>
              <Label>Communities</Label>
              <TagInputContainer>
                <TagInput
                  type="text"
                  value={communityInput}
                  onChange={(e) => setCommunityInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCommunity();
                    }
                  }}
                  placeholder="Add a community..."
                />
                <AddTagButton type="button" onClick={addCommunity}>
                  Add
                </AddTagButton>
              </TagInputContainer>
              {communities.length > 0 && (
                <TagList>
                  {communities.map((community) => (
                    <Tag key={community}>
                      {community}
                      <TagRemove onClick={() => removeCommunity(community)}>×</TagRemove>
                    </Tag>
                  ))}
                </TagList>
              )}
            </FormGroup>
          </Section>

          <Section>
            <SectionTitle>Links & Portfolio</SectionTitle>

            <FormGroup>
              <Label htmlFor="portfolioUrl">Portfolio URL</Label>
              <Input
                id="portfolioUrl"
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://your-portfolio.com"
              />
            </FormGroup>

            <FormRow>
              <FormGroup>
                <Label htmlFor="twitter">Twitter/X</Label>
                <Input
                  id="twitter"
                  type="text"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="@username"
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@username"
                />
              </FormGroup>
            </FormRow>

            <FormGroup>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://your-website.com"
              />
            </FormGroup>
          </Section>

          <Section>
            <SectionTitle>Payment Preferences</SectionTitle>

            <FormGroup>
              <Label>Payout Method</Label>
              <RadioGroup>
                <RadioOption>
                  <input
                    type="radio"
                    name="payoutMethod"
                    value="off-chain"
                    checked={payoutMethod === 'off-chain'}
                    onChange={(e) => setPayoutMethod(e.target.value)}
                  />
                  <RadioLabel>
                    <RadioTitle>Traditional Payment</RadioTitle>
                    <RadioDescription>Bank transfer, PayPal, etc.</RadioDescription>
                  </RadioLabel>
                </RadioOption>

                <RadioOption>
                  <input
                    type="radio"
                    name="payoutMethod"
                    value="wallet"
                    checked={payoutMethod === 'wallet'}
                    onChange={(e) => setPayoutMethod(e.target.value)}
                  />
                  <RadioLabel>
                    <RadioTitle>Crypto Wallet</RadioTitle>
                    <RadioDescription>Receive via blockchain</RadioDescription>
                  </RadioLabel>
                </RadioOption>
              </RadioGroup>
            </FormGroup>

            {payoutMethod === 'wallet' && (
              <FormGroup>
                <Label htmlFor="walletAddress">Wallet Address</Label>
                <Input
                  id="walletAddress"
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x..."
                />
              </FormGroup>
            )}
          </Section>

          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}

          <Actions>
            <CancelButton type="button" onClick={() => router.push('/creator')}>
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
  min-height: 100px;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
  }
`;

const SpecialtiesGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const SpecialtyChip = styled.button<{ $isSelected: boolean }>`
  padding: 0.4rem 0.75rem;
  border: 1px solid ${({ $isSelected, theme }) => ($isSelected ? theme.accent : theme.border)};
  border-radius: 20px;
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

const TagInputContainer = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const TagInput = styled(Input)`
  flex: 1;
`;

const AddTagButton = styled.button`
  padding: 0.75rem 1rem;
  border: 1px solid ${({ theme }) => theme.accent};
  border-radius: 8px;
  background: transparent;
  color: ${({ theme }) => theme.accent};
  cursor: pointer;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.accent};
    color: #fff;
  }
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const Tag = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: ${({ theme }) => theme.backgroundAlt};
  border-radius: 4px;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.text};
`;

const TagRemove = styled.button`
  border: none;
  background: none;
  color: ${({ theme }) => theme.textSecondary};
  cursor: pointer;
  padding: 0;
  font-size: 1.1rem;
  line-height: 1;

  &:hover {
    color: #C62828;
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

export default CreatorProfilePage;
