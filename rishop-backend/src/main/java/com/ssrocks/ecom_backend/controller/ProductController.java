package com.ssrocks.ecom_backend.controller;

import com.ssrocks.ecom_backend.model.Product;
import com.ssrocks.ecom_backend.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class ProductController {
    @Autowired
    private ProductService productService;

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

    @GetMapping("/product/{id}/image")
    public ResponseEntity<byte[]> getProductImage(@PathVariable int id) {
        System.out.println("Product ID: " + id);
        return new ResponseEntity<>(productService.getProductById(id).getImageData(), HttpStatus.OK);
    }

    @PostMapping("/addproduct")
    public ResponseEntity<Product> addProduct(@RequestPart Product product, @RequestPart MultipartFile imageFile){
        Product savedProduct = null;
        try {
            savedProduct = productService.addProduct(product, imageFile);
            return new ResponseEntity<>(savedProduct, HttpStatus.CREATED);
        } catch (IOException e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/product/{id}")
    public void deleteProduct(@PathVariable int id){
        productService.deleteProduct(id);
    }

    @GetMapping("/products/category/{category}")
    public ResponseEntity<List<Product>> getProductsByCategory(@PathVariable String category) {
        List<Product> product = productService.getProductByCategory(category);
        return product.isEmpty() ? new ResponseEntity<>(HttpStatus.NOT_FOUND) : new ResponseEntity<>(product, HttpStatus.OK);
    }

    @PutMapping("/product")
    public void updateProductWithImage(@RequestPart Product product, @RequestPart MultipartFile imageFile) {
        try {
            productService.updateProductWithImage(product, imageFile);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @PutMapping("/product/update")
    public void updateProductWithoutImage(@RequestBody Product product) {
        productService.updateProductWithoutImage(product);
    }
}
