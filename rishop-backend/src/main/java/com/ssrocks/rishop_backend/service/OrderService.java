package com.ssrocks.rishop_backend.service;

import com.ssrocks.rishop_backend.model.Order;
import com.ssrocks.rishop_backend.model.User;
import com.ssrocks.rishop_backend.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service class for managing orders in the marketplace system.
 * 
 * This service handles order-related operations including:
 * - Retrieving user's order history
 * - Order status management
 * - Order statistics and reporting
 */
@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    /**
     * Get all orders placed by a user.
     * 
     * This method retrieves the complete order history for a user,
     * ordered by most recent orders first. This is used to display
     * the user's purchase history in their profile.
     * 
     * @param user - The user whose orders to retrieve
     * @return List<Order> - All orders placed by the user, ordered by date (newest first)
     */
    @Transactional(readOnly = true)
    public List<Order> getOrdersByUser(User user) {
        return orderRepository.findByUserOrderByOrderDateDesc(user);
    }

    /**
     * Get completed orders by user.
     * 
     * This method retrieves only the completed orders for a user,
     * filtering out any incomplete or pending orders.
     * 
     * @param user - The user whose completed orders to retrieve
     * @return List<Order> - All completed orders for the user
     */
    @Transactional(readOnly = true)
    public List<Order> getCompletedOrdersByUser(User user) {
        return orderRepository.findByUserAndCompletedAtIsNotNullOrderByCompletedAtDesc(user);
    }

    /**
     * Get total number of orders for a user.
     * 
     * @param user - The user to count orders for
     * @return int - Total number of orders
     */
    @Transactional(readOnly = true)
    public int getTotalOrdersCount(User user) {
        return orderRepository.countByUser(user);
    }

    /**
     * Get total amount spent by a user across all orders.
     * 
     * @param user - The user to calculate total spending for
     * @return BigDecimal - Total amount spent (sum of all order totals)
     */
    @Transactional(readOnly = true)
    public java.math.BigDecimal getTotalSpentByUser(User user) {
        java.math.BigDecimal total = orderRepository.sumTotalAmountByUser(user);
        return total != null ? total : java.math.BigDecimal.ZERO;
    }
} 