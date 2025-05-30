import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatContext from '../../Context/ChatContext';
import ConversationList from './ConversationList';
import ChatInterface from './ChatInterface';
import './ChatPage.css';

const ChatPage = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { 
    currentConversation, 
    loadConversation, 
    conversationLoading,
    error,
    clearError 
  } = useContext(ChatContext);
  
  const [view, setView] = useState('inbox'); // 'inbox' or 'chat'

  useEffect(() => {
    if (conversationId) {
      setView('chat');
      loadConversation(conversationId);
    } else {
      setView('inbox');
    }
  }, [conversationId, loadConversation]);

  const handleConversationSelect = (conversation) => {
    navigate(`/chat/${conversation.id}`);
  };

  const handleBackToInbox = () => {
    navigate('/chat');
  };

  if (error) {
    return (
      <div className="chat-page-error">
        <div className="error-content">
          <h3>Something went wrong</h3>
          <p>{error}</p>
          <button onClick={clearError} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <div className="chat-container">
        {view === 'inbox' ? (
          <ConversationList onConversationSelect={handleConversationSelect} />
        ) : (
          <ChatInterface 
            conversation={currentConversation}
            onBackToInbox={handleBackToInbox}
            loading={conversationLoading}
          />
        )}
      </div>
    </div>
  );
};

export default ChatPage; 