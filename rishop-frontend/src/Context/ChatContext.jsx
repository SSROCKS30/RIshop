import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import PropTypes from 'prop-types';
import ChatAPI from '../services/chatApi';
import AppContext from './Context';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { authToken, user } = useContext(AppContext);

  // ===== CONVERSATION STATE =====
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(false);

  // ===== MESSAGE STATE =====
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // ===== NOTIFICATION STATE =====
  const [notifications, setNotifications] = useState({
    unreadConversations: 0,
    pendingApprovals: 0,
    totalNotifications: 0,
    hasNotifications: false
  });
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // ===== SEARCH STATE =====
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // ===== UI STATE =====
  const [chatSidebarOpen, setChatSidebarOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // ===== ERROR STATE =====
  const [error, setError] = useState(null);

  // ===== CONVERSATION FUNCTIONS =====

  /**
   * Initiate a new conversation for a product
   */
  const initiateConversation = useCallback(async (productId) => {
    try {
      setConversationLoading(true);
      setError(null);
      
      const result = await ChatAPI.initiateConversation(productId);
      
      if (result.success) {
        // Add new conversation to the list or update existing
        const newConversation = result.data.conversation;
        setConversations(prev => {
          const existing = prev.find(conv => conv.id === newConversation.id);
          if (existing) {
            return prev.map(conv => 
              conv.id === newConversation.id ? newConversation : conv
            );
          } else {
            return [newConversation, ...prev];
          }
        });
        
        // Set as current conversation and open chat
        setCurrentConversation(newConversation);
        setSelectedConversationId(newConversation.id);
        setChatSidebarOpen(true);
        
        // Load messages for the conversation
        await loadMessages(newConversation.id);
        
        return { success: true, conversation: newConversation };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      setError('Failed to initiate conversation');
      return { success: false, error: 'Failed to initiate conversation' };
    } finally {
      setConversationLoading(false);
    }
  }, []);

  /**
   * Load all conversations for the current user
   */
  const loadConversations = useCallback(async () => {
    if (!authToken) return;
    
    try {
      setConversationsLoading(true);
      setError(null);
      
      const result = await ChatAPI.getUserConversations();
      
      if (result.success) {
        setConversations(result.data.conversations || []);
        // Update notification counts
        setNotifications(prev => ({
          ...prev,
          unreadConversations: result.data.unreadCount || 0,
          pendingApprovals: result.data.pendingApprovalsCount || 0,
          totalNotifications: (result.data.unreadCount || 0) + (result.data.pendingApprovalsCount || 0),
          hasNotifications: ((result.data.unreadCount || 0) + (result.data.pendingApprovalsCount || 0)) > 0
        }));
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to load conversations');
    } finally {
      setConversationsLoading(false);
    }
  }, [authToken]);

  /**
   * Load a specific conversation with details
   */
  const loadConversation = useCallback(async (conversationId) => {
    try {
      setConversationLoading(true);
      setError(null);
      
      const result = await ChatAPI.getConversationById(conversationId);
      
      if (result.success) {
        setCurrentConversation(result.data.conversation);
        setMessages(result.data.conversation.messages || []);
        setSelectedConversationId(conversationId);
        
        // Mark messages as read
        await ChatAPI.markMessagesAsRead(conversationId);
        
        return { success: true, conversation: result.data.conversation };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      setError('Failed to load conversation');
      return { success: false, error: 'Failed to load conversation' };
    } finally {
      setConversationLoading(false);
    }
  }, []);

  /**
   * Approve a transaction
   */
  const approveTransaction = useCallback(async (conversationId) => {
    try {
      setConversationLoading(true);
      setError(null);
      
      const result = await ChatAPI.approveTransaction(conversationId);
      
      if (result.success) {
        // Update current conversation
        const updatedConversation = result.data.conversation;
        setCurrentConversation(updatedConversation);
        
        // Update conversations list
        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversationId ? updatedConversation : conv
          )
        );
        
        // Reload messages to get any system messages
        await loadMessages(conversationId);
        
        return { success: true, data: result.data };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      setError('Failed to approve transaction');
      return { success: false, error: 'Failed to approve transaction' };
    } finally {
      setConversationLoading(false);
    }
  }, []);

  /**
   * Cancel a conversation
   */
  const cancelConversation = useCallback(async (conversationId) => {
    try {
      setConversationLoading(true);
      setError(null);
      
      const result = await ChatAPI.cancelConversation(conversationId);
      
      if (result.success) {
        // Update current conversation
        const updatedConversation = result.data.conversation;
        setCurrentConversation(updatedConversation);
        
        // Update conversations list
        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversationId ? updatedConversation : conv
          )
        );
        
        return { success: true, data: result.data };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      setError('Failed to cancel conversation');
      return { success: false, error: 'Failed to cancel conversation' };
    } finally {
      setConversationLoading(false);
    }
  }, []);

  // ===== MESSAGE FUNCTIONS =====

  /**
   * Send a message in a conversation
   */
  const sendMessage = useCallback(async (conversationId, content) => {
    if (!content.trim()) return { success: false, error: 'Message cannot be empty' };
    
    try {
      setSendingMessage(true);
      setError(null);
      
      const result = await ChatAPI.sendMessage(conversationId, content.trim());
      
      if (result.success) {
        // Add message to current messages
        const newMessage = result.data.messageData;
        setMessages(prev => [...prev, newMessage]);
        
        // Update conversation's last message in conversations list
        setConversations(prev => 
          prev.map(conv => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                updatedAt: newMessage.sentAt,
                lastMessage: newMessage
              };
            }
            return conv;
          })
        );
        
        return { success: true, message: newMessage };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      setError('Failed to send message');
      return { success: false, error: 'Failed to send message' };
    } finally {
      setSendingMessage(false);
    }
  }, []);

  /**
   * Load messages for a conversation
   */
  const loadMessages = useCallback(async (conversationId) => {
    try {
      setMessagesLoading(true);
      setError(null);
      
      const result = await ChatAPI.getMessages(conversationId);
      
      if (result.success) {
        setMessages(result.data.messages || []);
        return { success: true, messages: result.data.messages };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      setError('Failed to load messages');
      return { success: false, error: 'Failed to load messages' };
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  /**
   * Search messages in current conversation
   */
  const searchMessages = useCallback(async (conversationId, searchTerm) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      setSearchLoading(true);
      setError(null);
      
      const result = await ChatAPI.searchMessages(conversationId, searchTerm.trim());
      
      if (result.success) {
        setSearchResults(result.data.searchResults || []);
        setSearchTerm(searchTerm);
      } else {
        setError(result.error);
        setSearchResults([]);
      }
    } catch (error) {
      setError('Failed to search messages');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // ===== NOTIFICATION FUNCTIONS =====

  /**
   * Load notifications
   */
  const loadNotifications = useCallback(async () => {
    if (!authToken) return;
    
    try {
      setNotificationsLoading(true);
      
      const result = await ChatAPI.getNotifications();
      
      if (result.success) {
        setNotifications({
          unreadConversations: result.data.unreadConversations || 0,
          pendingApprovals: result.data.pendingApprovals || 0,
          totalNotifications: result.data.totalNotifications || 0,
          hasNotifications: result.data.hasNotifications || false
        });
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  }, [authToken]);

  // ===== UI FUNCTIONS =====

  /**
   * Open chat with a specific conversation
   */
  const openChat = useCallback((conversationId) => {
    setSelectedConversationId(conversationId);
    setChatSidebarOpen(true);
    if (conversationId) {
      loadConversation(conversationId);
    }
  }, [loadConversation]);

  /**
   * Close chat sidebar
   */
  const closeChat = useCallback(() => {
    setChatSidebarOpen(false);
    setSelectedConversationId(null);
    setCurrentConversation(null);
    setMessages([]);
    setSearchResults([]);
    setSearchTerm('');
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ===== EFFECTS =====

  /**
   * Load conversations when user is authenticated
   */
  useEffect(() => {
    if (authToken && user) {
      loadConversations();
      loadNotifications();
    } else {
      // Clear state when user logs out
      setConversations([]);
      setCurrentConversation(null);
      setMessages([]);
      setNotifications({
        unreadConversations: 0,
        pendingApprovals: 0,
        totalNotifications: 0,
        hasNotifications: false
      });
      closeChat();
    }
  }, [authToken, user, loadConversations, loadNotifications, closeChat]);

  /**
   * Periodic notification updates
   */
  useEffect(() => {
    if (!authToken) return;
    
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [authToken, loadNotifications]);

  // ===== CONTEXT VALUE =====
  const contextValue = {
    // State
    conversations,
    currentConversation,
    messages,
    notifications,
    searchResults,
    searchTerm,
    conversationLoading,
    conversationsLoading,
    messagesLoading,
    sendingMessage,
    notificationsLoading,
    searchLoading,
    chatSidebarOpen,
    selectedConversationId,
    showApprovalModal,
    showCancelModal,
    error,

    // Conversation functions
    initiateConversation,
    loadConversations,
    loadConversation,
    approveTransaction,
    cancelConversation,

    // Message functions
    sendMessage,
    loadMessages,
    searchMessages,

    // Notification functions
    loadNotifications,

    // UI functions
    openChat,
    closeChat,
    setChatSidebarOpen,
    setSelectedConversationId,
    setShowApprovalModal,
    setShowCancelModal,
    clearError,

    // Utility functions from ChatAPI
    canUserApprove: (conversation) => ChatAPI.canUserApprove(conversation, user?.id),
    getStatusDisplayText: ChatAPI.getStatusDisplayText,
    getStatusColor: ChatAPI.getStatusColor,
    formatMessageTime: ChatAPI.formatMessageTime,
    getOtherParticipant: (conversation) => ChatAPI.getOtherParticipant(conversation, user?.id),
    getUserRole: (conversation) => ChatAPI.getUserRole(conversation, user?.id)
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

ChatProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ChatContext; 