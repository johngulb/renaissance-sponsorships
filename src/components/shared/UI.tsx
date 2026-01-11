import styled, { css } from 'styled-components';
import Link from 'next/link';

// ============================================
// BUTTONS
// ============================================

const buttonBase = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  font-size: 0.875rem;
  font-weight: 500;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.md};
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  text-decoration: none;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; $size?: 'sm' | 'md' | 'lg' }>`
  ${buttonBase}

  ${({ $size }) => $size === 'sm' && css`
    padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
    font-size: 0.75rem;
  `}

  ${({ $size }) => $size === 'lg' && css`
    padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
    font-size: 1rem;
  `}

  ${({ $variant, theme }) => {
    switch ($variant) {
      case 'secondary':
        return css`
          background: ${theme.backgroundAlt};
          color: ${theme.text};
          &:hover:not(:disabled) {
            background: ${theme.border};
          }
        `;
      case 'ghost':
        return css`
          background: transparent;
          color: ${theme.textSecondary};
          &:hover:not(:disabled) {
            background: ${theme.backgroundAlt};
            color: ${theme.text};
          }
        `;
      case 'danger':
        return css`
          background: ${theme.error};
          color: white;
          &:hover:not(:disabled) {
            opacity: 0.9;
          }
        `;
      default: // primary
        return css`
          background: ${theme.accent};
          color: white;
          &:hover:not(:disabled) {
            opacity: 0.9;
          }
        `;
    }
  }}
`;

export const ButtonLink = styled(Link)<{ $variant?: 'primary' | 'secondary' | 'ghost' }>`
  ${buttonBase}

  ${({ $variant, theme }) => {
    switch ($variant) {
      case 'secondary':
        return css`
          background: ${theme.backgroundAlt};
          color: ${theme.text};
          &:hover {
            background: ${theme.border};
          }
        `;
      case 'ghost':
        return css`
          background: transparent;
          color: ${theme.textSecondary};
          &:hover {
            background: ${theme.backgroundAlt};
            color: ${theme.text};
          }
        `;
      default:
        return css`
          background: ${theme.accent};
          color: white;
          &:hover {
            opacity: 0.9;
          }
        `;
    }
  }}
`;

// ============================================
// CARDS
// ============================================

export const Card = styled.div<{ $interactive?: boolean }>`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.spacing.lg};

  ${({ $interactive, theme }) => $interactive && css`
    cursor: pointer;
    transition: all 0.15s ease;
    &:hover {
      background: ${theme.surfaceHover};
      border-color: ${theme.textMuted};
    }
  `}
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

export const CardTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

export const CardDescription = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0;
  line-height: 1.5;
`;

// ============================================
// FORMS
// ============================================

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const FormRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`;

export const Label = styled.label`
  font-size: 0.8125rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`;

export const Input = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  font-size: 16px;
  color: ${({ theme }) => theme.text};
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius.md};
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &::placeholder {
    color: ${({ theme }) => theme.textMuted};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.accent}20;
  }

  &:disabled {
    background: ${({ theme }) => theme.backgroundAlt};
    cursor: not-allowed;
  }
`;

export const TextArea = styled.textarea`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  font-size: 16px;
  font-family: inherit;
  color: ${({ theme }) => theme.text};
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius.md};
  resize: vertical;
  min-height: 100px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &::placeholder {
    color: ${({ theme }) => theme.textMuted};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.accent}20;
  }
`;

export const Select = styled.select`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  font-size: 16px;
  color: ${({ theme }) => theme.text};
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;
  transition: border-color 0.15s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.accent}20;
  }
`;

export const HelperText = styled.span<{ $error?: boolean }>`
  font-size: 0.75rem;
  color: ${({ theme, $error }) => $error ? theme.error : theme.textMuted};
`;

// ============================================
// LAYOUT
// ============================================

export const Stack = styled.div<{ $gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme, $gap = 'md' }) => theme.spacing[$gap]};
`;

export const Row = styled.div<{ $gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; $align?: string; $justify?: string }>`
  display: flex;
  flex-direction: row;
  align-items: ${({ $align }) => $align || 'center'};
  justify-content: ${({ $justify }) => $justify || 'flex-start'};
  gap: ${({ theme, $gap = 'md' }) => theme.spacing[$gap]};
`;

export const Spacer = styled.div<{ $size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' }>`
  height: ${({ theme, $size = 'md' }) => theme.spacing[$size]};
