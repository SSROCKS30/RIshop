package com.ssrocks.rishop_backend.repository;

import com.ssrocks.rishop_backend.model.Cart;
import com.ssrocks.rishop_backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Integer> {
    
    /**
     * Find cart by user
     * @param user - The user whose cart to find
     * @return Optional<Cart> - The user's cart if it exists
     */
    Optional<Cart> findByUser(User user);
    
    /**
     * Check if a cart exists for a user
     * @param user - The user to check
     * @return boolean - true if cart exists
     */
    boolean existsByUser(User user);
    
    /**
     * Delete cart by user
     * @param user - The user whose cart to delete
     */
    void deleteByUser(User user);
} 