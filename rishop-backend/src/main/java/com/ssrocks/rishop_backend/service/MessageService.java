package com.ssrocks.rishop_backend.service;

import com.ssrocks.rishop_backend.model.*;
import com.ssrocks.rishop_backend.repository.ConversationRepository;
import com.ssrocks.rishop_backend.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service class for managing messages within conversations in the chat system.
 * 
 * This service handles all message-related operations including:
 * - Sending new messages in conversations
 * - Managing message read/unread status
 * - Retrieving message history for conversations
 * - Validating message permissions and security
 * 
 * Key features:
 * - Security validation to ensure only conversation participants can send/read messages
 * - Automatic conversation timestamp updates when messages are sent
 * - Read status management for notification systems
 * - Support for both text messages and system messages
 * - Input validation and content filtering
 * 
 * Business rules:
 * - Only conversation participants can send messages
 * - Messages cannot be sent to cancelled conversations
 * - Message content is validated for safety and length
 * - Conversation updatedAt timestamp is updated on new messages
 * - Read status is managed automatically
 */
@Service
public class MessageService {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private ConversationService conversationService;

    /**
     * Send a new message in a conversation.
     * 
     * This method handles sending messages between buyers and sellers in the marketplace.
     * It includes comprehensive validation and security checks to ensure message integrity.
     * 
     * Message Sending Workflow:
     * 1. Validate conversation exists and user has access
     * 2. Check conversation is in a state that allows messaging
     * 3. Validate and sanitize message content
     * 4. Create and save new message
     * 5. Update conversation's last activity timestamp
     * 6. Mark message as unread for recipient
     * 7. Return saved message for UI confirmation
     * 
     * Security Features:
     * - Only conversation participants can send messages
     * - Content validation and length limits
     * - XSS prevention through content sanitization
     * - Rate limiting considerations (can be added)
     * 
     * Business Rules:
     * - Cannot send messages to completed conversations (optional - depends on requirements)
     * - Cannot send messages to cancelled conversations
     * - Messages automatically update conversation activity timestamp
     * - Sender automatically marks message as "read" for themselves
     * 
     * @param conversationId - The ID of the conversation to send message to
     * @param content - The text content of the message
     * @param sender - The authenticated user sending the message
     * @return Message - The newly created message
     * @throws RuntimeException if validation fails or user lacks permission
     */
    @Transactional
    public Message sendMessage(int conversationId, String content, User sender) {
        // Step 1: Validate conversation exists and user has access
        Conversation conversation = conversationService.getConversationById(conversationId, sender);

        // Step 2: Validate conversation state allows messaging
        if (conversation.getStatus() == ConversationStatus.CANCELLED) {
            throw new RuntimeException("Cannot send messages to a cancelled conversation");
        }

        // Optional: Uncomment if you want to prevent messaging after completion
        // if (conversation.getStatus() == ConversationStatus.COMPLETED) {
        //     throw new RuntimeException("Cannot send messages to a completed conversation");
        // }

        // Step 3: Validate message content
        if (content == null || content.trim().isEmpty()) {
            throw new RuntimeException("Message content cannot be empty");
        }

        // Validate message length (adjust limits as needed)
        if (content.length() > 1000) {
            throw new RuntimeException("Message content is too long (maximum 1000 characters)");
        }

        // Step 4: Sanitize content to prevent XSS attacks
        String sanitizedContent = sanitizeMessageContent(content.trim());

        // Step 5: Create new message
        Message message = new Message();
        message.setConversation(conversation);
        message.setSender(sender);
        message.setContent(sanitizedContent);
        message.setMessageType(MessageType.TEXT);
        message.setRead(false); // New messages start as unread

        // Step 6: Save message to database
        Message savedMessage = messageRepository.save(message);

        // Step 7: Update conversation's last activity timestamp
        // This ensures the conversation appears at the top of users' inbox lists
        conversation.setUpdatedAt(savedMessage.getSentAt());
        conversationRepository.save(conversation);

        return savedMessage;
    }

