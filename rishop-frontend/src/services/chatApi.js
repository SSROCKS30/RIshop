import API from '../axios';

/**
 * Chat API Service
 * 
 * This service handles all chat-related API calls for the RIshop marketplace.
 * It provides methods for conversation management, messaging, and transaction approval.
 */

class ChatAPI {
  // ===== CONVERSATION MANAGEMENT =====

  /**
   * Initiate a new conversation with a seller for a specific product
   */
  static async initiateConversation(productId) {
    try {
      const response = await API.post('/conversations/initiate', {
        productId: productId
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to initiate conversation',
        status: error.response?.status
      };
    }
  }

  /**
   * Get all conversations for the current user (inbox)
   */
  static async getUserConversations() {
    try {
      const response = await API.get('/conversations/user');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch conversations',
        status: error.response?.status
      };
    }
  }

  /**
   * Get conversation details with full message history
   */
  static async getConversationById(conversationId) {
    try {
      const response = await API.get(`/conversations/${conversationId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch conversation',
        status: error.response?.status
      };
    }
  }

  /**
   * Approve a transaction (dual approval system)
   */
  static async approveTransaction(conversationId) {
    try {
      const response = await API.post(`/conversations/${conversationId}/approve`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to approve transaction',
        status: error.response?.status
      };
    }
  }

  /**
   * Cancel a conversation/transaction
   */
  static async cancelConversation(conversationId) {
    try {
      const response = await API.post(`/conversations/${conversationId}/cancel`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to cancel conversation',
        status: error.response?.status
      };
    }
  }

  /**
   * Get notification counts and pending actions
   */
  static async getNotifications() {
    try {
      const response = await API.get('/conversations/notifications');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch notifications',
        status: error.response?.status
      };
    }
  }

  // ===== MESSAGE MANAGEMENT =====

  /**
   * Send a message in a conversation
   */
  static async sendMessage(conversationId, content) {
    try {
      const response = await API.post(`/conversations/${conversationId}/messages`, {
        content: content
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to send message',
        status: error.response?.status
      };
    }
  }

  /**
   * Get all messages for a conversation
   */
  static async getMessages(conversationId) {
    try {
      const response = await API.get(`/conversations/${conversationId}/messages`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch messages',
        status: error.response?.status
      };
    }
  }

  /**
   * Mark messages as read in a conversation
   */
  static async markMessagesAsRead(conversationId) {
    try {
      const response = await API.put(`/conversations/${conversationId}/mark-read`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to mark messages as read',
        status: error.response?.status
      };
    }
  }

  /**
   * Search messages within a conversation
   */
  static async searchMessages(conversationId, searchTerm) {
    try {
      const response = await API.get(`/conversations/${conversationId}/messages/search`, {
        params: { searchTerm: searchTerm }
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to search messages',
        status: error.response?.status
      };
    }
  }

  /**
   * Get unread message count for a conversation
   */
  static async getUnreadCount(conversationId) {
    try {
      const response = await API.get(`/conversations/${conversationId}/messages/unread-count`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get unread count',
        status: error.response?.status
      };
    }
  }

  /**
   * Get messages by type (TEXT or SYSTEM_MESSAGE)
   */
  static async getMessagesByType(conversationId, messageType) {
    try {
      const response = await API.get(`/conversations/${conversationId}/messages/type/${messageType}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch messages by type',
        status: error.response?.status
      };
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Helper method to check if user can approve a transaction
   */
  static canUserApprove(conversation, currentUserId) {
    if (!conversation || !currentUserId) return false;
    
    const status = conversation.status;
    const isBuyer = conversation.buyer.id === currentUserId;
    const isSeller = conversation.seller.id === currentUserId;
    
    // Cannot approve if already completed or cancelled
    if (status === 'COMPLETED' || status === 'CANCELLED') {
      return false;
    }
    
    // Check if user hasn't already approved
    if (isBuyer && status !== 'BUYER_APPROVED') {
      return true;
    }
    
    if (isSeller && status !== 'SELLER_APPROVED') {
      return true;
    }
    
    return false;
  }

  /**
   * Helper method to get conversation status display text
   */
  static getStatusDisplayText(status) {
    const statusTexts = {
      'ACTIVE': 'Active Discussion',
      'BUYER_APPROVED': 'Waiting for Seller Approval',
      'SELLER_APPROVED': 'Waiting for Buyer Approval',
      'COMPLETED': 'Transaction Completed',
      'CANCELLED': 'Conversation Cancelled'
    };
    
    return statusTexts[status] || status;
  }

  /**
   * Helper method to get status color for UI
   */
  static getStatusColor(status) {
    const statusColors = {
      'ACTIVE': '#007bff',
      'BUYER_APPROVED': '#ffc107',
      'SELLER_APPROVED': '#ffc107',
      'COMPLETED': '#28a745',
      'CANCELLED': '#dc3545'
    };
    
    return statusColors[status] || '#6c757d';
  }

  /**
   * Helper method to format message timestamp
   */
  static formatMessageTime(timestamp) {
    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - messageDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return messageDate.toLocaleDateString();
    }
  }

  /**
   * Helper method to get other participant in conversation
   */
  static getOtherParticipant(conversation, currentUserId) {
    if (!conversation || !currentUserId) return null;
    
    return conversation.buyer.id === currentUserId 
      ? conversation.seller 
      : conversation.buyer;
  }

  /**
   * Helper method to get user role in conversation
   */
  static getUserRole(conversation, currentUserId) {
    if (!conversation || !currentUserId) return null;
    
    return conversation.buyer.id === currentUserId ? 'buyer' : 'seller';
  }
}

export default ChatAPI; 