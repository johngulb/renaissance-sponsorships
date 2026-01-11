import React, { useState } from 'react';
import styled from 'styled-components';

interface ProofUploaderProps {
  deliverableId: string;
  userId: string;
  onSubmit: (proof: {
    deliverableId: string;
    submittedBy: string;
    proofType: string;
    content: string;
    metadata?: Record<string, unknown>;
  }) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

type ProofType = 'image' | 'link' | 'text';

export const ProofUploader: React.FC<ProofUploaderProps> = ({
  deliverableId,
  userId,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [proofType, setProofType] = useState<ProofType>('link');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError('Please provide proof content');
      return;
    }

    // Validate URL for link type
    if (proofType === 'link') {
      try {
        new URL(content);
      } catch {
        setError('Please enter a valid URL');
        return;
      }
    }

    try {
      await onSubmit({
        deliverableId,
        submittedBy: userId,
        proofType,
        content: content.trim(),
        metadata: description ? { description } : undefined,
      });
      
      // Reset form
      setContent('');
      setDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit proof');
    }
  };

  return (
    <Container>
      <Header>
        <Title>Submit Proof</Title>
        <Subtitle>Provide evidence that you completed this deliverable</Subtitle>
      </Header>

      <Form onSubmit={handleSubmit}>
        <TypeSelector>
          <TypeButton
            type="button"
            $isActive={proofType === 'link'}
            onClick={() => setProofType('link')}
          >
            <TypeIcon>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </TypeIcon>
            Link
          </TypeButton>
          <TypeButton
            type="button"
            $isActive={proofType === 'image'}
            onClick={() => setProofType('image')}
          >
            <TypeIcon>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </TypeIcon>
            Image URL
          </TypeButton>
          <TypeButton
            type="button"
            $isActive={proofType === 'text'}
            onClick={() => setProofType('text')}
          >
            <TypeIcon>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="17" y1="10" x2="3" y2="10" />
                <line x1="21" y1="6" x2="3" y2="6" />
                <line x1="21" y1="14" x2="3" y2="14" />
                <line x1="17" y1="18" x2="3" y2="18" />
              </svg>
            </TypeIcon>
            Text
          </TypeButton>
        </TypeSelector>

        <InputGroup>
          <Label>
            {proofType === 'link' && 'URL'}
            {proofType === 'image' && 'Image URL'}
            {proofType === 'text' && 'Description'}
          </Label>
          {proofType === 'text' ? (
            <TextArea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe how you completed this deliverable..."
              rows={4}
            />
          ) : (
            <Input
              type="url"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                proofType === 'link'
                  ? 'https://example.com/post'
                  : 'https://example.com/image.jpg'
              }
            />
          )}
        </InputGroup>

        {proofType !== 'text' && (
          <InputGroup>
            <Label>Additional Notes (optional)</Label>
            <TextArea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any additional context..."
              rows={2}
            />
          </InputGroup>
        )}

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Actions>
          {onCancel && (
            <CancelButton type="button" onClick={onCancel}>
              Cancel
            </CancelButton>
          )}
          <SubmitButton type="submit" disabled={isLoading}>
            {isLoading ? 'Submitting...' : 'Submit Proof'}
          </SubmitButton>
        </Actions>
      </Form>
    </Container>
  );
};

const Container = styled.div`
  background: ${({ theme }) => theme.surface};
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.border};
  padding: 1.5rem;
`;

const Header = styled.div`
  margin-bottom: 1.5rem;
`;

const Title = styled.h3`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.25rem;
`;

const Subtitle = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const TypeSelector = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const TypeButton = styled.button<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border: 1px solid ${({ $isActive, theme }) => ($isActive ? theme.accent : theme.border)};
  border-radius: 8px;
  background: ${({ $isActive, theme }) => ($isActive ? `${theme.accent}15` : 'transparent')};
  color: ${({ $isActive, theme }) => ($isActive ? theme.accent : theme.textSecondary)};
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;

  &:hover {
    border-color: ${({ theme }) => theme.accent};
  }
`;

const TypeIcon = styled.span`
  width: 16px;
  height: 16px;

  svg {
    width: 100%;
    height: 100%;
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
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

  &::placeholder {
    color: ${({ theme }) => theme.textSecondary};
    opacity: 0.7;
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

  &::placeholder {
    color: ${({ theme }) => theme.textSecondary};
    opacity: 0.7;
  }
`;

const ErrorMessage = styled.p`
  color: #C62828;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  margin: 0;
  padding: 0.5rem 0.75rem;
  background: rgba(198, 40, 40, 0.1);
  border-radius: 6px;
`;

const Actions = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
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

export default ProofUploader;
