package com.ssrocks.rishop_backend.repository;

import com.ssrocks.rishop_backend.model.Cart;
import com.ssrocks.rishop_backend.model.CartItem;
import com.ssrocks.rishop_backend.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Integer> {
    
    /**
     * Find all cart items for a specific cart
     * @param cart - The cart to get items for
     * @return List<CartItem> - List of cart items
     */
    List<CartItem> findByCart(Cart cart);
    
    /**
     * Find a specific cart item by cart and product
     * @param cart - The cart
     * @param product - The product
     * @return Optional<CartItem> - The cart item if it exists
     */
    Optional<CartItem> findByCartAndProduct(Cart cart, Product product);
    
    /**
     * Delete all cart items for a specific cart
     * @param cart - The cart whose items to delete
     */
    void deleteByCart(Cart cart);
    
    /**
     * Check if a cart item exists for a cart and product
     * @param cart - The cart
     * @param product - The product
     * @return boolean - true if cart item exists
     */
    boolean existsByCartAndProduct(Cart cart, Product product);
} 