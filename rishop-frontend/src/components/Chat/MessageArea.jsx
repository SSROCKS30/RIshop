import { useEffect, useRef, useContext } from 'react';
import PropTypes from 'prop-types';
import AppContext from '../../Context/Context';
import './MessageArea.css';

const MessageArea = ({ messages, conversation, formatMessageTime }) => {
  const { user } = useContext(AppContext);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const isOwnMessage = (message) => {
    return message.sender?.id === user?.id;
  };

  const isSystemMessage = (message) => {
    return message.messageType === 'SYSTEM_MESSAGE';
  };

  const renderMessage = (message, index) => {
    const isOwn = isOwnMessage(message);
    const isSystem = isSystemMessage(message);
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showAvatar = !isSystem && (!prevMessage || prevMessage.sender?.id !== message.sender?.id);

    if (isSystem) {
      return (
        <div key={message.id} className="system-message">
          <div className="system-message-content">
            <span className="system-message-text">{message.content}</span>
            <span className="system-message-time">
              {formatMessageTime(message.sentAt)}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div
        key={message.id}
        className={`message ${isOwn ? 'own-message' : 'other-message'}`}
      >
        {showAvatar && !isOwn && (
          <div className="message-avatar">
            {message.sender?.profilePicture ? (
              <img
                src={message.sender.profilePicture}
                alt={message.sender.name}
                className="avatar-image"
              />
            ) : (
              <div className="avatar-placeholder">
                {message.sender?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
          </div>
        )}
        
        <div className={`message-content ${!showAvatar && !isOwn ? 'no-avatar' : ''}`}>
          {showAvatar && (
            <div className="message-sender">
              {isOwn ? 'You' : message.sender?.name || 'Unknown User'}
            </div>
          )}
          
          <div className="message-bubble">
            <p className="message-text">{message.content}</p>
            <div className="message-metadata">
              <span className="message-time">
                {formatMessageTime(message.sentAt)}
              </span>
              {message.isRead && isOwn && (
                <span className="read-indicator">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!messages || messages.length === 0) {
    return (
      <div className="message-area empty">
        <div className="empty-messages">
          <div className="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <h3>No messages yet</h3>
          <p>Start the conversation by sending a message!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="message-area">
      <div className="messages-container">
        {messages.map((message, index) => renderMessage(message, index))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

MessageArea.propTypes = {
  messages: PropTypes.array.isRequired,
  conversation: PropTypes.object,
  formatMessageTime: PropTypes.func.isRequired,
};

export default MessageArea; 