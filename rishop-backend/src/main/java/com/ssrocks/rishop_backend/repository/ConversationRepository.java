package com.ssrocks.rishop_backend.repository;

import com.ssrocks.rishop_backend.model.Conversation;
import com.ssrocks.rishop_backend.model.ConversationStatus;
import com.ssrocks.rishop_backend.model.Product;
import com.ssrocks.rishop_backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for managing Conversation entities in the chat system.
 * 
 * This repository handles all database operations related to conversations between
 * buyers and sellers. It provides methods to find conversations by participants,
 * check for existing conversations, and retrieve conversation lists for user inboxes.
 * 
 * Key responsibilities:
 * - Find conversations by buyer/seller/product combinations
 * - Retrieve user's conversation inbox (as buyer or seller)
 * - Check for existing conversations to prevent duplicates
 * - Find conversations by status for workflow management
 */
@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Integer> {
    
    /**
     * Find an existing conversation between a buyer, seller for a specific product.
     * 
     * This method is crucial for preventing duplicate conversations. Before creating
     * a new conversation, we check if one already exists for the same buyer-seller-product
     * combination. This ensures data integrity and prevents conversation fragmentation.
     * 
     * Use case: When a user clicks "Contact Seller" from cart, we first check if
     * they already have an active conversation about this product.
     * 
     * @param buyer - The user who wants to purchase (conversation initiator)
     * @param seller - The user who uploaded the product (conversation recipient)
     * @param product - The specific product being discussed
     * @return Optional<Conversation> - The existing conversation if found, empty otherwise
     */
    Optional<Conversation> findByBuyerAndSellerAndProduct(User buyer, User seller, Product product);
    
    /**
     * Find all conversations where the user is either a buyer or seller.
     * 
     * This method powers the user's inbox/conversation list. It returns all conversations
     * where the user is participating, regardless of whether they initiated (buyer) or
     * received (seller) the conversation request.
     * 
     * The results should be ordered by most recent activity (updatedAt) to show
     * active conversations first.
     * 
     * Use case: Displaying the user's message inbox with all their active conversations.
     * 
     * @param user - The user whose conversations to retrieve
     * @return List<Conversation> - All conversations involving this user, ordered by recent activity
     */
    @Query("SELECT c FROM Conversation c WHERE c.buyer = :user OR c.seller = :user ORDER BY c.updatedAt DESC")
    List<Conversation> findByUserAsParticipant(@Param("user") User user);
    
    /**
     * Find all conversations where the user is the buyer.
     * 
     * This method is useful for scenarios where we need to specifically get conversations
     * initiated by the user (where they are the buyer). This can be used for analytics,
     * purchase history tracking, or buyer-specific features.
     * 
     * @param buyer - The user who initiated conversations (buyer role)
     * @return List<Conversation> - All conversations where user is the buyer
     */
    List<Conversation> findByBuyer(User buyer);
    
    /**
     * Find all conversations where the user is the seller.
     * 
     * This method retrieves conversations where the user is selling their products.
     * Useful for seller dashboard, managing incoming purchase requests, and
     * seller-specific analytics.
     * 
     * @param seller - The user who is selling products (seller role)
     * @return List<Conversation> - All conversations where user is the seller
     */
    List<Conversation> findBySeller(User seller);
    
    /**
     * Find conversations by status for workflow management.
     * 
     * This method enables filtering conversations by their current status, which is
     * essential for workflow management and user experience. For example:
     * - ACTIVE: Show ongoing negotiations
     * - BUYER_APPROVED/SELLER_APPROVED: Show pending approvals
     * - COMPLETED: Show successful transactions
     * - CANCELLED: Show cancelled negotiations
     * 
     * @param status - The conversation status to filter by
     * @return List<Conversation> - All conversations with the specified status
     */
    List<Conversation> findByStatus(ConversationStatus status);
    
    /**
     * Find conversations for a specific product.
     * 
     * This method is useful for product analytics, understanding demand patterns,
     * and managing product-specific conversations. It can help sellers see all
     * inquiries about their specific products.
     * 
     * @param product - The product to find conversations for
     * @return List<Conversation> - All conversations about this product
     */
    List<Conversation> findByProduct(Product product);
    
    /**
     * Check if a conversation exists between buyer and seller for a product.
     * 
     * This is a convenience method for quick existence checks without fetching
     * the actual conversation object. Useful for validation logic and preventing
     * duplicate conversation creation attempts.
     * 
     * @param buyer - The potential buyer
     * @param seller - The product seller
     * @param product - The product in question
     * @return boolean - true if conversation exists, false otherwise
     */
    boolean existsByBuyerAndSellerAndProduct(User buyer, User seller, Product product);
    
    /**
     * Count unread conversations for a user.
     * 
     * This method counts conversations that have unread messages for the specified user.
     * This powers the notification badge in the UI showing how many conversations
     * have new messages waiting for the user's attention.
     * 
     * The query joins with Message table and checks for unread messages where the
     * user is not the sender (meaning they received unread messages).
     * 
     * @param user - The user to count unread conversations for
     * @return int - Number of conversations with unread messages for this user
     */
    @Query("SELECT COUNT(DISTINCT c) FROM Conversation c " +
           "JOIN c.messages m " +
           "WHERE (c.buyer = :user OR c.seller = :user) " +
           "AND m.isRead = false " +
           "AND m.sender != :user")
    int countUnreadConversationsForUser(@Param("user") User user);
    
    /**
     * Find conversations with pending approvals for a user.
     * 
     * This method finds conversations where the user needs to take action for
     * transaction completion. It looks for conversations where:
     * - Status is BUYER_APPROVED and user is the seller (seller needs to approve)
     * - Status is SELLER_APPROVED and user is the buyer (buyer needs to approve)
     * 
     * This powers notifications and action items in the user interface.
     * 
     * @param user - The user who needs to take approval action
     * @return List<Conversation> - Conversations requiring user's approval
     */
    @Query("SELECT c FROM Conversation c WHERE " +
           "(c.status = 'BUYER_APPROVED' AND c.seller = :user) OR " +
           "(c.status = 'SELLER_APPROVED' AND c.buyer = :user)")
    List<Conversation> findConversationsRequiringUserApproval(@Param("user") User user);
} 