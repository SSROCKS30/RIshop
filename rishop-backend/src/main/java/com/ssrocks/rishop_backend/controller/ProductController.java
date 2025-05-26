package com.ssrocks.rishop_backend.controller;

import com.ssrocks.rishop_backend.model.Product;
import com.ssrocks.rishop_backend.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

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

    /*
    // This endpoint is likely no longer needed as the frontend can use the imageUrl from the Product object directly from Cloudinary.
    // If you still need to proxy images, this would need to be rewritten to fetch from Cloudinary URL.
    @GetMapping("/product/{id}/image")
    public ResponseEntity<byte[]> getProductImage(@PathVariable int id) {
        System.out.println("Product ID: " + id);
        // Old logic: return new ResponseEntity<>(productService.getProductById(id).getImageData(), HttpStatus.OK);
        // New logic would involve fetching image from Cloudinary URL stored in product.getImageUrl()
        // and then returning it. For now, commenting out as direct URL usage is preferred.
        return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED); // Or simply remove the endpoint
    }
    */

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
