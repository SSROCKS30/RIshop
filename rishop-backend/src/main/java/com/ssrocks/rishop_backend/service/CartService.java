package com.ssrocks.rishop_backend.service;

import com.ssrocks.rishop_backend.model.Cart;
import com.ssrocks.rishop_backend.model.CartItem;
import com.ssrocks.rishop_backend.model.Product;
import com.ssrocks.rishop_backend.model.User;
import com.ssrocks.rishop_backend.repository.CartRepository;
import com.ssrocks.rishop_backend.repository.CartItemRepository;
import com.ssrocks.rishop_backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class CartService {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private ProductRepository productRepository;

    /**
     * Get or create a cart for the user
     * @param user - The user
     * @return Cart - The user's cart
     */
    @Transactional
    public Cart getOrCreateCart(User user) {
        Optional<Cart> existingCart = cartRepository.findByUser(user);
        if (existingCart.isPresent()) {
            return existingCart.get();
        }

        // Create new cart for user
        Cart newCart = new Cart();
        newCart.setUser(user);
        return cartRepository.save(newCart);
    }

    /**
     * Get user's cart with all items
     * @param user - The user
     * @return Cart - The user's cart with items
     */
    @Transactional(readOnly = true)
    public Cart getUserCart(User user) {
        Optional<Cart> cart = cartRepository.findByUser(user);
        return cart.orElse(null);
    }

    /**
     * Add item to cart or update quantity if item already exists
     * @param user - The user
     * @param productId - The product ID to add
     * @param quantity - The quantity to add
     * @return CartItem - The added/updated cart item
     */
    @Transactional
    public CartItem addItemToCart(User user, int productId, int quantity) {
        // Get or create cart for user
        Cart cart = getOrCreateCart(user);

        // Find the product
        Optional<Product> productOpt = productRepository.findById(productId);
        if (productOpt.isEmpty()) {
            throw new RuntimeException("Product not found with ID: " + productId);
        }
        Product product = productOpt.get();

        // Check if product has sufficient stock
        if (product.getStockQuantity() < quantity) {
            throw new RuntimeException("Insufficient stock. Available: " + product.getStockQuantity() + ", Requested: " + quantity);
        }

        // Check if item already exists in cart
        Optional<CartItem> existingItem = cartItemRepository.findByCartAndProduct(cart, product);
        
        if (existingItem.isPresent()) {
            // Update existing item quantity
            CartItem cartItem = existingItem.get();
            int newQuantity = cartItem.getQuantity() + quantity;
            
            // Check total quantity against stock
            if (product.getStockQuantity() < newQuantity) {
                throw new RuntimeException("Insufficient stock. Available: " + product.getStockQuantity() + 
                    ", Already in cart: " + cartItem.getQuantity() + ", Trying to add: " + quantity);
            }
            
            cartItem.setQuantity(newQuantity);
            return cartItemRepository.save(cartItem);
        } else {
            // Create new cart item
            CartItem cartItem = new CartItem();
            cartItem.setCart(cart);
            cartItem.setProduct(product);
            cartItem.setQuantity(quantity);
            return cartItemRepository.save(cartItem);
        }
    }

    /**
     * Update cart item quantity
     * @param user - The user
     * @param productId - The product ID
     * @param newQuantity - The new quantity
     * @return CartItem - The updated cart item
     */
    @Transactional
    public CartItem updateCartItemQuantity(User user, int productId, int newQuantity) {
        Cart cart = getUserCart(user);
        if (cart == null) {
            throw new RuntimeException("Cart not found for user");
        }

        Optional<Product> productOpt = productRepository.findById(productId);
        if (productOpt.isEmpty()) {
            throw new RuntimeException("Product not found");
        }
        Product product = productOpt.get();

        Optional<CartItem> cartItemOpt = cartItemRepository.findByCartAndProduct(cart, product);
        if (cartItemOpt.isEmpty()) {
            throw new RuntimeException("Item not found in cart");
        }

        CartItem cartItem = cartItemOpt.get();

        if (newQuantity <= 0) {
            // Remove item if quantity is 0 or negative
            cartItemRepository.delete(cartItem);
            return null;
        }

        // Check stock availability
        if (product.getStockQuantity() < newQuantity) {
            throw new RuntimeException("Insufficient stock. Available: " + product.getStockQuantity());
        }

        cartItem.setQuantity(newQuantity);
        return cartItemRepository.save(cartItem);
    }

    /**
     * Remove item from cart
     * @param user - The user
     * @param productId - The product ID to remove
     */
    @Transactional
    public void removeItemFromCart(User user, int productId) {
        Cart cart = getUserCart(user);
        if (cart == null) {
            throw new RuntimeException("Cart not found for user");
        }

        Optional<Product> productOpt = productRepository.findById(productId);
        if (productOpt.isEmpty()) {
            throw new RuntimeException("Product not found");
        }
        Product product = productOpt.get();

        Optional<CartItem> cartItemOpt = cartItemRepository.findByCartAndProduct(cart, product);
        if (cartItemOpt.isPresent()) {
            cartItemRepository.delete(cartItemOpt.get());
        }
    }

    /**
     * Clear all items from user's cart
     * @param user - The user
     */
    @Transactional
    public void clearCart(User user) {
        Cart cart = getUserCart(user);
        if (cart != null) {
            cartItemRepository.deleteByCart(cart);
        }
    }

    /**
     * Get total price of user's cart
     * @param user - The user
     * @return double - Total price
     */
    @Transactional(readOnly = true)
    public double getCartTotal(User user) {
        Cart cart = getUserCart(user);
        if (cart == null || cart.getCartItems().isEmpty()) {
            return 0.0;
        }

        return cart.getCartItems().stream()
                .mapToDouble(item -> item.getProduct().getPrice().doubleValue() * item.getQuantity())
                .sum();
    }

    /**
     * Get cart item count for user
     * @param user - The user
     * @return int - Total number of items in cart
     */
    @Transactional(readOnly = true)
    public int getCartItemCount(User user) {
        Cart cart = getUserCart(user);
        if (cart == null || cart.getCartItems().isEmpty()) {
            return 0;
        }

        return cart.getCartItems().stream()
                .mapToInt(CartItem::getQuantity)
                .sum();
    }
} 