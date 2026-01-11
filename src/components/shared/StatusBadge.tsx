import React from 'react';
import styled from 'styled-components';

type CampaignStatus = 'draft' | 'active' | 'completed' | 'disputed' | 'cancelled';
type DeliverableStatus = 'pending' | 'in_progress' | 'submitted' | 'verified' | 'rejected';
type ProofStatus = 'pending' | 'approved' | 'rejected';
type CreditStatus = 'active' | 'redeemed' | 'expired' | 'cancelled';

type StatusType = CampaignStatus | DeliverableStatus | ProofStatus | CreditStatus;

interface StatusBadgeProps {
  status: StatusType;
  size?: 'small' | 'medium' | 'large';
}

const getStatusConfig = (status: StatusType) => {
  const configs: Record<StatusType, { label: string; color: string; bgColor: string }> = {
    // Campaign statuses
    draft: { label: 'Draft', color: '#6B5344', bgColor: 'rgba(107, 83, 68, 0.15)' },
    active: { label: 'Active', color: '#2E7D32', bgColor: 'rgba(46, 125, 50, 0.15)' },
    completed: { label: 'Completed', color: '#1565C0', bgColor: 'rgba(21, 101, 192, 0.15)' },
    disputed: { label: 'Disputed', color: '#C62828', bgColor: 'rgba(198, 40, 40, 0.15)' },
    cancelled: { label: 'Cancelled', color: '#757575', bgColor: 'rgba(117, 117, 117, 0.15)' },
    
    // Deliverable statuses
    pending: { label: 'Pending', color: '#EF6C00', bgColor: 'rgba(239, 108, 0, 0.15)' },
    in_progress: { label: 'In Progress', color: '#7B1FA2', bgColor: 'rgba(123, 31, 162, 0.15)' },
    submitted: { label: 'Submitted', color: '#00838F', bgColor: 'rgba(0, 131, 143, 0.15)' },
    verified: { label: 'Verified', color: '#2E7D32', bgColor: 'rgba(46, 125, 50, 0.15)' },
    rejected: { label: 'Rejected', color: '#C62828', bgColor: 'rgba(198, 40, 40, 0.15)' },
    
    // Proof statuses (shares some with deliverable)
    approved: { label: 'Approved', color: '#2E7D32', bgColor: 'rgba(46, 125, 50, 0.15)' },
    
    // Credit statuses
    redeemed: { label: 'Redeemed', color: '#1565C0', bgColor: 'rgba(21, 101, 192, 0.15)' },
    expired: { label: 'Expired', color: '#757575', bgColor: 'rgba(117, 117, 117, 0.15)' },
  };
  
  return configs[status] || { label: status, color: '#6B5344', bgColor: 'rgba(107, 83, 68, 0.15)' };
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'medium' }) => {
  const config = getStatusConfig(status);
  
  return (
    <Badge $color={config.color} $bgColor={config.bgColor} $size={size}>
      <Dot $color={config.color} />
      {config.label}
    </Badge>
  );
};

const Badge = styled.span<{ $color: string; $bgColor: string; $size: 'small' | 'medium' | 'large' }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ $size }) => ($size === 'small' ? '0.25rem' : '0.375rem')};
  padding: ${({ $size }) => {
    switch ($size) {
      case 'small': return '0.2rem 0.5rem';
      case 'large': return '0.4rem 0.8rem';
      default: return '0.3rem 0.6rem';
    }
  }};
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: ${({ $size }) => {
    switch ($size) {
      case 'small': return '0.7rem';
      case 'large': return '0.9rem';
      default: return '0.8rem';
    }
  }};
  font-weight: 500;
  color: ${({ $color }) => $color};
  background: ${({ $bgColor }) => $bgColor};
  border-radius: 6px;
  text-transform: capitalize;
  white-space: nowrap;
`;

const Dot = styled.span<{ $color: string }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`;

export default StatusBadge;
