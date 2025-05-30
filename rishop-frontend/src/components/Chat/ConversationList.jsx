import { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import ChatContext from '../../Context/ChatContext';
import './ConversationList.css';

const ConversationList = ({ onConversationSelect }) => {
  const {
    conversations,
    conversationsLoading,
    loadConversations,
    notifications,
    getOtherParticipant,
    getStatusDisplayText,
    getStatusColor,
    formatMessageTime
  } = useContext(ChatContext);

  const [filteredConversations, setFilteredConversations] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    let filtered = conversations;

    // Apply status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(conv => conv.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(conv => {
        const otherParticipant = getOtherParticipant(conv);
        const productName = conv.product?.name || '';
        return (
          otherParticipant?.name?.toLowerCase().includes(term) ||
          productName.toLowerCase().includes(term)
        );
      });
    }

    // Sort by updated time (most recent first)
    filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    setFilteredConversations(filtered);
  }, [conversations, statusFilter, searchTerm, getOtherParticipant]);

  const handleConversationClick = (conversation) => {
    onConversationSelect(conversation);
  };

  const getUnreadCount = (conversation) => {
    // This would typically come from the conversation object
    return conversation.unreadCount || 0;
  };

  if (conversationsLoading) {
    return (
      <div className="conversation-list-loading">
        <div className="loading-spinner"></div>
        <p>Loading conversations...</p>
      </div>
    );
  }

  return (
    <div className="conversation-list">
      <div className="conversation-list-header">
        <h2>Messages</h2>
        {notifications.totalNotifications > 0 && (
          <span className="notification-badge">
            {notifications.totalNotifications}
          </span>
        )}
      </div>

      <div className="conversation-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="status-filters">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter-select"
          >
            <option value="ALL">All Conversations</option>
            <option value="ACTIVE">Active</option>
            <option value="BUYER_APPROVED">Buyer Approved</option>
            <option value="SELLER_APPROVED">Seller Approved</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      <div className="conversations-container">
        {filteredConversations.length === 0 ? (
          <div className="no-conversations">
            {conversations.length === 0 ? (
              <div className="empty-state">
                <h3>No conversations yet</h3>
                <p>Start shopping and contact sellers to see conversations here!</p>
              </div>
            ) : (
              <div className="no-results">
                <p>No conversations match your filters</p>
              </div>
            )}
          </div>
        ) : (
          <div className="conversations-list">
            {filteredConversations.map((conversation) => {
              const otherParticipant = getOtherParticipant(conversation);
              const unreadCount = getUnreadCount(conversation);
              const lastMessage = conversation.lastMessage;

              return (
                <div
                  key={conversation.id}
                  className={`conversation-item ${unreadCount > 0 ? 'unread' : ''}`}
                  onClick={() => handleConversationClick(conversation)}
                >
                  <div className="conversation-avatar">
                    {otherParticipant?.profilePicture ? (
                      <img
                        src={otherParticipant.profilePicture}
                        alt={otherParticipant.name}
                        className="avatar-image"
                      />
                    ) : (
                      <div className="avatar-placeholder">
                        {otherParticipant?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>

                  <div className="conversation-content">
                    <div className="conversation-header">
                      <h4 className="participant-name">
                        {otherParticipant?.name || 'Unknown User'}
                      </h4>
                      <span className="conversation-time">
                        {formatMessageTime(conversation.updatedAt)}
                      </span>
                    </div>

                    <div className="product-info">
                      <div className="product-details">
                        {conversation.product?.image && (
                          <img
                            src={conversation.product.image}
                            alt={conversation.product.name}
                            className="product-thumbnail"
                          />
                        )}
                        <span className="product-name">
                          {conversation.product?.name || 'Unknown Product'}
                        </span>
                      </div>
                      <span className="product-price">
                        ₹{conversation.product?.price || 0}
                      </span>
                    </div>

                    <div className="last-message">
                      <p className="message-preview">
                        {lastMessage?.content || 'No messages yet'}
                      </p>
                    </div>

                    <div className="conversation-footer">
                      <span
                        className="conversation-status"
                        style={{ color: getStatusColor(conversation.status) }}
                      >
                        {getStatusDisplayText(conversation.status)}
                      </span>
                      {unreadCount > 0 && (
                        <span className="unread-count">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

ConversationList.propTypes = {
  onConversationSelect: PropTypes.func.isRequired,
};

export default ConversationList; 