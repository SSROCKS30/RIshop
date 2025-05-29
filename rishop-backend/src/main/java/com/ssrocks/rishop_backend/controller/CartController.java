package com.ssrocks.rishop_backend.controller;

import com.ssrocks.rishop_backend.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
public class CartController {
    @Autowired
    ProductService productService;

    @PutMapping("/product/{id}/quantity/{quantity}")
    public void updateQuantity(@PathVariable int id, @PathVariable int quantity) {
        productService.updateQuantity(id, quantity);
    }
}
