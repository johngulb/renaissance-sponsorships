import React from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/router';

interface RoleSelectorProps {
  hasSponsorProfile: boolean;
  hasCreatorProfile: boolean;
  currentRole?: 'sponsor' | 'creator';
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  hasSponsorProfile,
  hasCreatorProfile,
  currentRole,
}) => {
  const router = useRouter();

  const handleRoleSwitch = (role: 'sponsor' | 'creator') => {
    if (role === 'sponsor' && hasSponsorProfile) {
      router.push('/sponsor');
    } else if (role === 'creator' && hasCreatorProfile) {
      router.push('/creator');
    }
  };

  return (
    <Container>
      <RoleButton
        $isActive={currentRole === 'sponsor'}
        $isEnabled={hasSponsorProfile}
        onClick={() => handleRoleSwitch('sponsor')}
        disabled={!hasSponsorProfile}
      >
        <RoleIcon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4" />
          </svg>
        </RoleIcon>
        <RoleLabel>Sponsor</RoleLabel>
        {!hasSponsorProfile && <SetupBadge>Setup</SetupBadge>}
      </RoleButton>

      <Divider />

      <RoleButton
        $isActive={currentRole === 'creator'}
        $isEnabled={hasCreatorProfile}
        onClick={() => handleRoleSwitch('creator')}
        disabled={!hasCreatorProfile}
      >
        <RoleIcon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </RoleIcon>
        <RoleLabel>Creator</RoleLabel>
        {!hasCreatorProfile && <SetupBadge>Setup</SetupBadge>}
      </RoleButton>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem;
  background: ${({ theme }) => theme.backgroundAlt};
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.border};
`;

const RoleButton = styled.button<{ $isActive: boolean; $isEnabled: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  cursor: ${({ $isEnabled }) => ($isEnabled ? 'pointer' : 'default')};
  transition: all 0.2s ease;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  position: relative;
  
  background: ${({ $isActive, $isEnabled, theme }) =>
    $isActive
      ? `linear-gradient(135deg, ${theme.accent}, ${theme.accentGold})`
      : $isEnabled
      ? theme.surface
      : 'transparent'};
  
  color: ${({ $isActive, $isEnabled, theme }) =>
    $isActive ? '#fff' : $isEnabled ? theme.text : theme.textSecondary};
  
  opacity: ${({ $isEnabled }) => ($isEnabled ? 1 : 0.6)};
  
  &:hover:not(:disabled) {
    ${({ $isActive, theme }) =>
      !$isActive &&
      `
      background: ${theme.surface};
      box-shadow: 0 2px 4px ${theme.shadow};
    `}
  }
`;

const RoleIcon = styled.span`
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 100%;
    height: 100%;
  }
`;

const RoleLabel = styled.span`
  font-weight: 500;
`;

const Divider = styled.div`
  width: 1px;
  height: 24px;
  background: ${({ theme }) => theme.border};
`;

const SetupBadge = styled.span`
  font-size: 0.65rem;
  padding: 0.15rem 0.4rem;
  background: ${({ theme }) => theme.accentGold};
  color: #fff;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export default RoleSelector;
