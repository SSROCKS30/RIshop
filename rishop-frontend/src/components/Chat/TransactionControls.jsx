import { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import ChatContext from '../../Context/ChatContext';
import './TransactionControls.css';

const TransactionControls = ({ conversation }) => {
  const {
    approveTransaction,
    cancelConversation,
    canUserApprove,
    getStatusDisplayText,
    getStatusColor,
    getUserRole
  } = useContext(ChatContext);

  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [approving, setApproving] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  if (!conversation) return null;

  const userRole = getUserRole(conversation);
  const canApprove = canUserApprove(conversation);
  const status = conversation.status;
  const statusColor = getStatusColor(status);
  const statusText = getStatusDisplayText(status);

  const handleApprove = async () => {
    setApproving(true);
    
    try {
      const result = await approveTransaction(conversation.id);
      
      if (result.success) {
        setShowApprovalModal(false);
        // Success feedback is handled by the parent component
      }
      // Error is handled by ChatContext
    } finally {
      setApproving(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    
    try {
      const result = await cancelConversation(conversation.id);
      
      if (result.success) {
        setShowCancelModal(false);
        // Success feedback is handled by the parent component
      }
      // Error is handled by ChatContext
    } finally {
      setCancelling(false);
    }
  };

  const getApprovalStatusText = () => {
    switch (status) {
      case 'ACTIVE':
        return 'Ready for approval when both parties agree';
      case 'BUYER_APPROVED':
        return userRole === 'buyer' 
          ? 'You have approved. Waiting for seller approval.' 
          : 'Buyer has approved. You can approve to complete the transaction.';
      case 'SELLER_APPROVED':
        return userRole === 'seller' 
          ? 'You have approved. Waiting for buyer approval.' 
          : 'Seller has approved. You can approve to complete the transaction.';
      case 'COMPLETED':
        return 'Transaction completed successfully!';
      case 'CANCELLED':
        return 'This conversation has been cancelled.';
      default:
        return '';
    }
  };

  const renderApprovalModal = () => (
    <div className="modal-overlay" onClick={() => setShowApprovalModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Approve Transaction</h3>
        <div className="modal-body">
          <p>Are you sure you want to approve this transaction?</p>
          <div className="product-summary">
            <img 
              src={conversation.product?.image} 
              alt={conversation.product?.name}
              className="product-image-small"
            />
            <div>
              <h4>{conversation.product?.name}</h4>
              <p>₹{conversation.product?.price}</p>
            </div>
          </div>
          <p className="approval-note">
            {status === 'ACTIVE' 
              ? 'Once you approve, the other party will be notified and can also approve to complete the transaction.'
              : 'The other party has already approved. Approving will complete the transaction immediately.'
            }
          </p>
        </div>
        <div className="modal-actions">
          <button
            onClick={() => setShowApprovalModal(false)}
            className="btn btn-secondary"
            disabled={approving}
          >
            Cancel
          </button>
          <button
            onClick={handleApprove}
            className="btn btn-success"
            disabled={approving}
          >
            {approving ? 'Approving...' : 'Approve Transaction'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderCancelModal = () => (
    <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Cancel Conversation</h3>
        <div className="modal-body">
          <p>Are you sure you want to cancel this conversation?</p>
          <p className="cancel-warning">
            This action cannot be undone. The conversation will be closed and no transaction will occur.
          </p>
        </div>
        <div className="modal-actions">
          <button
            onClick={() => setShowCancelModal(false)}
            className="btn btn-secondary"
            disabled={cancelling}
          >
            Keep Conversation
          </button>
          <button
            onClick={handleCancel}
            className="btn btn-danger"
            disabled={cancelling}
          >
            {cancelling ? 'Cancelling...' : 'Cancel Conversation'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="transaction-controls">
      <div className="status-section">
        <div className="status-indicator">
          <span 
            className="status-badge"
            style={{ backgroundColor: statusColor }}
          >
            {statusText}
          </span>
        </div>
        <p className="status-description">
          {getApprovalStatusText()}
        </p>
      </div>

      {(status === 'ACTIVE' || status === 'BUYER_APPROVED' || status === 'SELLER_APPROVED') && (
        <div className="action-buttons">
          {canApprove && (
            <button
              onClick={() => setShowApprovalModal(true)}
              className="btn btn-success approve-btn"
              disabled={approving}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="20,6 9,17 4,12"></polyline>
              </svg>
              {status === 'ACTIVE' ? 'Approve Transaction' : 'Complete Transaction'}
            </button>
          )}

          <button
            onClick={() => setShowCancelModal(true)}
            className="btn btn-outline-danger cancel-btn"
            disabled={cancelling}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Cancel
          </button>
        </div>
      )}

      {status === 'COMPLETED' && (
        <div className="completion-info">
          <div className="completion-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="20,6 9,17 4,12"></polyline>
            </svg>
          </div>
          <p>Transaction completed successfully!</p>
          <small>The product has been added to your order history.</small>
        </div>
      )}

      {/* Modals */}
      {showApprovalModal && renderApprovalModal()}
      {showCancelModal && renderCancelModal()}
    </div>
  );
};

TransactionControls.propTypes = {
  conversation: PropTypes.object.isRequired,
};

export default TransactionControls; 