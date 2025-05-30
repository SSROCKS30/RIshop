package com.ssrocks.rishop_backend.controller;

import com.ssrocks.rishop_backend.model.Message;
import com.ssrocks.rishop_backend.model.MessageType;
import com.ssrocks.rishop_backend.model.User;
import com.ssrocks.rishop_backend.service.MessageService;
import com.ssrocks.rishop_backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for managing messages within conversations in the chat system.
 * 
 * This controller provides RESTful endpoints for message operations in the
 * student marketplace chat system. It handles all message-related functionality
 * including sending messages, retrieving message history, managing read status,
 * and supporting chat features like search.
 * 
 * The controller implements the messaging layer of the marketplace workflow:
 * 1. Sending messages between buyers and sellers
 * 2. Retrieving conversation message history
 * 3. Managing read/unread status for notifications
 * 4. Searching messages within conversations
 * 5. Supporting different message types (text vs system messages)
 * 
 * All endpoints require authentication and include security validation to ensure
 * users can only access messages in conversations they participate in.
 * 
 * API Endpoints:
 * - POST /api/conversations/{id}/messages - Send new message
 * - GET /api/conversations/{id}/messages - Get message history
 * - PUT /api/conversations/{id}/mark-read - Mark messages as read
 * - GET /api/conversations/{id}/messages/search - Search messages
 * - GET /api/conversations/{id}/messages/unread-count - Get unread count
 */
@RestController
@RequestMapping("/api/conversations")
public class MessageController {

    @Autowired
    private MessageService messageService;

    @Autowired
    private UserService userService;

    /**
     * Send a new message in a conversation.
     * 
     * This endpoint handles message sending between buyers and sellers in the marketplace.
     * It's the core of the chat functionality that enables negotiation and communication
     * about product details, payment methods, pickup locations, and other transaction details.
     * 
     * Message Sending Workflow:
     * 1. Validate user authentication and conversation access
     * 2. Validate message content (length, safety, etc.)
     * 3. Sanitize content to prevent XSS attacks
     * 4. Create and save new message to database
     * 5. Update conversation timestamp for inbox ordering
     * 6. Return message confirmation for UI updates
     * 
     * Security Features:
     * - Authentication required (JWT validation)
     * - Conversation participant validation
     * - Content sanitization and length limits
     * - Rate limiting considerations (future enhancement)
     * 
     * Business Rules:
     * - Only conversation participants can send messages
     * - Cannot send messages to cancelled conversations
     * - Message content is validated for safety and length (max 1000 chars)
     * - Conversation activity timestamp is updated automatically
     * 
     * Success Response:
     * - Status: 201 CREATED
     * - Body: Message object with ID, content, sender, timestamp
     * - Additional metadata for UI updates
     * 
     * Error Responses:
     * - 400 BAD REQUEST: Invalid content, empty message, too long
     * - 401 UNAUTHORIZED: User not authenticated
     * - 403 FORBIDDEN: User not conversation participant
     * - 404 NOT FOUND: Conversation not found
     * - 500 INTERNAL SERVER ERROR: System errors
     * 
     * @param conversationId - The ID of the conversation to send message to
     * @param requestBody - Contains message content and optional metadata
     * @param authentication - Spring Security authentication object (auto-injected)
     * @return ResponseEntity<Map<String, Object>> - Success response with message data or error message
     */
    @PostMapping("/{conversationId}/messages")
    public ResponseEntity<Map<String, Object>> sendMessage(
            @PathVariable int conversationId,
            @RequestBody Map<String, Object> requestBody,
            Authentication authentication) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Step 1: Validate authentication and get current user
            String username = authentication.getName();
            User currentUser = userService.findByUsername(username);
            
