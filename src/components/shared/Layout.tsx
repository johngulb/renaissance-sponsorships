import React, { ReactNode } from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUser } from '@/contexts/UserContext';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  backHref?: string;
  rightAction?: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  showBack = false,
  backHref,
  rightAction,
}) => {
  const router = useRouter();
  const { user } = useUser();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  // Determine active role from current path
  const isSponsorPath = router.pathname.startsWith('/sponsor');
  const isCreatorPath = router.pathname.startsWith('/creator');

  return (
    <Container>
      <Header>
        <HeaderContent>
          <HeaderLeft>
            {showBack && (
              <BackButton onClick={handleBack} aria-label="Go back">
                <BackIcon />
              </BackButton>
            )}
            {title && <Title>{title}</Title>}
          </HeaderLeft>
          <HeaderRight>
            {rightAction}
          </HeaderRight>
        </HeaderContent>
      </Header>

      <Main>{children}</Main>

      {user && (
        <NavBar>
          <NavContent>
            <NavLink href="/dashboard" $active={router.pathname === '/dashboard'}>
              <HomeIcon />
              <NavLabel>Home</NavLabel>
            </NavLink>

            {(isSponsorPath || (!isCreatorPath && user)) && (
              <>
                <NavLink href="/sponsor/campaigns" $active={router.pathname.startsWith('/sponsor/campaigns')}>
                  <CampaignIcon />
                  <NavLabel>Campaigns</NavLabel>
                </NavLink>
                <NavLink href="/sponsor/credits" $active={router.pathname === '/sponsor/credits'}>
                  <CreditIcon />
                  <NavLabel>Credits</NavLabel>
                </NavLink>
              </>
            )}

            {isCreatorPath && (
              <>
                <NavLink href="/creator/offerings" $active={router.pathname === '/creator/offerings'}>
                  <OfferIcon />
                  <NavLabel>Offerings</NavLabel>
                </NavLink>
                <NavLink href="/creator/campaigns" $active={router.pathname.startsWith('/creator/campaigns')}>
                  <CampaignIcon />
                  <NavLabel>Campaigns</NavLabel>
                </NavLink>
              </>
            )}

            <NavLink 
              href={isSponsorPath ? '/sponsor/profile' : isCreatorPath ? '/creator/profile' : '/dashboard'}
              $active={router.pathname.includes('/profile')}
            >
              <ProfileIcon />
              <NavLabel>Profile</NavLabel>
            </NavLink>
          </NavContent>
        </NavBar>
      )}
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.background};
`;

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 100;
  background: ${({ theme }) => theme.surface};
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  max-width: 600px;
  margin: 0 auto;
  min-height: 56px;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: ${({ theme }) => theme.backgroundAlt};
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;
  color: ${({ theme }) => theme.text};
  transition: background 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.border};
  }
`;

const Title = styled.h1`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const Main = styled.main`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.lg};
  padding-bottom: calc(${({ theme }) => theme.spacing.xxl} + 60px);
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
`;

const NavBar = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: ${({ theme }) => theme.surface};
  border-top: 1px solid ${({ theme }) => theme.border};
  padding-bottom: env(safe-area-inset-bottom, 0);
  z-index: 100;
`;

const NavContent = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  max-width: 600px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.sm} 0;
`;

const NavLink = styled(Link)<{ $active?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
  color: ${({ theme, $active }) => $active ? theme.accent : theme.textMuted};
  text-decoration: none;
  transition: color 0.15s ease;

  svg {
    stroke: ${({ theme, $active }) => $active ? theme.accent : theme.textMuted};
    transition: stroke 0.15s ease;
  }

  &:hover {
    color: ${({ theme }) => theme.text};
    svg {
      stroke: ${({ theme }) => theme.text};
    }
  }
`;

const NavLabel = styled.span`
  font-size: 0.625rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.02em;
`;

// Icons
const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);

const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9,22 9,12 15,12 15,22"/>
  </svg>
);

const CampaignIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const CreditIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);

const OfferIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const ProfileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

export default Layout;
