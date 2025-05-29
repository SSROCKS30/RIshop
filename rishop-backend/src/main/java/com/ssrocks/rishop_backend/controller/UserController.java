package com.ssrocks.rishop_backend.controller;

import com.ssrocks.rishop_backend.model.User;
import com.ssrocks.rishop_backend.model.Product;
import com.ssrocks.rishop_backend.model.Order;
import com.ssrocks.rishop_backend.service.JwtService;
import com.ssrocks.rishop_backend.service.UserService;
import com.ssrocks.rishop_backend.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class UserController {
    @Autowired
    private UserService userService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private ProductService productService;

    @PostMapping("/register")
    public String register(@RequestBody User user) {
        userService.saveUser(user);
        return "success";
    }

    @PostMapping("/login")
    public String login(@RequestBody User user){
        System.out.println("login controller");
        try {
            Authentication authentication = authenticationManager
                    .authenticate(new UsernamePasswordAuthenticationToken(user.getUsername(), user.getPassword()));

            System.out.println("Before check");
            if (authentication.isAuthenticated()) {
                System.out.println("Passed");
                return jwtService.generateToken(user.getUsername());
            } else {
                System.out.println("Failed");
                return "Login Failed";
            }
        } catch (AuthenticationException e) {
            System.out.println("Authentication failed: " + e.getMessage());
            return "INVALID";
        }
    }

    /**
     * Get current user's profile information
     * @param authentication - Automatically injected by Spring Security, contains authenticated user details
     * @return User profile information
     */
    @GetMapping("/user/profile")
    public ResponseEntity<User> getUserProfile(Authentication authentication) {
        try {
            // Get username from the authenticated user
            String username = authentication.getName();
            
            // Find user by username
            User user = userService.findByUsername(username);
            
            if (user != null) {
                return ResponseEntity.ok(user);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("Error fetching user profile: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get all products uploaded by the current user
     * @param authentication - Contains authenticated user details
     * @return List of products uploaded by the user
     */
    @GetMapping("/user/products") 
    public ResponseEntity<List<Product>> getUserProducts(Authentication authentication) {
        try {
            // Get username from the authenticated user
            String username = authentication.getName();
            
            // Find user by username
            User user = userService.findByUsername(username);
            
            if (user != null) {
                // Get products uploaded by this user
                List<Product> products = productService.getProductsByUser(user);
                System.out.println("Check getProductByUserService" + products);
                return ResponseEntity.ok(products);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("Error fetching user products: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get all orders placed by the current user
     * @param authentication - Contains authenticated user details
     * @return List of orders placed by the user
     */
    @GetMapping("/user/orders")
    public ResponseEntity<List<Order>> getUserOrders(Authentication authentication) {
        try {
            // Get username from the authenticated user
            String username = authentication.getName();
            
            // Find user by username
            User user = userService.findByUsername(username);
            
            if (user != null) {
                // Get orders placed by this user
                // Note: You'll need to implement getOrdersByUser in OrderService
                // List<Order> orders = orderService.getOrdersByUser(user);
                
                // For now, returning empty list until OrderService is implemented
                List<Order> orders = List.of(); // Empty list placeholder
                return ResponseEntity.ok(orders);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("Error fetching user orders: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
