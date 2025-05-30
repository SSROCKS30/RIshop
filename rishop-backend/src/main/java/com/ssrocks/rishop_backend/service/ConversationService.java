package com.ssrocks.rishop_backend.service;

import com.ssrocks.rishop_backend.model.*;
import com.ssrocks.rishop_backend.repository.ConversationRepository;
import com.ssrocks.rishop_backend.repository.MessageRepository;
import com.ssrocks.rishop_backend.repository.ProductRepository;
import com.ssrocks.rishop_backend.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * Service class for managing conversations in the chat-based marketplace system.
 * 
 * This service handles the core business logic for conversation management including:
 * - Creating new conversations between buyers and sellers
 * - Managing conversation status and approval workflow
 * - Handling transaction completion and order creation
 * - Providing conversation data for user interfaces
 * 
 * The service implements the student marketplace workflow where:
 * 1. Buyer initiates conversation by clicking "Contact Seller"
 * 2. Both parties communicate through messages
 * 3. When ready, both parties approve the transaction
 * 4. System creates order record and marks product as sold
 * 
 * Key business rules:
 * - Users cannot create conversations for their own products
 * - Only one conversation per buyer-seller-product combination
 * - Both parties must approve before transaction completion
 * - Products are removed/marked sold after successful completion
 */
@Service
public class ConversationService {

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    /**
     * Initiate a new conversation between a buyer and seller for a specific product.
     * 
     * This method implements the core conversation creation logic when a user clicks
     * "Contact Seller" from their cart. It includes several important business validations:
     * 
     * Business Logic Flow:
     * 1. Validate that user is not trying to buy their own product
     * 2. Check if conversation already exists (prevent duplicates)
     * 3. Verify product is still available for purchase
     * 4. Create new conversation with ACTIVE status
     * 5. Create initial system message to start the conversation
     * 6. Return conversation details for UI redirection
     * 
     * Error Scenarios Handled:
     * - Product not found
     * - User trying to buy own product
     * - Product no longer available
     * - Conversation already exists
     * 
     * @param productId - The ID of the product the buyer is interested in
     * @param buyer - The user who wants to purchase (authenticated user)
     * @return Conversation - The newly created or existing conversation
     * @throws RuntimeException if validation fails or product issues exist
     */
    @Transactional
    public Conversation initiateConversation(int productId, User buyer) {
        // Step 1: Validate product exists and get product details
        Optional<Product> productOpt = productRepository.findById(productId);
        if (productOpt.isEmpty()) {
            throw new RuntimeException("Product not found with ID: " + productId);
        }
        Product product = productOpt.get();
        User seller = product.getUploadedBy();

        // Step 2: Business rule - prevent self-purchase
        // Users should not be able to create conversations for their own products
        if (Objects.equals(buyer.getId(), seller.getId())) {
            throw new RuntimeException("You cannot initiate a conversation for your own product");
        }

        // Step 3: Check for existing conversation to prevent duplicates
        // The unique constraint in database also prevents this, but we check here for better UX
        Optional<Conversation> existingConversation = 
            conversationRepository.findByBuyerAndSellerAndProduct(buyer, seller, product);
        
        if (existingConversation.isPresent()) {
            // Return existing conversation instead of creating duplicate
            // This allows users to resume existing conversations
            return existingConversation.get();
        }

        // Step 4: Validate product availability
        // Ensure product is still available and not already sold
        if (!product.isProductAvailable() || product.getStockQuantity() <= 0) {
            throw new RuntimeException("Product is no longer available for purchase");
        }

        // Step 5: Create new conversation
        Conversation conversation = new Conversation();
        conversation.setBuyer(buyer);
        conversation.setSeller(seller);
        conversation.setProduct(product);
        conversation.setStatus(ConversationStatus.ACTIVE);
        
        // Save conversation first to get generated ID
        Conversation savedConversation = conversationRepository.save(conversation);

        // Step 6: Create initial system message to welcome users
        Message systemMessage = new Message();
        systemMessage.setConversation(savedConversation);
        systemMessage.setSender(null); // System messages have no specific sender
        systemMessage.setContent("Conversation started for " + product.getName() + 
                                ". Buyer: " + buyer.getUsername() + 
                                ", Seller: " + seller.getUsername() + 
                                ". Please discuss payment method, pickup location, and any other details.");
        systemMessage.setMessageType(MessageType.SYSTEM_MESSAGE);
        systemMessage.setRead(false); // Both parties should see this message
        
        messageRepository.save(systemMessage);

        return savedConversation;
    }

