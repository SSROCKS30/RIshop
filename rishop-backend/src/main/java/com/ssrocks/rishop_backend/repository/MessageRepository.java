package com.ssrocks.rishop_backend.repository;

import com.ssrocks.rishop_backend.model.Conversation;
import com.ssrocks.rishop_backend.model.Message;
import com.ssrocks.rishop_backend.model.MessageType;
import com.ssrocks.rishop_backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for managing Message entities in the chat system.
 * 
 * This repository handles all database operations related to individual messages
 * within conversations. It provides methods for retrieving messages, managing
 * read status, and supporting the real-time chat functionality.
 * 
 * Key responsibilities:
 * - Retrieve messages for specific conversations
 * - Manage message read/unread status
 * - Find unread messages for notification purposes
 * - Support message filtering by type (text vs system messages)
 * - Enable message search and pagination
 */
@Repository
public interface MessageRepository extends JpaRepository<Message, Integer> {
    
    /**
     * Find all messages in a conversation, ordered chronologically.
     * 
     * This method retrieves all messages for a specific conversation in the order
     * they were sent (oldest first). This is used to display the complete message
     * history in the chat interface.
     * 
     * The ordering by sentAt ensures that messages appear in chronological order,
     * providing a natural conversation flow for users.
     * 
     * Use case: Loading chat history when user opens a conversation.
     * 
     * @param conversation - The conversation to get messages for
     * @return List<Message> - All messages in chronological order (oldest first)
     */
    List<Message> findByConversationOrderBySentAtAsc(Conversation conversation);
    
    /**
     * Find recent messages in a conversation with pagination support.
     * 
     * This method is useful for implementing "load more messages" functionality
     * or for initially loading only the most recent messages when opening a chat.
     * Messages are ordered with newest first for efficient recent message retrieval.
     * 
     * Use case: Loading the last 50 messages when opening a conversation,
     * then allowing user to scroll up to load older messages.
     * 
     * @param conversation - The conversation to get messages for
     * @return List<Message> - Recent messages ordered by newest first
     */
    List<Message> findByConversationOrderBySentAtDesc(Conversation conversation);
    
    /**
     * Find unread messages in a conversation for a specific user.
     * 
     * This method retrieves all messages that the user hasn't read yet in a
     * specific conversation. It excludes messages sent by the user themselves
     * (since users automatically "read" their own messages).
     * 
     * Use case: Highlighting unread messages in the chat interface,
     * showing unread message count per conversation.
     * 
     * @param conversation - The conversation to check for unread messages
     * @param user - The user to check unread messages for (excludes their own messages)
     * @return List<Message> - Unread messages for this user in this conversation
     */
    @Query("SELECT m FROM Message m WHERE m.conversation = :conversation " +
           "AND m.isRead = false AND m.sender != :user ORDER BY m.sentAt ASC")
    List<Message> findUnreadMessagesForUser(@Param("conversation") Conversation conversation, 
                                          @Param("user") User user);
    
    /**
     * Count unread messages in a conversation for a specific user.
     * 
     * This is a performance-optimized method to get just the count of unread
     * messages without fetching the actual message objects. Useful for displaying
     * unread message badges in the conversation list.
     * 
     * @param conversation - The conversation to count unread messages in
     * @param user - The user to count unread messages for
     * @return int - Number of unread messages for this user in this conversation
     */
    @Query("SELECT COUNT(m) FROM Message m WHERE m.conversation = :conversation " +
           "AND m.isRead = false AND m.sender != :user")
    int countUnreadMessagesForUser(@Param("conversation") Conversation conversation, 
                                 @Param("user") User user);
    
    /**
     * Mark all messages as read for a user in a specific conversation.
     * 
     * This method is called when a user opens/views a conversation. It marks
     * all unread messages (that weren't sent by the user) as read. This is
     * a bulk update operation for efficiency.
     * 
     * The @Modifying annotation indicates this is an update/delete operation,
     * and @Transactional should be used when calling this method.
     * 
     * Use case: When user opens a conversation, mark all messages as read
     * to clear notification badges and update read status.
     * 
     * @param conversation - The conversation to mark messages as read in
     * @param user - The user who is reading the messages (excludes their own messages)
     * @return int - Number of messages that were updated
     */
    @Modifying
    @Query("UPDATE Message m SET m.isRead = true WHERE m.conversation = :conversation " +
           "AND m.isRead = false AND m.sender != :user")
    int markMessagesAsReadForUser(@Param("conversation") Conversation conversation, 
                                @Param("user") User user);
    
    /**
     * Find the last message in a conversation.
     * 
     * This method retrieves the most recent message in a conversation. It's
     * useful for displaying the last message preview in the conversation list
     * (inbox view) so users can see the latest activity.
     * 
     * @param conversation - The conversation to get the last message from
     * @return Message - The most recent message in the conversation, null if no messages
     */
    Message findTopByConversationOrderBySentAtDesc(Conversation conversation);
    
    /**
     * Find messages by type in a conversation.
     * 
     * This method allows filtering messages by their type (TEXT or SYSTEM_MESSAGE).
     * This can be useful for:
     * - Showing only user messages (hiding system notifications)
     * - Displaying only system messages for audit trails
     * - Implementing different UI treatments for different message types
     * 
     * @param conversation - The conversation to search in
     * @param messageType - The type of messages to retrieve (TEXT or SYSTEM_MESSAGE)
     * @return List<Message> - Messages of the specified type in chronological order
     */
    List<Message> findByConversationAndMessageTypeOrderBySentAtAsc(Conversation conversation, 
                                                                  MessageType messageType);
    
    /**
     * Find all messages sent by a specific user in a conversation.
     * 
     * This method retrieves all messages sent by a particular user within
     * a specific conversation. Useful for analytics, moderation, or user
     * activity tracking.
     * 
     * @param conversation - The conversation to search in
     * @param sender - The user whose messages to retrieve
     * @return List<Message> - All messages sent by this user in this conversation
     */
    List<Message> findByConversationAndSenderOrderBySentAtAsc(Conversation conversation, User sender);
    
    /**
     * Search messages by content within a conversation.
     * 
     * This method enables searching for specific text within conversation messages.
     * The search is case-insensitive and uses partial matching (LIKE operator).
     * Useful for implementing chat search functionality.
     * 
     * @param conversation - The conversation to search within
     * @param searchTerm - The text to search for in message content
     * @return List<Message> - Messages containing the search term
     */
    @Query("SELECT m FROM Message m WHERE m.conversation = :conversation " +
           "AND LOWER(m.content) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "ORDER BY m.sentAt DESC")
    List<Message> searchMessagesInConversation(@Param("conversation") Conversation conversation, 
                                             @Param("searchTerm") String searchTerm);
    
    /**
     * Delete all messages in a conversation.
     * 
     * This method removes all messages associated with a conversation.
     * Typically used when a conversation is deleted or when implementing
     * "clear chat history" functionality.
     * 
     * Note: Due to cascade settings in the Conversation entity, this should
     * happen automatically when a conversation is deleted, but this method
     * provides explicit control when needed.
     * 
     * @param conversation - The conversation whose messages to delete
     */
    void deleteByConversation(Conversation conversation);
} 