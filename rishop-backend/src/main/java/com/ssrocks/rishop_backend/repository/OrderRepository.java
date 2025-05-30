package com.ssrocks.rishop_backend.repository;

import com.ssrocks.rishop_backend.model.Order;
import com.ssrocks.rishop_backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {
    
    /**
     * Find all orders for a user, ordered by order date (newest first).
     * 
     * @param user - The user whose orders to retrieve
     * @return List<Order> - All orders for the user, ordered by date descending
     */
    List<Order> findByUserOrderByOrderDateDesc(User user);
    
    /**
     * Find completed orders for a user (orders with completedAt timestamp).
     * 
     * @param user - The user whose completed orders to retrieve
     * @return List<Order> - All completed orders for the user
     */
    List<Order> findByUserAndCompletedAtIsNotNullOrderByCompletedAtDesc(User user);
    
    /**
     * Count total number of orders for a user.
     * 
     * @param user - The user to count orders for
     * @return int - Total number of orders
     */
    int countByUser(User user);
    
    /**
     * Calculate total amount spent by a user across all orders.
     * 
     * @param user - The user to calculate total for
     * @return BigDecimal - Sum of all order totals for the user
     */
    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.user = :user")
    BigDecimal sumTotalAmountByUser(@Param("user") User user);
    
    /**
     * Find orders for a user within a date range.
     * 
     * @param user - The user whose orders to retrieve
     * @param startDate - Start date for filtering
     * @param endDate - End date for filtering
     * @return List<Order> - Orders within the date range
     */
    @Query("SELECT o FROM Order o WHERE o.user = :user AND o.orderDate BETWEEN :startDate AND :endDate ORDER BY o.orderDate DESC")
    List<Order> findByUserAndOrderDateBetween(@Param("user") User user, 
                                             @Param("startDate") java.util.Date startDate, 
                                             @Param("endDate") java.util.Date endDate);
}