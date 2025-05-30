import { useState, useEffect, useRef, useContext } from 'react';
import PropTypes from 'prop-types';
import ChatContext from '../../Context/ChatContext';
import MessageArea from './MessageArea';
import TransactionControls from './TransactionControls';
import './ChatInterface.css';

const ChatInterface = ({ conversation, onBackToInbox, loading }) => {
  const {
    messages,
    sendMessage,
    sendingMessage,
    getOtherParticipant,
    getUserRole,
    formatMessageTime
  } = useContext(ChatContext);

  const [messageInput, setMessageInput] = useState('');
  const messageInputRef = useRef(null);

  useEffect(() => {
    // Focus message input when conversation loads
    if (conversation && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [conversation]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageInput.trim() || sendingMessage || !conversation) {
      return;
    }

    const messageContent = messageInput.trim();
    setMessageInput(''); // Clear input immediately for better UX

    const result = await sendMessage(conversation.id, messageContent);
    
    if (!result.success) {
      // If sending failed, restore the message
      setMessageInput(messageContent);
      // Error is handled by ChatContext
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (loading) {
    return (
      <div className="chat-interface-loading">
        <div className="loading-spinner"></div>
        <p>Loading conversation...</p>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="chat-interface-empty">
        <p>Select a conversation to start chatting</p>
      </div>
    );
  }

  const otherParticipant = getOtherParticipant(conversation);
  const userRole = getUserRole(conversation);

  return (
    <div className="chat-interface">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="header-left">
          <button
            onClick={onBackToInbox}
            className="back-button"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="participant-info">
            <div className="participant-avatar">
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
            <div className="participant-details">
              <h3>{otherParticipant?.name || 'Unknown User'}</h3>
              <span className="user-role">
                {userRole === 'buyer' ? 'Seller' : 'Buyer'}
              </span>
            </div>
          </div>
        </div>

        <div className="header-right">
          <span className="conversation-id">
            ID: #{conversation.id}
          </span>
        </div>
      </div>

      {/* Product Information Panel */}
      <div className="product-panel">
        <div className="product-info">
          {conversation.product?.image && (
            <img
              src={conversation.product.image}
              alt={conversation.product.name}
              className="product-image"
            />
          )}
          <div className="product-details">
            <h4>{conversation.product?.name || 'Unknown Product'}</h4>
            <p className="product-price">₹{conversation.product?.price || 0}</p>
            <p className="product-description">
              {conversation.product?.description || 'No description available'}
            </p>
          </div>
        </div>
      </div>

      {/* Transaction Controls */}
      <TransactionControls conversation={conversation} />

      {/* Messages Area */}
      <MessageArea
        messages={messages}
        conversation={conversation}
        formatMessageTime={formatMessageTime}
      />

      {/* Message Input */}
      <div className="message-input-container">
        <form onSubmit={handleSendMessage} className="message-form">
          <div className="input-wrapper">
            <textarea
              ref={messageInputRef}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="message-input"
              rows="1"
              disabled={sendingMessage || conversation.status === 'COMPLETED' || conversation.status === 'CANCELLED'}
            />
            <button
              type="submit"
              disabled={!messageInput.trim() || sendingMessage}
              className="send-button"
            >
              {sendingMessage ? (
                <div className="sending-spinner"></div>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22,2 15,22 11,13 2,9"></polygon>
                </svg>
              )}
            </button>
          </div>
        </form>

        {(conversation.status === 'COMPLETED' || conversation.status === 'CANCELLED') && (
          <div className="input-disabled-message">
            <p>
              {conversation.status === 'COMPLETED' 
                ? 'This conversation has been completed' 
                : 'This conversation has been cancelled'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

ChatInterface.propTypes = {
  conversation: PropTypes.object,
  onBackToInbox: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

export default ChatInterface; 