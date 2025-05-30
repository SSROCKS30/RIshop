package com.ssrocks.rishop_backend.controller;

import com.ssrocks.rishop_backend.model.Conversation;
import com.ssrocks.rishop_backend.model.User;
import com.ssrocks.rishop_backend.service.ConversationService;
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
 * REST Controller for managing conversations in the chat-based marketplace system.
 * 
 * This controller provides RESTful endpoints for the conversation workflow in the
 * student marketplace where buyers and sellers communicate through chat to negotiate
 * and complete transactions.
 * 
 * The controller handles the complete conversation lifecycle:
 * 1. Conversation initiation when buyer clicks "Contact Seller"
 * 2. Retrieving user's conversation inbox (as buyer or seller)
 * 3. Getting specific conversation details with message history
 * 4. Transaction approval workflow (buyer and seller must both approve)
 * 5. Conversation cancellation
 * 6. Notification features (unread counts, pending approvals)
 * 
 * All endpoints require authentication and include security validation to ensure
 * users can only access their own conversations and perform authorized actions.
 * 
 * API Endpoints:
 * - POST /api/conversations/initiate - Start new conversation
 * - GET /api/conversations/user - Get user's conversation inbox
 * - GET /api/conversations/{id} - Get specific conversation details
 * - POST /api/conversations/{id}/approve - Approve transaction
 * - POST /api/conversations/{id}/cancel - Cancel conversation
 * - GET /api/conversations/notifications - Get notification counts
 */
@RestController
@RequestMapping("/api/conversations")
public class ConversationController {

    @Autowired
    private ConversationService conversationService;

    @Autowired
    private UserService userService;