`;

export const Divider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.border};
  margin: ${({ theme }) => theme.spacing.md} 0;
`;

// ============================================
// BADGES & STATUS
// ============================================

export const Badge = styled.span<{ $variant?: 'default' | 'success' | 'warning' | 'error' | 'accent' }>`
  display: inline-flex;
  align-items: center;
  padding: 2px ${({ theme }) => theme.spacing.sm};
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-radius: ${({ theme }) => theme.radius.sm};

  ${({ $variant, theme }) => {
    switch ($variant) {
      case 'success':
        return css`
          background: ${theme.successBg};
          color: ${theme.success};
        `;
      case 'warning':
        return css`
          background: ${theme.warningBg};
          color: ${theme.warning};
        `;
      case 'error':
        return css`
          background: ${theme.errorBg};
          color: ${theme.error};
        `;
      case 'accent':
        return css`
          background: ${theme.accent}15;
          color: ${theme.accent};
        `;
      default:
        return css`
          background: ${theme.backgroundAlt};
          color: ${theme.textSecondary};
        `;
    }
  }}
`;

// ============================================
// TYPOGRAPHY
// ============================================

export const Heading = styled.h1<{ $size?: 'sm' | 'md' | 'lg' | 'xl' }>`
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0;

  ${({ $size }) => {
    switch ($size) {
      case 'sm':
        return css`font-size: 1rem;`;
      case 'md':
        return css`font-size: 1.25rem;`;
      case 'lg':
        return css`font-size: 1.5rem;`;
      case 'xl':
        return css`font-size: 2rem;`;
      default:
        return css`font-size: 1.25rem;`;
    }
  }}
`;

export const Text = styled.p<{ $size?: 'sm' | 'md' | 'lg'; $color?: 'default' | 'secondary' | 'muted' }>`
  margin: 0;
  line-height: 1.5;

  ${({ $size }) => {
    switch ($size) {
      case 'sm':
        return css`font-size: 0.8125rem;`;
      case 'lg':
        return css`font-size: 1.125rem;`;
      default:
        return css`font-size: 0.9375rem;`;
    }
  }}

  ${({ $color, theme }) => {
    switch ($color) {
      case 'secondary':
        return css`color: ${theme.textSecondary};`;
      case 'muted':
        return css`color: ${theme.textMuted};`;
      default:
        return css`color: ${theme.text};`;
    }
  }}
`;

// ============================================
// LISTS
// ============================================

export const List = styled.div`
  display: flex;
  flex-direction: column;
`;

export const ListItem = styled.div<{ $interactive?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.border};

  &:last-child {
    border-bottom: none;
  }

  ${({ $interactive, theme }) => $interactive && css`
    cursor: pointer;
    transition: background 0.15s ease;
    &:hover {
      background: ${theme.backgroundAlt};
    }
  `}
`;

// ============================================
// EMPTY STATE
// ============================================

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.xxl};
  text-align: center;
  color: ${({ theme }) => theme.textMuted};

  svg {
    margin-bottom: ${({ theme }) => theme.spacing.md};
    opacity: 0.5;
  }
`;

export const EmptyStateTitle = styled.h3`
  font-size: 1rem;
  font-weight: 500;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0 0 ${({ theme }) => theme.spacing.xs};
`;

export const EmptyStateText = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.textMuted};
  margin: 0 0 ${({ theme }) => theme.spacing.lg};
`;

// ============================================
// AVATAR
// ============================================

export const Avatar = styled.div<{ $size?: 'sm' | 'md' | 'lg' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.backgroundAlt};
  color: ${({ theme }) => theme.textSecondary};
  font-weight: 600;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  ${({ $size }) => {
    switch ($size) {
      case 'sm':
        return css`
          width: 32px;
          height: 32px;
          font-size: 0.75rem;
        `;
      case 'lg':
        return css`
          width: 64px;
          height: 64px;
          font-size: 1.25rem;
        `;
      default:
        return css`
          width: 40px;
          height: 40px;
          font-size: 0.875rem;
        `;
    }
  }}
`;

// ============================================
// LOADING
// ============================================

export const LoadingSpinner = styled.div`
  width: 24px;
  height: 24px;
  border: 2px solid ${({ theme }) => theme.border};
  border-top-color: ${({ theme }) => theme.accent};
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.xxl};
`;

// ============================================
// SECTION
// ============================================

export const Section = styled.section`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

export const SectionTitle = styled.h2`
  font-size: 0.8125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
`;