    /**
     * Get all conversations for a user (their inbox).
     * 
     * This method retrieves all conversations where the user is either a buyer or seller.
     * It's used to populate the user's conversation list/inbox in the UI.
     * 
     * The conversations are ordered by most recent activity (updatedAt) so that
     * active conversations appear at the top of the list.
     * 
     * For each conversation, the UI typically shows:
     * - Other participant's name
     * - Product name and image
     * - Last message preview
     * - Unread message count
     * - Conversation status
     * 
     * @param user - The authenticated user whose conversations to retrieve
     * @return List<Conversation> - All conversations involving this user, ordered by recent activity
     */
    @Transactional(readOnly = true)
    public List<Conversation> getUserConversations(User user) {
        return conversationRepository.findByUserAsParticipant(user);
    }

    /**
     * Get a specific conversation by ID with security validation.
     * 
     * This method retrieves conversation details including all messages.
     * It includes important security validation to ensure only conversation
     * participants can access the conversation.
     * 
     * Security Features:
     * - Validates user is a participant before allowing access
     * - Prevents unauthorized users from viewing private conversations
     * - Returns complete conversation with message history
     * 
     * When this method is called (user opens conversation), it should trigger
     * marking messages as read for the current user.
     * 
     * @param conversationId - The ID of the conversation to retrieve
     * @param user - The authenticated user requesting access
     * @return Conversation - The conversation with all messages if user has access
     * @throws RuntimeException if conversation not found or user not authorized
     */
    @Transactional(readOnly = true)
    public Conversation getConversationById(int conversationId, User user) {
        // Step 1: Fetch conversation from database
        Optional<Conversation> conversationOpt = conversationRepository.findById(conversationId);
        if (conversationOpt.isEmpty()) {
            throw new RuntimeException("Conversation not found with ID: " + conversationId);
        }

        Conversation conversation = conversationOpt.get();

        // Step 2: Security validation - ensure user is a participant
        if (!conversation.isParticipant(user)) {
            throw new RuntimeException("You are not authorized to access this conversation");
        }

        return conversation;
    }

    /**
     * Approve transaction completion by the current user.
     * 
     * This method handles the approval workflow for transaction completion.
     * In the student marketplace system, both buyer and seller must approve
     * before the transaction is considered complete.
     * 
     * Approval Workflow:
     * 1. Validate user is participant and conversation is active
     * 2. Update status based on who is approving:
     *    - If buyer approves: status → BUYER_APPROVED
     *    - If seller approves: status → SELLER_APPROVED
     * 3. If both have approved (other party already approved):
     *    - Create Order record for buyer's purchase history
     *    - Mark product as sold/unavailable
     *    - Set conversation status to COMPLETED
     *    - Create system message announcing completion
     * 4. Create system message for approval action
     * 
     * Business Rules:
     * - Only ACTIVE conversations can be approved
     * - Users can only approve once
     * - Both parties must approve for completion
     * - Product becomes unavailable after completion
     * 
     * @param conversationId - The ID of the conversation to approve
     * @param user - The user who is approving the transaction
     * @return Conversation - Updated conversation with new status
     * @throws RuntimeException if validation fails or conversation cannot be approved
     */
    @Transactional
    public Conversation approveTransaction(int conversationId, User user) {
        // Step 1: Get conversation and validate access
        Conversation conversation = getConversationById(conversationId, user);

        // Step 2: Validate conversation can be approved
        if (conversation.getStatus() == ConversationStatus.COMPLETED) {
            throw new RuntimeException("Transaction has already been completed");
        }
        if (conversation.getStatus() == ConversationStatus.CANCELLED) {
            throw new RuntimeException("Cannot approve a cancelled transaction");
        }

        ConversationStatus newStatus;
        String approverRole;
        boolean bothApproved = false;

        // Step 3: Determine approval action based on user role
        if (Objects.equals(conversation.getBuyer().getId(), user.getId())) {
            // Buyer is approving
            if (conversation.getStatus() == ConversationStatus.BUYER_APPROVED) {
                throw new RuntimeException("You have already approved this transaction");
            }
            
            approverRole = "Buyer";
            if (conversation.getStatus() == ConversationStatus.SELLER_APPROVED) {
                // Seller already approved, so this completes the transaction
                newStatus = ConversationStatus.COMPLETED;
                bothApproved = true;
            } else {
                // First approval from buyer
                newStatus = ConversationStatus.BUYER_APPROVED;
            }
            
        } else if (Objects.equals(conversation.getSeller().getId(), user.getId())) {
            // Seller is approving
            if (conversation.getStatus() == ConversationStatus.SELLER_APPROVED) {
                throw new RuntimeException("You have already approved this transaction");
            }
            
            approverRole = "Seller";
            if (conversation.getStatus() == ConversationStatus.BUYER_APPROVED) {
                // Buyer already approved, so this completes the transaction
                newStatus = ConversationStatus.COMPLETED;
                bothApproved = true;
            } else {
                // First approval from seller
                newStatus = ConversationStatus.SELLER_APPROVED;
            }
            
        } else {
            throw new RuntimeException("You are not authorized to approve this transaction");
        }

        // Step 4: Update conversation status
        conversation.setStatus(newStatus);

        // Step 5: If both approved, complete the transaction
        if (bothApproved) {
            completeTransaction(conversation);
            
            // Create completion system message
            Message completionMessage = new Message();
            completionMessage.setConversation(conversation);
            completionMessage.setSender(null);
            completionMessage.setContent("🎉 Transaction completed successfully! Both parties have approved. " +
                                       "The product has been marked as sold and added to buyer's order history.");
            completionMessage.setMessageType(MessageType.SYSTEM_MESSAGE);
            messageRepository.save(completionMessage);
        } else {
            // Create approval system message
            Message approvalMessage = new Message();
            approvalMessage.setConversation(conversation);
            approvalMessage.setSender(null);
            approvalMessage.setContent(approverRole + " (" + user.getUsername() + ") has approved the transaction. " +
                                     "Waiting for the other party to approve.");
            approvalMessage.setMessageType(MessageType.SYSTEM_MESSAGE);
            messageRepository.save(approvalMessage);
        }

        return conversationRepository.save(conversation);
    }