    /**
     * Initiate a new conversation between buyer and seller for a specific product.
     * 
     * This endpoint is called when a user clicks "Contact Seller" from their cart
     * or from a product page. It implements the first step of the marketplace workflow
     * where buyers express interest in purchasing a product.
     * 
     * Request Flow:
     * 1. Validate user is authenticated and get user details
     * 2. Extract product ID from request body
     * 3. Validate business rules (no self-purchase, product availability)
     * 4. Check for existing conversation (prevent duplicates)
     * 5. Create new conversation or return existing one
     * 6. Generate initial system message welcoming both parties
     * 7. Return conversation details for UI redirection
     * 
     * Security Features:
     * - Authentication required (Spring Security automatically validates JWT)
     * - Business rule validation (cannot buy own products)
     * - Input validation and error handling
     * 
     * Success Response:
     * - Status: 201 CREATED (new) or 200 OK (existing)
     * - Body: Conversation object with ID, participants, product, and status
     * - Headers: Standard CORS and content-type headers
     * 
     * Error Responses:
     * - 400 BAD REQUEST: Invalid input, business rule violations
     * - 401 UNAUTHORIZED: User not authenticated
     * - 404 NOT FOUND: Product not found
     * - 500 INTERNAL SERVER ERROR: System errors
     * 
     * @param requestBody - Contains productId that buyer wants to discuss
     * @param authentication - Spring Security authentication object (auto-injected)
     * @return ResponseEntity<Map<String, Object>> - Success response with conversation data or error message
     */
    @PostMapping("/initiate")
    public ResponseEntity<Map<String, Object>> initiateConversation(
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

            // Step 2: Extract and validate product ID from request
            if (!requestBody.containsKey("productId")) {
                response.put("error", "Missing productId");
                response.put("message", "Product ID is required to initiate conversation");
                return ResponseEntity.badRequest().body(response);
            }

            Integer productId;
            try {
                productId = (Integer) requestBody.get("productId");
                if (productId == null || productId <= 0) {
                    throw new NumberFormatException("Invalid product ID");
                }
            } catch (ClassCastException | NumberFormatException e) {
                response.put("error", "Invalid productId format");
                response.put("message", "Product ID must be a positive integer");
                return ResponseEntity.badRequest().body(response);
            }

            // Step 3: Initiate conversation through service layer
            // Service handles all business logic, validation, and database operations
            Conversation conversation = conversationService.initiateConversation(productId, currentUser);

            // Step 4: Prepare success response
            response.put("success", true);
            response.put("message", "Conversation initiated successfully");
            response.put("conversation", conversation);
            response.put("isNewConversation", conversation.getMessages().size() == 1); // New if only system message
            
            // Additional metadata for frontend
            response.put("buyerUsername", conversation.getBuyer().getUsername());
            response.put("sellerUsername", conversation.getSeller().getUsername());
            response.put("productName", conversation.getProduct().getName());
            response.put("conversationId", conversation.getId());

            // Return 201 for new conversations, 200 for existing
            HttpStatus status = conversation.getMessages().size() == 1 ? 
                               HttpStatus.CREATED : HttpStatus.OK;
            
            return ResponseEntity.status(status).body(response);

        } catch (RuntimeException e) {
            // Handle business logic errors (service layer exceptions)
            response.put("error", "Business rule violation");
            response.put("message", e.getMessage());
            
            // Map specific error types to appropriate HTTP status codes
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            } else if (e.getMessage().contains("your own product") || 
                      e.getMessage().contains("not available")) {
                return ResponseEntity.badRequest().body(response);
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
            }
            
        } catch (Exception e) {
            // Handle unexpected system errors
            System.err.println("Error initiating conversation: " + e.getMessage());
            e.printStackTrace();
            
            response.put("error", "System error");
            response.put("message", "An unexpected error occurred while initiating conversation");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Get all conversations for the current user (their inbox).
     * 
     * This endpoint retrieves the user's conversation inbox, showing all conversations
     * where they participate either as a buyer or seller. The conversations are ordered
     * by most recent activity, making it easy for users to see active discussions first.
     * 
     * Response includes essential information for the inbox UI:
     * - Conversation basic details (ID, status, participants)
     * - Product information (name, price, image)
     * - Last message preview for each conversation
     * - Unread message counts for notification badges
     * - Timestamps for activity sorting
     * 
     * This powers the main "Messages" or "Inbox" section of the user interface
     * where users can see all their ongoing and completed conversations.
     * 
     * Performance Considerations:
     * - Uses efficient database queries with proper indexing
     * - Returns essential data only (no full message history)
     * - Ordered by recent activity for better user experience
     * 
     * @param authentication - Spring Security authentication object (auto-injected)
     * @return ResponseEntity<Map<String, Object>> - User's conversation list with metadata
     */
    @GetMapping("/user")
    public ResponseEntity<Map<String, Object>> getUserConversations(Authentication authentication) {
        
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

            // Step 2: Get user's conversations from service
            List<Conversation> conversations = conversationService.getUserConversations(currentUser);

            // Step 3: Get additional metrics for inbox summary
            int unreadCount = conversationService.getUnreadConversationCount(currentUser);
            List<Conversation> pendingApprovals = conversationService.getConversationsRequiringApproval(currentUser);

            // Step 4: Prepare comprehensive response
            response.put("success", true);
            response.put("conversations", conversations);
            response.put("totalCount", conversations.size());
            response.put("unreadCount", unreadCount);
            response.put("pendingApprovalsCount", pendingApprovals.size());
            response.put("pendingApprovals", pendingApprovals);
            
            // Additional metadata for UI
            response.put("userId", currentUser.getId());
            response.put("username", currentUser.getUsername());
            response.put("message", conversations.isEmpty() ? 
                       "No conversations found" : 
                       "Conversations retrieved successfully");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            // Handle any system errors
            System.err.println("Error retrieving user conversations: " + e.getMessage());
            e.printStackTrace();
            
            response.put("error", "System error");
            response.put("message", "Failed to retrieve conversations");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Get a specific conversation by ID with full message history.
     * 
     * This endpoint retrieves complete conversation details including all messages
     * when a user opens a specific conversation from their inbox. It includes
     * comprehensive security validation to ensure only conversation participants
     * can access the conversation.
     * 
     * Response includes:
     * - Complete conversation details (participants, product, status)
     * - Full message history in chronological order
     * - Message metadata (sender, timestamps, read status)
     * - Conversation workflow information (approval status, etc.)
     * 
     * Security Features:
     * - Validates user is a conversation participant
     * - Prevents unauthorized access to private conversations
     * - Returns detailed error messages for debugging
     * 
     * Side Effects:
     * - Automatically marks unread messages as read for current user
     * - Updates last accessed timestamp (handled by service layer)
     * - Clears notification badges for this conversation
     * 
     * @param conversationId - The ID of the conversation to retrieve
     * @param authentication - Spring Security authentication object (auto-injected)
     * @return ResponseEntity<Map<String, Object>> - Complete conversation with messages
     */
    @GetMapping("/{conversationId}")
    public ResponseEntity<Map<String, Object>> getConversationById(
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

            // Step 2: Get conversation with security validation
            // Service layer handles participant validation and access control
            Conversation conversation = conversationService.getConversationById(conversationId, currentUser);

            // Step 3: Prepare detailed response
            response.put("success", true);
            response.put("conversation", conversation);
            response.put("message", "Conversation retrieved successfully");
            
            // Additional metadata for UI context
            response.put("currentUserId", currentUser.getId());
            response.put("userRole", conversation.getBuyer().getId() == currentUser.getId() ? "buyer" : "seller");
            response.put("otherParticipant", conversation.getOtherParticipant(currentUser));
            response.put("canApprove", canUserApprove(conversation, currentUser));
            response.put("canCancel", canUserCancel(conversation));

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            // Handle business logic errors from service layer
            response.put("error", "Access denied or not found");
            response.put("message", e.getMessage());
            
            // Map specific errors to appropriate HTTP status codes
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            } else if (e.getMessage().contains("not authorized")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }
            
        } catch (Exception e) {
            // Handle unexpected system errors
            System.err.println("Error retrieving conversation: " + e.getMessage());
            e.printStackTrace();
            
            response.put("error", "System error");
            response.put("message", "Failed to retrieve conversation");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Approve transaction completion for a conversation.
     * 
     * This endpoint handles the approval workflow where both buyer and seller must
     * approve before a transaction is considered complete. It implements the core
     * business logic of the student marketplace where trust and mutual agreement
     * are required for transaction completion.
     * 
     * Approval Workflow:
     * 1. Validate user is a conversation participant
     * 2. Check conversation is in a state that allows approval
     * 3. Record user's approval and update conversation status
     * 4. If both parties have approved, complete the transaction:
     *    - Create Order record for buyer's purchase history
     *    - Mark product as sold/unavailable
     *    - Set conversation status to COMPLETED
     *    - Generate completion system message
     * 
     * Business Rules:
     * - Only conversation participants can approve
     * - Users can only approve once
     * - Both buyer and seller must approve for completion
     * - Cannot approve cancelled or already completed conversations
     * 
     * @param conversationId - The ID of the conversation to approve
     * @param authentication - Spring Security authentication object (auto-injected)
     * @return ResponseEntity<Map<String, Object>> - Updated conversation status and completion details
     */
    @PostMapping("/{conversationId}/approve")
    public ResponseEntity<Map<String, Object>> approveTransaction(
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

            // Step 2: Process approval through service layer
            // Service handles all approval logic, validation, and workflow management
            Conversation updatedConversation = conversationService.approveTransaction(conversationId, currentUser);

            // Step 3: Prepare success response with approval details
            response.put("success", true);
            response.put("message", "Transaction approved successfully");
            response.put("conversation", updatedConversation);
            response.put("newStatus", updatedConversation.getStatus().toString());
            response.put("isCompleted", updatedConversation.getStatus().toString().equals("COMPLETED"));
            
            // Additional context for UI updates
            String userRole = updatedConversation.getBuyer().getId() == currentUser.getId() ? "buyer" : "seller";
            response.put("approvedBy", userRole);
            response.put("approverUsername", currentUser.getUsername());
            
            // If transaction is completed, include completion details
            if (updatedConversation.getStatus().toString().equals("COMPLETED")) {
                response.put("transactionCompleted", true);
                response.put("productSold", true);
                response.put("orderCreated", true);
                response.put("completionMessage", "🎉 Transaction completed! Both parties have approved.");
            } else {
                response.put("waitingForOtherParty", true);
                response.put("otherPartyRole", userRole.equals("buyer") ? "seller" : "buyer");
            }

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            // Handle business logic errors from service layer
            response.put("error", "Approval failed");
            response.put("message", e.getMessage());
            
            // Map specific error types to appropriate HTTP status codes
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            } else if (e.getMessage().contains("not authorized")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            } else if (e.getMessage().contains("already approved") || 
                      e.getMessage().contains("already completed") ||
                      e.getMessage().contains("cancelled")) {
                return ResponseEntity.badRequest().body(response);
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
            }
            
        } catch (Exception e) {
            // Handle unexpected system errors
            System.err.println("Error approving transaction: " + e.getMessage());
            e.printStackTrace();
            
            response.put("error", "System error");
            response.put("message", "Failed to approve transaction");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Cancel a conversation/transaction.
     * 
     * This endpoint allows either conversation participant to cancel an ongoing
     * conversation/transaction. Cancellation is permanent and cannot be undone,
     * but the conversation history is preserved for reference.
     * 
     * Cancellation Rules:
     * - Only conversation participants can cancel
     * - Cannot cancel already completed transactions
     * - Cancelled conversations remain in history for audit purposes
     * - Product remains available for other buyers after cancellation
     * 
     * Use Cases:
     * - Buyer decides not to purchase
     * - Seller decides not to sell
     * - Both parties agree to cancel
     * - Dispute resolution (manual cancellation)
     * 
     * @param conversationId - The ID of the conversation to cancel
     * @param authentication - Spring Security authentication object (auto-injected)
     * @return ResponseEntity<Map<String, Object>> - Cancellation confirmation and updated conversation
     */
    @PostMapping("/{conversationId}/cancel")
    public ResponseEntity<Map<String, Object>> cancelConversation(
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

            // Step 2: Process cancellation through service layer
            Conversation cancelledConversation = conversationService.cancelConversation(conversationId, currentUser);

            // Step 3: Prepare cancellation response
            response.put("success", true);
            response.put("message", "Conversation cancelled successfully");
            response.put("conversation", cancelledConversation);
            response.put("status", "CANCELLED");
            
            // Additional context for UI updates
            String userRole = cancelledConversation.getBuyer().getId() == currentUser.getId() ? "buyer" : "seller";
            response.put("cancelledBy", userRole);
            response.put("cancelerUsername", currentUser.getUsername());
            response.put("productStillAvailable", true);
            response.put("conversationArchived", true);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            // Handle business logic errors from service layer
            response.put("error", "Cancellation failed");
            response.put("message", e.getMessage());
            
            // Map specific error types to appropriate HTTP status codes
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            } else if (e.getMessage().contains("not authorized")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            } else if (e.getMessage().contains("already cancelled") || 
                      e.getMessage().contains("completed")) {
                return ResponseEntity.badRequest().body(response);
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
            }
            
        } catch (Exception e) {
            // Handle unexpected system errors
            System.err.println("Error cancelling conversation: " + e.getMessage());
            e.printStackTrace();
            
            response.put("error", "System error");
            response.put("message", "Failed to cancel conversation");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Get notification counts and pending actions for the current user.
     * 
     * This endpoint provides notification data for the user interface including:
     * - Number of conversations with unread messages
     * - Number of conversations requiring user's approval
     * - List of conversations with pending actions
     * 
     * This powers notification badges, alerts, and action item lists in the UI.
     * 
     * @param authentication - Spring Security authentication object (auto-injected)
     * @return ResponseEntity<Map<String, Object>> - Notification counts and pending actions
     */
    @GetMapping("/notifications")
    public ResponseEntity<Map<String, Object>> getNotifications(Authentication authentication) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Step 1: Validate authentication and get current user
            String username = authentication.getName();
            User currentUser = userService.findByUsername(username);
            
            if (currentUser == null) {
                response.put("error", "User not found");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            // Step 2: Get notification data
            int unreadCount = conversationService.getUnreadConversationCount(currentUser);
            List<Conversation> pendingApprovals = conversationService.getConversationsRequiringApproval(currentUser);

            // Step 3: Prepare notification response
            response.put("success", true);
            response.put("unreadConversations", unreadCount);
            response.put("pendingApprovals", pendingApprovals.size());
            response.put("pendingApprovalsList", pendingApprovals);
            response.put("totalNotifications", unreadCount + pendingApprovals.size());
            response.put("hasNotifications", (unreadCount + pendingApprovals.size()) > 0);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Error getting notifications: " + e.getMessage());
            response.put("error", "Failed to get notifications");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Helper method to determine if user can approve a conversation.
     * 
     * @param conversation - The conversation to check
     * @param user - The user to check approval rights for
     * @return boolean - true if user can approve, false otherwise
     */
    private boolean canUserApprove(Conversation conversation, User user) {
        if (!conversation.isParticipant(user)) {
            return false;
        }
        
        String status = conversation.getStatus().toString();
        
        // Cannot approve if already completed or cancelled
        if (status.equals("COMPLETED") || status.equals("CANCELLED")) {
            return false;
        }
        
        // Check if user hasn't already approved
        if (conversation.getBuyer().getId() == user.getId()) {
            return !status.equals("BUYER_APPROVED");
        } else {
            return !status.equals("SELLER_APPROVED");
        }
    }

    /**
     * Helper method to determine if user can cancel a conversation.
     * 
     * @param conversation - The conversation to check
     * @return boolean - true if conversation can be cancelled, false otherwise
     */
    private boolean canUserCancel(Conversation conversation) {
        String status = conversation.getStatus().toString();
        return !status.equals("COMPLETED") && !status.equals("CANCELLED");
    }
} 