package com.ssrocks.rishop_backend.controller;

import com.ssrocks.rishop_backend.model.Cart;
import com.ssrocks.rishop_backend.model.CartItem;
import com.ssrocks.rishop_backend.model.User;
import com.ssrocks.rishop_backend.service.CartService;
import com.ssrocks.rishop_backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    @Autowired
    private CartService cartService;

    @Autowired
    private UserService userService;

    /**
     * Get user's cart with all items
     * @param authentication - Current authenticated user
     * @return ResponseEntity with cart data
     */
    @GetMapping
    public ResponseEntity<?> getUserCart(Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userService.findByUsername(username);
            
            if (user == null) {
                return ResponseEntity.badRequest().body("User not found");
            }

            Cart cart = cartService.getUserCart(user);
            if (cart == null) {
                // Return empty cart response
                Map<String, Object> emptyCartResponse = new HashMap<>();
                emptyCartResponse.put("cartItems", new Object[0]);
                emptyCartResponse.put("totalPrice", 0.0);
                emptyCartResponse.put("itemCount", 0);
                return ResponseEntity.ok(emptyCartResponse);
            }

            // Create response with cart details
            Map<String, Object> response = new HashMap<>();
            response.put("cartItems", cart.getCartItems());
            response.put("totalPrice", cartService.getCartTotal(user));
            response.put("itemCount", cartService.getCartItemCount(user));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error getting user cart: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Failed to get cart");
        }
    }

    /**
     * Add item to cart
     * @param authentication - Current authenticated user
     * @param productId - Product ID to add
     * @param quantity - Quantity to add (default: 1)
     * @return ResponseEntity with cart item
     */
    @PostMapping("/add/{productId}")
    public ResponseEntity<?> addItemToCart(
            Authentication authentication,
            @PathVariable int productId,
            @RequestParam(defaultValue = "1") int quantity) {
        try {
            String username = authentication.getName();
            User user = userService.findByUsername(username);
            
            if (user == null) {
                return ResponseEntity.badRequest().body("User not found");
            }

            if (quantity <= 0) {
                return ResponseEntity.badRequest().body("Quantity must be positive");
            }

            CartItem cartItem = cartService.addItemToCart(user, productId, quantity);
            
            // Create response
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Item added to cart successfully");
            response.put("cartItem", cartItem);
            response.put("totalPrice", cartService.getCartTotal(user));
            response.put("itemCount", cartService.getCartItemCount(user));
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            System.err.println("Error adding item to cart: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Failed to add item to cart");
        }
    }

    /**
     * Update cart item quantity
     * @param authentication - Current authenticated user
     * @param productId - Product ID
     * @param quantity - New quantity
     * @return ResponseEntity with updated cart item
     */
    @PutMapping("/item/{productId}/quantity/{quantity}")
    public ResponseEntity<?> updateCartItemQuantity(
            Authentication authentication,
            @PathVariable int productId,
            @PathVariable int quantity) {
        try {
            String username = authentication.getName();
            User user = userService.findByUsername(username);
            
            if (user == null) {
                return ResponseEntity.badRequest().body("User not found");
            }

            CartItem cartItem = cartService.updateCartItemQuantity(user, productId, quantity);
            
            // Create response
            Map<String, Object> response = new HashMap<>();
            if (cartItem == null) {
                response.put("message", "Item removed from cart");
            } else {
                response.put("message", "Cart item quantity updated");
                response.put("cartItem", cartItem);
            }
            response.put("totalPrice", cartService.getCartTotal(user));
            response.put("itemCount", cartService.getCartItemCount(user));
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            System.err.println("Error updating cart item quantity: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Failed to update cart item");
        }
    }

    /**
     * Remove item from cart
     * @param authentication - Current authenticated user
     * @param productId - Product ID to remove
     * @return ResponseEntity with success message
     */
    @DeleteMapping("/item/{productId}")
    public ResponseEntity<?> removeItemFromCart(
            Authentication authentication,
            @PathVariable int productId) {
        try {
            String username = authentication.getName();
            User user = userService.findByUsername(username);
            
            if (user == null) {
                return ResponseEntity.badRequest().body("User not found");
            }

            cartService.removeItemFromCart(user, productId);
            
            // Create response
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Item removed from cart successfully");
            response.put("totalPrice", cartService.getCartTotal(user));
            response.put("itemCount", cartService.getCartItemCount(user));
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            System.err.println("Error removing item from cart: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Failed to remove item from cart");
        }
    }

    /**
     * Clear all items from cart
     * @param authentication - Current authenticated user
     * @return ResponseEntity with success message
     */
    @DeleteMapping("/clear")
    public ResponseEntity<?> clearCart(Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userService.findByUsername(username);
            
            if (user == null) {
                return ResponseEntity.badRequest().body("User not found");
            }

            cartService.clearCart(user);
            
            // Create response
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Cart cleared successfully");
            response.put("totalPrice", 0.0);
            response.put("itemCount", 0);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error clearing cart: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Failed to clear cart");
        }
    }

    /**
     * Get cart summary (total price and item count)
     * @param authentication - Current authenticated user
     * @return ResponseEntity with cart summary
     */
    @GetMapping("/summary")
    public ResponseEntity<?> getCartSummary(Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userService.findByUsername(username);
            
            if (user == null) {
                return ResponseEntity.badRequest().body("User not found");
            }

            Map<String, Object> summary = new HashMap<>();
            summary.put("totalPrice", cartService.getCartTotal(user));
            summary.put("itemCount", cartService.getCartItemCount(user));
            
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            System.err.println("Error getting cart summary: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Failed to get cart summary");
        }
    }
}