    /**
     * Cancel a conversation/transaction.
     * 
     * This method allows either party to cancel an ongoing conversation/transaction.
     * Once cancelled, the conversation cannot be reactivated or approved.
     * 
     * Cancellation Rules:
     * - Only participants can cancel
     * - Cannot cancel already completed transactions
     * - Cancelled conversations remain in history for reference
     * - Product remains available for other buyers after cancellation
     * 
     * @param conversationId - The ID of the conversation to cancel
     * @param user - The user who is cancelling the conversation
     * @return Conversation - Updated conversation with CANCELLED status
     * @throws RuntimeException if validation fails or conversation cannot be cancelled
     */
    @Transactional
    public Conversation cancelConversation(int conversationId, User user) {
        // Step 1: Get conversation and validate access
        Conversation conversation = getConversationById(conversationId, user);

        // Step 2: Validate conversation can be cancelled
        if (conversation.getStatus() == ConversationStatus.COMPLETED) {
            throw new RuntimeException("Cannot cancel a completed transaction");
        }
        if (conversation.getStatus() == ConversationStatus.CANCELLED) {
            throw new RuntimeException("Conversation is already cancelled");
        }

        // Step 3: Update status to cancelled
        conversation.setStatus(ConversationStatus.CANCELLED);

        // Step 4: Create cancellation system message
        String cancelerRole = Objects.equals(conversation.getBuyer().getId(), user.getId()) ? "Buyer" : "Seller";
        Message cancellationMessage = new Message();
        cancellationMessage.setConversation(conversation);
        cancellationMessage.setSender(null);
        cancellationMessage.setContent(cancelerRole + " (" + user.getUsername() + ") has cancelled this transaction.");
        cancellationMessage.setMessageType(MessageType.SYSTEM_MESSAGE);
        messageRepository.save(cancellationMessage);

        return conversationRepository.save(conversation);
    }

    /**
     * Get count of unread conversations for a user.
     * 
     * This method returns the number of conversations that have unread messages
     * for the specified user. It's used to display notification badges in the UI.
     * 
     * @param user - The user to count unread conversations for
     * @return int - Number of conversations with unread messages
     */
    @Transactional(readOnly = true)
    public int getUnreadConversationCount(User user) {
        return conversationRepository.countUnreadConversationsForUser(user);
    }

    /**
     * Get conversations requiring user's approval.
     * 
     * This method finds conversations where the user needs to take action
     * (approve the transaction). It's used for notification systems and
     * action item displays in the UI.
     * 
     * @param user - The user to find pending approvals for
     * @return List<Conversation> - Conversations requiring user's approval
     */
    @Transactional(readOnly = true)
    public List<Conversation> getConversationsRequiringApproval(User user) {
        return conversationRepository.findConversationsRequiringUserApproval(user);
    }

    /**
     * Private helper method to complete a transaction when both parties approve.
     * 
     * This method handles the final steps of transaction completion:
     * 1. Create Order record for buyer's purchase history
     * 2. Mark product as sold/unavailable
     * 3. Set completion timestamp
     * 
     * This is called internally when both buyer and seller have approved.
     * 
     * @param conversation - The conversation to complete
     */
    private void completeTransaction(Conversation conversation) {
        Product product = conversation.getProduct();
        User buyer = conversation.getBuyer();

        // Step 1: Create Order record for buyer's purchase history
        Order order = new Order();
        order.setUser(buyer);
        order.setOrderDate(new Date()); // Explicitly set the order date
        order.setTotalAmount(product.getPrice());
        order.setConversation(conversation);
        order.markAsCompleted(); // Sets completedAt timestamp
        orderRepository.save(order);

        // Step 2: Mark product as sold and unavailable
        product.setProductAvailable(false);
        product.setStockQuantity(0);
        productRepository.save(product);

        // Note: In a real marketplace, you might want to soft-delete the product
        // or move it to a "sold products" table instead of just marking unavailable
    }
} 