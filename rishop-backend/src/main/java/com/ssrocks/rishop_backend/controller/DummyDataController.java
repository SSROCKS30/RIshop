package com.ssrocks.rishop_backend.controller;

import com.ssrocks.rishop_backend.model.*;
import com.ssrocks.rishop_backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Random;

@RestController
@RequestMapping("/load")
public class DummyDataController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    private Random random = new Random();

    @GetMapping("/dummy")
    public String loadDummyData() {
        // Create Users
        User user1 = new User(0, "john_doe", "john.doe@example.com", "password123", new Date());
        User user2 = new User(0, "jane_smith", "jane.smith@example.com", "password456", new Date());
        userRepository.saveAll(Arrays.asList(user1, user2));

        // Create Products
        List<String> productNames = Arrays.asList("iphone 15 pro", "LG Ultragear", "Oneplus 13", "Samsung s21 fe", "Sony WH-1000XM5", "Samsung watch ultra");
        List<Product> products = Arrays.asList(
            new Product(0, productNames.get(0), "Latest iPhone model", "Apple", "Electronics", new BigDecimal("999.99"), new Date(), true, 10, "https://res.cloudinary.com/dbjepbbml/image/upload/v1748268839/iPhone_15_pro_o0bmr2.png", null, user1, new Date()),
            new Product(0, productNames.get(1), "High refresh rate gaming monitor", "LG", "Electronics", new BigDecimal("499.50"), new Date(), true, 15, "https://res.cloudinary.com/dbjepbbml/image/upload/v1748268838/LG_Ultragear_jhgwva.png", null, user1, new Date()),
            new Product(0, productNames.get(2), "Flagship killer phone", "Oneplus", "Electronics", new BigDecimal("799.00"), new Date(), true, 20, "https://res.cloudinary.com/dbjepbbml/image/upload/v1748268839/oneplus_13_qflmxl.png", null, user2, new Date()),
            new Product(0, productNames.get(3), "Feature-packed Samsung phone", "Samsung", "Electronics", new BigDecimal("699.00"), new Date(), true, 5, "https://res.cloudinary.com/dbjepbbml/image/upload/v1748268839/S21_Fe_ddbaqh.png", null, user2, new Date()),
            new Product(0, productNames.get(4), "Noise cancelling headphones", "Sony", "Audio", new BigDecimal("349.99"), new Date(), true, 25, "https://res.cloudinary.com/dbjepbbml/image/upload/v1748268839/Sony_WH-1000XM5_oflmiz.png", null, user1, new Date()),
            new Product(0, productNames.get(5), "Premium Samsung smartwatch", "Samsung", "Wearables", new BigDecimal("429.00"), new Date(), true, 8, "https://res.cloudinary.com/dbjepbbml/image/upload/v1748268839/Watch_Ultra_hrxudx.png", null, user2, new Date())
        );
        productRepository.saveAll(products);

        // Create Carts
        Cart cart1 = new Cart();
        cart1.setUser(user1);
        
        Cart cart2 = new Cart();
        cart2.setUser(user2);
        
        cartRepository.saveAll(Arrays.asList(cart1, cart2));

        // Create Cart Items
        if (!products.isEmpty()) {
            CartItem cartItem1 = new CartItem();
            cartItem1.setCart(cart1);
            cartItem1.setProduct(products.get(random.nextInt(products.size())));
            cartItem1.setQuantity(1);
            
            CartItem cartItem2 = new CartItem();
            cartItem2.setCart(cart1);
            cartItem2.setProduct(products.get(random.nextInt(products.size())));
            cartItem2.setQuantity(2);
            
            CartItem cartItem3 = new CartItem();
            cartItem3.setCart(cart2);
            cartItem3.setProduct(products.get(random.nextInt(products.size())));
            cartItem3.setQuantity(1);
            
            cartItemRepository.saveAll(Arrays.asList(cartItem1, cartItem2, cartItem3));
        }


        // Create Orders
        Order order1 = new Order(0, user1, new Date(), new BigDecimal("1499.49"));
        Order order2 = new Order(0, user2, new Date(), new BigDecimal("799.00"));
        orderRepository.saveAll(Arrays.asList(order1, order2));

        // Create Order Items
         if (!products.isEmpty()) {
            OrderItem orderItem1 = new OrderItem(0, order1, products.get(0), 1, products.get(0).getPrice());
            OrderItem orderItem2 = new OrderItem(0, order1, products.get(1), 1, products.get(1).getPrice());
            OrderItem orderItem3 = new OrderItem(0, order2, products.get(2), 1, products.get(2).getPrice());
            orderItemRepository.saveAll(Arrays.asList(orderItem1, orderItem2, orderItem3));
        }

        return "Dummy data loaded successfully!";
    }
} 