    /**
     * Get all messages for a conversation in chronological order.
     * 
     * This method retrieves the complete message history for a conversation.
     * It includes security validation to ensure only conversation participants
     * can access the messages.
     * 
     * When this method is called (typically when user opens a conversation),
     * it also marks all unread messages as read for the current user.
     * 
     * Features:
     * - Security validation for access control
     * - Messages returned in chronological order (oldest first)
     * - Automatic read status update for current user
     * - Includes both text messages and system messages
     * 
     * @param conversationId - The ID of the conversation to get messages for
     * @param user - The authenticated user requesting messages
     * @return List<Message> - All messages in the conversation, chronologically ordered
     * @throws RuntimeException if conversation not found or user lacks access
     */
    @Transactional
    public List<Message> getConversationMessages(int conversationId, User user) {
        // Step 1: Validate conversation access (this also validates user is participant)
        Conversation conversation = conversationService.getConversationById(conversationId, user);

        // Step 2: Get all messages in chronological order
        List<Message> messages = messageRepository.findByConversationOrderBySentAtAsc(conversation);

        // Step 3: Mark unread messages as read for current user
        // This clears notification badges and updates read status
        markMessagesAsRead(conversationId, user);

        return messages;
    }

    /**
     * Mark all unread messages in a conversation as read for the current user.
     * 
     * This method is called when a user opens/views a conversation. It updates
     * the read status of all messages they haven't read yet (excluding their own messages).
     * This is essential for notification management and read receipt functionality.
     * 
     * Performance Notes:
     * - Uses bulk update query for efficiency
     * - Only updates messages that are actually unread
     * - Excludes sender's own messages (they're automatically "read")
     * 
     * @param conversationId - The ID of the conversation to mark messages as read
     * @param user - The user who is reading the messages
     * @throws RuntimeException if conversation not found or user lacks access
     */
    @Transactional
    public void markMessagesAsRead(int conversationId, User user) {
        // Step 1: Validate conversation access
        Conversation conversation = conversationService.getConversationById(conversationId, user);

        // Step 2: Mark unread messages as read for this user
        int updatedCount = messageRepository.markMessagesAsReadForUser(conversation, user);

        // Optional: Log for debugging/analytics
        if (updatedCount > 0) {
            System.out.println("Marked " + updatedCount + " messages as read for user " + user.getUsername() + 
                             " in conversation " + conversationId);
        }
    }

    /**
     * Get count of unread messages in a specific conversation for a user.
     * 
     * This method returns the number of unread messages in a conversation for
     * the specified user. It's used for displaying unread message badges and
     * conversation prioritization in the UI.
     * 
     * @param conversationId - The ID of the conversation to count unread messages
     * @param user - The user to count unread messages for
     * @return int - Number of unread messages for this user in this conversation
     * @throws RuntimeException if conversation not found or user lacks access
     */
    @Transactional(readOnly = true)
    public int getUnreadMessageCount(int conversationId, User user) {
        // Validate conversation access
        Conversation conversation = conversationService.getConversationById(conversationId, user);

        // Get unread message count for this user
        return messageRepository.countUnreadMessagesForUser(conversation, user);
    }

    /**
     * Get the last message in a conversation.
     * 
     * This method retrieves the most recent message in a conversation.
     * It's used for displaying message previews in conversation lists (inbox view).
     * 
     * @param conversationId - The ID of the conversation to get last message from
     * @param user - The authenticated user requesting the information
     * @return Message - The most recent message, or null if conversation has no messages
     * @throws RuntimeException if conversation not found or user lacks access
     */
    @Transactional(readOnly = true)
    public Message getLastMessage(int conversationId, User user) {
        // Validate conversation access
        Conversation conversation = conversationService.getConversationById(conversationId, user);

        // Get the most recent message
        return messageRepository.findTopByConversationOrderBySentAtDesc(conversation);
    }