            if (currentUser == null) {
                response.put("error", "User not found");
                response.put("message", "Authentication failed - user does not exist");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            // Step 2: Extract and validate message content from request
            if (!requestBody.containsKey("content")) {
                response.put("error", "Missing content");
                response.put("message", "Message content is required");
                return ResponseEntity.badRequest().body(response);
            }

            String content = (String) requestBody.get("content");
            if (content == null) {
                response.put("error", "Invalid content");
                response.put("message", "Message content cannot be null");
                return ResponseEntity.badRequest().body(response);
            }

            // Step 3: Send message through service layer
            // Service handles all validation, security checks, and database operations
            Message sentMessage = messageService.sendMessage(conversationId, content, currentUser);

            // Step 4: Prepare success response
            response.put("success", true);
            response.put("message", "Message sent successfully");
            response.put("messageData", sentMessage);
            response.put("messageId", sentMessage.getId());
            response.put("conversationId", conversationId);
            response.put("senderUsername", currentUser.getUsername());
            response.put("sentAt", sentMessage.getSentAt());
            response.put("messageType", sentMessage.getMessageType().toString());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (RuntimeException e) {
            // Handle business logic errors from service layer
            response.put("error", "Message sending failed");
            response.put("message", e.getMessage());
            
            // Map specific error types to appropriate HTTP status codes
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            } else if (e.getMessage().contains("not authorized") || 
                      e.getMessage().contains("not a participant")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            } else if (e.getMessage().contains("cannot be empty") || 
                      e.getMessage().contains("too long") ||
                      e.getMessage().contains("cancelled")) {
                return ResponseEntity.badRequest().body(response);
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
            }
            
        } catch (Exception e) {
            // Handle unexpected system errors
            System.err.println("Error sending message: " + e.getMessage());
            e.printStackTrace();
            
            response.put("error", "System error");
            response.put("message", "An unexpected error occurred while sending message");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Get all messages for a conversation in chronological order.
     * 
     * This endpoint retrieves the complete message history for a conversation
     * when a user opens a chat from their inbox. It provides the full context
     * needed for users to understand the conversation history and continue
     * their discussion about the product transaction.
     * 
     * Response Features:
     * - Complete message history in chronological order (oldest first)
     * - Message metadata including sender, timestamps, and read status
     * - Distinction between user messages and system messages
     * - Automatic read status update for current user
     * 
     * Performance Considerations:
     * - Efficient database queries with proper ordering
     * - Includes conversation details for context
     * - Automatic cleanup of notification badges
     * 
     * Side Effects:
     * - Marks all unread messages as read for current user
     * - Clears notification badges for this conversation
     * - Updates user's last accessed timestamp
     * 
     * @param conversationId - The ID of the conversation to get messages for
     * @param authentication - Spring Security authentication object (auto-injected)
     * @return ResponseEntity<Map<String, Object>> - Complete message history with metadata
     */
    @GetMapping("/{conversationId}/messages")
    public ResponseEntity<Map<String, Object>> getConversationMessages(
            @PathVariable int conversationId,
            Authentication authentication) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Step 1: Validate authentication and get current user
            String username = authentication.getName();
            User currentUser = userService.findByUsername(username);
            
            if (currentUser == null) {
                response.put("error", "User not found");
                response.put("message", "Authentication failed - user does not exist");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            // Step 2: Get messages through service layer
            // Service handles security validation and automatic read status updates
            List<Message> messages = messageService.getConversationMessages(conversationId, currentUser);

            // Step 3: Get additional message metrics
            int unreadCount = messageService.getUnreadMessageCount(conversationId, currentUser);
            Message lastMessage = messageService.getLastMessage(conversationId, currentUser);

            // Step 4: Prepare comprehensive response
            response.put("success", true);
            response.put("messages", messages);
            response.put("messageCount", messages.size());
            response.put("unreadCount", unreadCount); // Should be 0 after marking as read
            response.put("lastMessage", lastMessage);
            response.put("conversationId", conversationId);
            response.put("currentUserId", currentUser.getId());
            response.put("message", messages.isEmpty() ? 
                       "No messages found in conversation" : 
                       "Messages retrieved successfully");

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            // Handle business logic errors from service layer
            response.put("error", "Access denied or not found");
            response.put("message", e.getMessage());
            
            // Map specific error types to appropriate HTTP status codes
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            } else if (e.getMessage().contains("not authorized")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }
            
        } catch (Exception e) {
            // Handle unexpected system errors
            System.err.println("Error retrieving messages: " + e.getMessage());
            e.printStackTrace();
            
            response.put("error", "System error");
            response.put("message", "Failed to retrieve messages");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Mark all messages in a conversation as read for the current user.
     * 
     * This endpoint is called when a user opens or views a conversation to clear
     * notification badges and update read status. It's essential for notification
     * management and providing users with accurate unread message counts.
     * 
     * Use Cases:
     * - User opens a conversation from inbox
     * - User switches between conversation tabs
     * - Manual "mark as read" action
     * - Periodic cleanup of read status
     * 
     * Performance Features:
     * - Bulk update operation for efficiency
     * - Only updates messages that are actually unread
     * - Excludes user's own messages (automatically "read")
     * 
     * @param conversationId - The ID of the conversation to mark messages as read
     * @param authentication - Spring Security authentication object (auto-injected)
     * @return ResponseEntity<Map<String, Object>> - Confirmation of read status update
     */
    @PutMapping("/{conversationId}/mark-read")
    public ResponseEntity<Map<String, Object>> markMessagesAsRead(
            @PathVariable int conversationId,
            Authentication authentication) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Step 1: Validate authentication and get current user
            String username = authentication.getName();
            User currentUser = userService.findByUsername(username);
            
            if (currentUser == null) {
                response.put("error", "User not found");
                response.put("message", "Authentication failed - user does not exist");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            // Step 2: Mark messages as read through service layer
            messageService.markMessagesAsRead(conversationId, currentUser);

            // Step 3: Get updated unread count for confirmation
            int remainingUnreadCount = messageService.getUnreadMessageCount(conversationId, currentUser);

            // Step 4: Prepare success response
            response.put("success", true);
            response.put("message", "Messages marked as read successfully");
            response.put("conversationId", conversationId);
            response.put("remainingUnreadCount", remainingUnreadCount);
            response.put("allMessagesRead", remainingUnreadCount == 0);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            // Handle business logic errors from service layer
            response.put("error", "Failed to mark messages as read");
            response.put("message", e.getMessage());
            
            // Map specific error types to appropriate HTTP status codes
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            } else if (e.getMessage().contains("not authorized")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }
            
        } catch (Exception e) {
            // Handle unexpected system errors
            System.err.println("Error marking messages as read: " + e.getMessage());
            e.printStackTrace();
            
            response.put("error", "System error");
            response.put("message", "Failed to mark messages as read");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Search messages within a conversation.
     * 
     * This endpoint enables users to search for specific text within their conversation
     * history. It's useful for finding important information like agreed prices,
     * pickup locations, payment methods, or specific product details discussed
     * during the negotiation.
     * 
     * Search Features:
     * - Case-insensitive partial text matching
     * - Searches through all message content
     * - Returns results ordered by most recent first
     * - Highlights search terms in results (frontend implementation)
     * 
     * Use Cases:
     * - Finding agreed price or payment method
     * - Locating pickup location details
     * - Reviewing product condition discussions
     * - General conversation history search
     * 
     * @param conversationId - The ID of the conversation to search in
     * @param searchTerm - The text to search for in messages (query parameter)
     * @param authentication - Spring Security authentication object (auto-injected)
     * @return ResponseEntity<Map<String, Object>> - Search results with matching messages
     */
    @GetMapping("/{conversationId}/messages/search")
    public ResponseEntity<Map<String, Object>> searchMessages(
            @PathVariable int conversationId,
            @RequestParam String searchTerm,
            Authentication authentication) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Step 1: Validate authentication and get current user
            String username = authentication.getName();
            User currentUser = userService.findByUsername(username);
            
            if (currentUser == null) {
                response.put("error", "User not found");
                response.put("message", "Authentication failed - user does not exist");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            // Step 2: Validate search term
            if (searchTerm == null || searchTerm.trim().isEmpty()) {
                response.put("error", "Invalid search term");
                response.put("message", "Search term cannot be empty");
                return ResponseEntity.badRequest().body(response);
            }

            // Step 3: Perform search through service layer
            List<Message> searchResults = messageService.searchMessages(conversationId, searchTerm, currentUser);

            // Step 4: Prepare search response
            response.put("success", true);
            response.put("searchResults", searchResults);
            response.put("resultCount", searchResults.size());
            response.put("searchTerm", searchTerm);
            response.put("conversationId", conversationId);
            response.put("message", searchResults.isEmpty() ? 
                       "No messages found matching search term" : 
                       "Search completed successfully");

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            // Handle business logic errors from service layer
            response.put("error", "Search failed");
            response.put("message", e.getMessage());
            
            // Map specific error types to appropriate HTTP status codes
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            } else if (e.getMessage().contains("not authorized")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            } else if (e.getMessage().contains("empty")) {
                return ResponseEntity.badRequest().body(response);
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
            }
            
        } catch (Exception e) {
            // Handle unexpected system errors
            System.err.println("Error searching messages: " + e.getMessage());
            e.printStackTrace();
            
            response.put("error", "System error");
            response.put("message", "Failed to search messages");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Get count of unread messages in a specific conversation for the current user.
     * 
     * This endpoint provides the unread message count for a specific conversation.
     * It's used for displaying notification badges and determining conversation
     * priority in the inbox view.
     * 
     * Use Cases:
     * - Displaying unread badges in conversation list
     * - Determining conversation priority and ordering
     * - Real-time notification updates
     * - Inbox summary information
     * 
     * Performance Features:
     * - Optimized count query (no message objects retrieved)
     * - Excludes user's own messages from count
     * - Fast response for real-time updates
     * 
     * @param conversationId - The ID of the conversation to count unread messages
     * @param authentication - Spring Security authentication object (auto-injected)
     * @return ResponseEntity<Map<String, Object>> - Unread message count and metadata
     */
    @GetMapping("/{conversationId}/messages/unread-count")
    public ResponseEntity<Map<String, Object>> getUnreadMessageCount(
            @PathVariable int conversationId,
            Authentication authentication) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Step 1: Validate authentication and get current user
            String username = authentication.getName();
            User currentUser = userService.findByUsername(username);
            
            if (currentUser == null) {
                response.put("error", "User not found");
                response.put("message", "Authentication failed - user does not exist");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            // Step 2: Get unread count through service layer
            int unreadCount = messageService.getUnreadMessageCount(conversationId, currentUser);

            // Step 3: Prepare count response
            response.put("success", true);
            response.put("unreadCount", unreadCount);
            response.put("conversationId", conversationId);
            response.put("hasUnreadMessages", unreadCount > 0);
            response.put("message", "Unread count retrieved successfully");

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            // Handle business logic errors from service layer
            response.put("error", "Failed to get unread count");
            response.put("message", e.getMessage());
            
            // Map specific error types to appropriate HTTP status codes
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            } else if (e.getMessage().contains("not authorized")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }
            
        } catch (Exception e) {
            // Handle unexpected system errors
            System.err.println("Error getting unread count: " + e.getMessage());
            e.printStackTrace();
            
            response.put("error", "System error");
            response.put("message", "Failed to get unread count");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Get messages by type (TEXT or SYSTEM_MESSAGE) in a conversation.
     * 
     * This endpoint allows filtering messages by their type within a conversation.
     * It can be useful for different UI views or when users want to see only
     * certain types of messages.
     * 
     * Use Cases:
     * - Showing only user messages (hiding system notifications)
     * - Displaying system messages separately for audit trail
     * - Implementing different UI treatments for message types
     * - Analytics and reporting on message patterns
     * 
     * @param conversationId - The ID of the conversation to get messages from
     * @param messageType - The type of messages to retrieve (TEXT or SYSTEM_MESSAGE)
     * @param authentication - Spring Security authentication object (auto-injected)
     * @return ResponseEntity<Map<String, Object>> - Filtered messages by type
     */
    @GetMapping("/{conversationId}/messages/type/{messageType}")
    public ResponseEntity<Map<String, Object>> getMessagesByType(
            @PathVariable int conversationId,
            @PathVariable String messageType,
            Authentication authentication) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Step 1: Validate authentication and get current user
            String username = authentication.getName();
            User currentUser = userService.findByUsername(username);
            
            if (currentUser == null) {
                response.put("error", "User not found");
                response.put("message", "Authentication failed - user does not exist");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            // Step 2: Validate and parse message type
            MessageType type;
            try {
                type = MessageType.valueOf(messageType.toUpperCase());
            } catch (IllegalArgumentException e) {
                response.put("error", "Invalid message type");
                response.put("message", "Message type must be TEXT or SYSTEM_MESSAGE");
                return ResponseEntity.badRequest().body(response);
            }

            // Step 3: Get messages by type through service layer
            List<Message> messages = messageService.getMessagesByType(conversationId, type, currentUser);

            // Step 4: Prepare response
            response.put("success", true);
            response.put("messages", messages);
            response.put("messageCount", messages.size());
            response.put("messageType", messageType);
            response.put("conversationId", conversationId);
            response.put("message", messages.isEmpty() ? 
                       "No " + messageType.toLowerCase() + " messages found" : 
                       "Messages retrieved successfully");

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            // Handle business logic errors from service layer
            response.put("error", "Failed to get messages by type");
            response.put("message", e.getMessage());
            
            // Map specific error types to appropriate HTTP status codes
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            } else if (e.getMessage().contains("not authorized")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }
            
        } catch (Exception e) {
            // Handle unexpected system errors
            System.err.println("Error getting messages by type: " + e.getMessage());
            e.printStackTrace();
            
            response.put("error", "System error");
            response.put("message", "Failed to get messages by type");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
} 