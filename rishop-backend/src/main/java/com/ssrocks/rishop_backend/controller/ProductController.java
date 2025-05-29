package com.ssrocks.rishop_backend.controller;

import com.ssrocks.rishop_backend.model.Product;
import com.ssrocks.rishop_backend.model.User;
import com.ssrocks.rishop_backend.service.ProductService;
import com.ssrocks.rishop_backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api")
public class ProductController {
    @Autowired
    private ProductService productService;

    @Autowired
    private UserService userService;

    @GetMapping("/products")
    public List<Product> getProducts(){
        return productService.getProducts();
    }

    @GetMapping("/product/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable int id){
        Product product = productService.getProductById(id);
        return product.getId() != -1 ? new ResponseEntity<>(product, HttpStatus.OK) : new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @GetMapping("/products/{keyword}")
    public ResponseEntity<List<Product>> getProductByKeyword(@PathVariable String keyword){
        System.out.println("Keyword: " + keyword);
        List<Product> products = productService.getProductByKeyword(keyword);
        return !products.isEmpty() ? new ResponseEntity<>(products, HttpStatus.OK) : new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }


    @PostMapping("/addproduct")
    public ResponseEntity<Product> addProduct(
            @RequestPart Product product, 
            @RequestPart MultipartFile imageFile,
            Authentication authentication) {
        try {

            String username = authentication.getName();
            User currentUser = userService.findByUsername(username);
            
            if (currentUser == null) {
                return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
            }

            product.setUploadedBy(currentUser);
            
            Product savedProduct = productService.addProduct(product, imageFile);
            return new ResponseEntity<>(savedProduct, HttpStatus.CREATED);
        } catch (IOException e) {
            System.err.println("Error adding product: " + e.getMessage());
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (Exception e) {
            System.err.println("Unexpected error adding product: " + e.getMessage());
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/product/{id}")
    public ResponseEntity<String> deleteProduct(@PathVariable int id, Authentication authentication) {
        try {
            String username = authentication.getName();
            User currentUser = userService.findByUsername(username);
            
            if (currentUser == null) {
                return new ResponseEntity<>("User not found", HttpStatus.UNAUTHORIZED);
            }

            Product product = productService.getProductById(id);
            if (product.getId() == -1) {
                return new ResponseEntity<>("Product not found", HttpStatus.NOT_FOUND);
            }
            

            if (!Objects.equals(product.getUploadedBy().getId(), currentUser.getId())) {
                return new ResponseEntity<>("You can only delete your own products", HttpStatus.FORBIDDEN);
            }
            
            productService.deleteProduct(id);
            return new ResponseEntity<>("Product deleted successfully", HttpStatus.OK);
        } catch (Exception e) {
            System.err.println("Error deleting product: " + e.getMessage());
            return new ResponseEntity<>("Error deleting product", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/products/category/{category}")
    public ResponseEntity<List<Product>> getProductsByCategory(@PathVariable String category) {
        List<Product> product = productService.getProductByCategory(category);
        return product.isEmpty() ? new ResponseEntity<>(HttpStatus.NOT_FOUND) : new ResponseEntity<>(product, HttpStatus.OK);
    }

    @PutMapping("/product")
    public ResponseEntity<String> updateProductWithImage(
            @RequestPart Product product, 
            @RequestPart MultipartFile imageFile,
            Authentication authentication) {
        try {

            String username = authentication.getName();
            User currentUser = userService.findByUsername(username);
            
            if (currentUser == null) {
                return new ResponseEntity<>("User not found", HttpStatus.UNAUTHORIZED);
            }
            

            Product existingProduct = productService.getProductById(product.getId());
            if (existingProduct.getId() == -1) {
                return new ResponseEntity<>("Product not found", HttpStatus.NOT_FOUND);
            }
            

            if (!Objects.equals(existingProduct.getUploadedBy().getId(), currentUser.getId())) {
                return new ResponseEntity<>("You can only update your own products", HttpStatus.FORBIDDEN);
            }
            product.setUploadedBy(existingProduct.getUploadedBy());
            
            productService.updateProductWithImage(product, imageFile);
            return new ResponseEntity<>("Product updated successfully", HttpStatus.OK);
        } catch (IOException e) {
            System.err.println("Error updating product: " + e.getMessage());
            return new ResponseEntity<>("Error updating product", HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (Exception e) {
            System.err.println("Unexpected error updating product: " + e.getMessage());
            return new ResponseEntity<>("Error updating product", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/product/update")
    public ResponseEntity<String> updateProductWithoutImage(
            @RequestBody Product product,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            User currentUser = userService.findByUsername(username);
            if (currentUser == null) {
                return new ResponseEntity<>("User not found", HttpStatus.UNAUTHORIZED);
            }
            

            Product existingProduct = productService.getProductById(product.getId());
            if (existingProduct.getId() == -1) {
                return new ResponseEntity<>("Product not found", HttpStatus.NOT_FOUND);
            }
            

            if (!Objects.equals(existingProduct.getUploadedBy().getId(), currentUser.getId())) {
                return new ResponseEntity<>("You can only update your own products", HttpStatus.FORBIDDEN);
            }

            product.setUploadedBy(existingProduct.getUploadedBy());
            
            productService.updateProductWithoutImage(product);
            return new ResponseEntity<>("Product updated successfully", HttpStatus.OK);
        } catch (Exception e) {
            System.err.println("Error updating product: " + e.getMessage());
            return new ResponseEntity<>("Error updating product", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