    /**
     * Search messages within a conversation.
     * 
     * This method enables users to search for specific text within their conversation
     * history. It performs case-insensitive partial matching on message content.
     * 
     * Features:
     * - Case-insensitive search
     * - Partial text matching
     * - Security validation for access control
     * - Results ordered by most recent first
     * 
     * @param conversationId - The ID of the conversation to search in
     * @param searchTerm - The text to search for in messages
     * @param user - The authenticated user performing the search
     * @return List<Message> - Messages containing the search term, ordered by most recent
     * @throws RuntimeException if conversation not found or user lacks access
     */
    @Transactional(readOnly = true)
    public List<Message> searchMessages(int conversationId, String searchTerm, User user) {
        // Step 1: Validate inputs
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            throw new RuntimeException("Search term cannot be empty");
        }

        // Step 2: Validate conversation access
        Conversation conversation = conversationService.getConversationById(conversationId, user);

        // Step 3: Perform search
        return messageRepository.searchMessagesInConversation(conversation, searchTerm.trim());
    }

    /**
     * Get messages by type (TEXT or SYSTEM_MESSAGE) in a conversation.
     * 
     * This method allows filtering messages by their type. This can be useful for:
     * - Showing only user messages in certain UI views
     * - Displaying system messages separately for audit trails
     * - Implementing different UI treatments for different message types
     * 
     * @param conversationId - The ID of the conversation to get messages from
     * @param messageType - The type of messages to retrieve (TEXT or SYSTEM_MESSAGE)
     * @param user - The authenticated user requesting the messages
     * @return List<Message> - Messages of the specified type in chronological order
     * @throws RuntimeException if conversation not found or user lacks access
     */
    @Transactional(readOnly = true)
    public List<Message> getMessagesByType(int conversationId, MessageType messageType, User user) {
        // Validate conversation access
        Conversation conversation = conversationService.getConversationById(conversationId, user);

        // Get messages by type
        return messageRepository.findByConversationAndMessageTypeOrderBySentAtAsc(conversation, messageType);
    }

    /**
     * Create a system message for a conversation.
     * 
     * This method is used internally by the system to create automated messages
     * for various events like conversation start, approvals, cancellations, etc.
     * System messages have no sender and are automatically marked as unread for all participants.
     * 
     * Note: This method is primarily for internal use by other services
     * (like ConversationService) and is not exposed directly to user controllers.
     * 
     * @param conversation - The conversation to add the system message to
     * @param content - The content of the system message
     * @return Message - The created system message
     */
    @Transactional
    public Message createSystemMessage(Conversation conversation, String content) {
        // Validate inputs
        if (content == null || content.trim().isEmpty()) {
            throw new RuntimeException("System message content cannot be empty");
        }

        // Create system message
        Message systemMessage = new Message();
        systemMessage.setConversation(conversation);
        systemMessage.setSender(null); // System messages have no specific sender
        systemMessage.setContent(content.trim());
        systemMessage.setMessageType(MessageType.SYSTEM_MESSAGE);
        systemMessage.setRead(false); // Both parties should see system messages

        // Save message
        Message savedMessage = messageRepository.save(systemMessage);

        // Update conversation timestamp
        conversation.setUpdatedAt(savedMessage.getSentAt());
        conversationRepository.save(conversation);

        return savedMessage;
    }

    /**
     * Private helper method to sanitize message content.
     * 
     * This method cleans user input to prevent XSS attacks and other security issues.
     * It removes potentially dangerous HTML/JavaScript while preserving basic formatting.
     * 
     * Current implementation is basic - in production, consider using a robust
     * HTML sanitization library like OWASP Java HTML Sanitizer.
     * 
     * @param content - The raw message content from user input
     * @return String - Sanitized content safe for storage and display
     */
    private String sanitizeMessageContent(String content) {
        if (content == null) {
            return "";
        }

        // Basic sanitization - remove potentially dangerous characters
        String sanitized = content
                .replace("<script", "&lt;script")
                .replace("</script>", "&lt;/script&gt;")
                .replace("javascript:", "")
                .replace("onclick=", "")
                .replace("onerror=", "")
                .replace("onload=", "");

        // Additional sanitization can be added here
        // Consider using a proper HTML sanitization library for production

        return sanitized.trim();
    }
} 