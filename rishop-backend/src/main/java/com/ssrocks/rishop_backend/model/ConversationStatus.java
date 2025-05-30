package com.ssrocks.rishop_backend.model;

public enum ConversationStatus {
    ACTIVE,          // Conversation is ongoing
    BUYER_APPROVED,  // Buyer has approved the transaction
    SELLER_APPROVED, // Seller has approved the transaction
    COMPLETED,       // Both parties approved, transaction completed
    CANCELLED        // Transaction was cancelled by either party
} 