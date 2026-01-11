import React from 'react';
import styled from 'styled-components';
import { StatusBadge } from './StatusBadge';

export interface Deliverable {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  deadline?: Date | string | null;
  verificationMethod: string;
  status: string;
  proofs?: Array<{
    id: string;
    status: string;
  }>;
}

interface DeliverableChecklistProps {
  deliverables: Deliverable[];
  onDeliverableClick?: (deliverable: Deliverable) => void;
  showProofButton?: boolean;
  onSubmitProof?: (deliverableId: string) => void;
}

const getDeliverableTypeIcon = (type: string) => {
  switch (type) {
    case 'event_appearance':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'content_post':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      );
    case 'check_in':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      );
  }
};

const formatDeadline = (deadline: Date | string | null | undefined) => {
  if (!deadline) return null;
  const date = new Date(deadline);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { text: `${Math.abs(diffDays)} days overdue`, isOverdue: true };
  } else if (diffDays === 0) {
    return { text: 'Due today', isOverdue: false };
  } else if (diffDays === 1) {
    return { text: 'Due tomorrow', isOverdue: false };
  } else if (diffDays <= 7) {
    return { text: `Due in ${diffDays} days`, isOverdue: false };
  } else {
    return { 
      text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 
      isOverdue: false 
    };
  }
};

export const DeliverableChecklist: React.FC<DeliverableChecklistProps> = ({
  deliverables,
  onDeliverableClick,
  showProofButton = false,
  onSubmitProof,
}) => {
  return (
    <Container>
      <Header>
        <Title>Deliverables</Title>
        <Count>{deliverables.length} items</Count>
      </Header>
      
      <List>
        {deliverables.map((deliverable) => {
          const deadline = formatDeadline(deliverable.deadline);
          const canSubmitProof = 
            showProofButton && 
            ['pending', 'in_progress', 'rejected'].includes(deliverable.status);
          
          return (
            <Item 
              key={deliverable.id} 
              onClick={() => onDeliverableClick?.(deliverable)}
              $clickable={!!onDeliverableClick}
            >
              <ItemIcon $status={deliverable.status}>
                {getDeliverableTypeIcon(deliverable.type)}
              </ItemIcon>
              
              <ItemContent>
                <ItemHeader>
                  <ItemTitle>{deliverable.title}</ItemTitle>
                  <StatusBadge status={deliverable.status as 'pending' | 'in_progress' | 'submitted' | 'verified' | 'rejected'} size="small" />
                </ItemHeader>
                
                {deliverable.description && (
                  <ItemDescription>{deliverable.description}</ItemDescription>
                )}
                
                <ItemMeta>
                  <MetaItem>
                    <TypeLabel>
                      {deliverable.type.replace(/_/g, ' ')}
                    </TypeLabel>
                  </MetaItem>
                  
                  {deadline && (
                    <MetaItem $isOverdue={deadline.isOverdue}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {deadline.text}
                    </MetaItem>
                  )}
                  
                  {deliverable.proofs && deliverable.proofs.length > 0 && (
                    <MetaItem>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      {deliverable.proofs.length} proof{deliverable.proofs.length !== 1 ? 's' : ''}
                    </MetaItem>
                  )}
                </ItemMeta>
              </ItemContent>

              {canSubmitProof && (
                <SubmitProofButton
                  onClick={(e) => {
                    e.stopPropagation();
                    onSubmitProof?.(deliverable.id);
                  }}
                >
                  Submit Proof
                </SubmitProofButton>
              )}
            </Item>
          );
        })}
      </List>
    </Container>
  );
};

const Container = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const Title = styled.h3`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const Count = styled.span`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textSecondary};
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
`;

const Item = styled.div<{ $clickable: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  transition: background 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${({ $clickable, theme }) => ($clickable ? theme.backgroundAlt : 'transparent')};
  }
`;

const ItemIcon = styled.div<{ $status: string }>`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  background: ${({ $status, theme }) => {
    switch ($status) {
      case 'verified': return 'rgba(46, 125, 50, 0.15)';
      case 'submitted': return 'rgba(0, 131, 143, 0.15)';
      case 'rejected': return 'rgba(198, 40, 40, 0.15)';
      default: return theme.backgroundAlt;
    }
  }};
  
  color: ${({ $status, theme }) => {
    switch ($status) {
      case 'verified': return '#2E7D32';
      case 'submitted': return '#00838F';
      case 'rejected': return '#C62828';
      default: return theme.textSecondary;
    }
  }};

  svg {
    width: 18px;
    height: 18px;
  }
`;

const ItemContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ItemHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
  flex-wrap: wrap;
`;

const ItemTitle = styled.h4`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const ItemDescription = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0 0 0.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ItemMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const MetaItem = styled.span<{ $isOverdue?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.75rem;
  color: ${({ $isOverdue, theme }) => ($isOverdue ? '#C62828' : theme.textSecondary)};

  svg {
    width: 12px;
    height: 12px;
  }
`;

const TypeLabel = styled.span`
  text-transform: capitalize;
  padding: 0.15rem 0.4rem;
  background: ${({ theme }) => theme.backgroundAlt};
  border-radius: 4px;
`;

const SubmitProofButton = styled.button`
  padding: 0.4rem 0.75rem;
  border: 1px solid ${({ theme }) => theme.accent};
  border-radius: 6px;
  background: transparent;
  color: ${({ theme }) => theme.accent};
  cursor: pointer;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.accent};
    color: #fff;
  }
`;

export default DeliverableChecklist;
