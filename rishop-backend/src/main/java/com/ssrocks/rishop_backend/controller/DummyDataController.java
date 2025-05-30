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
import java.util.Optional;

@RestController
@RequestMapping("/load")
public class DummyDataController {

   @Autowired
   private UserRepository userRepository;

   @Autowired
   private ProductRepository productRepository;

   @GetMapping("/dummy")
   public String loadDummyData() {
       // Get existing users from database
       Optional<User> user1Opt = userRepository.findById(1);
       Optional<User> user2Opt = userRepository.findById(2);
       
       if (!user1Opt.isPresent() || !user2Opt.isPresent()) {
           return "Error: Users with ID 1 and 2 must exist in database before loading product data";
       }
       
       User user1 = user1Opt.get();
       User user2 = user2Opt.get();

       // Create Products
       List<String> productNames = Arrays.asList("iphone 15 pro", "LG Ultragear", "Oneplus 13", "Samsung s21 fe", "Sony WH-1000XM5", "Samsung watch ultra");
       List<Product> products = Arrays.asList(
           new Product(0, productNames.get(0), "Latest iPhone model", "Apple", "Electronics", new BigDecimal("125000"), new Date(), true, 10, "https://res.cloudinary.com/dbjepbbml/image/upload/v1748268839/iPhone_15_pro_o0bmr2.png", null, user1, new Date()),
           new Product(0, productNames.get(1), "High refresh rate gaming monitor", "LG", "Electronics", new BigDecimal("25600"), new Date(), true, 15, "https://res.cloudinary.com/dbjepbbml/image/upload/v1748268838/LG_Ultragear_jhgwva.png", null, user1, new Date()),
           new Product(0, productNames.get(2), "Flagship killer phone", "Oneplus", "Electronics", new BigDecimal("64000"), new Date(), true, 20, "https://res.cloudinary.com/dbjepbbml/image/upload/v1748268839/oneplus_13_qflmxl.png", null, user2, new Date()),
           new Product(0, productNames.get(3), "Feature-packed Samsung phone", "Samsung", "Electronics", new BigDecimal("29999"), new Date(), true, 5, "https://res.cloudinary.com/dbjepbbml/image/upload/v1748268839/S21_Fe_ddbaqh.png", null, user2, new Date()),
           new Product(0, productNames.get(4), "Noise cancelling headphones", "Sony", "Audio", new BigDecimal("24000"), new Date(), true, 25, "https://res.cloudinary.com/dbjepbbml/image/upload/v1748268839/Sony_WH-1000XM5_oflmiz.png", null, user1, new Date()),
           new Product(0, productNames.get(5), "Premium Samsung smartwatch", "Samsung", "Wearables", new BigDecimal("41500"), new Date(), true, 8, "https://res.cloudinary.com/dbjepbbml/image/upload/v1748268839/Watch_Ultra_hrxudx.png", null, user1, new Date())
       );
       productRepository.saveAll(products);

       return "Product dummy data loaded successfully!";
   }
}