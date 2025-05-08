package com.ssrocks.rishop_backend.service;

import com.ssrocks.rishop_backend.model.Product;
import com.ssrocks.rishop_backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<Product> getProducts() {
        return productRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Product getProductById(int id) {
        return productRepository.findById(id).orElse(new Product(-1));
    }

    @Transactional(readOnly = true)
    public List<Product> getProductByKeyword(String keyword) {
        return productRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrBrandContainingIgnoreCase(keyword, keyword, keyword);
    }

    @Transactional
    public Product addProduct(Product product, MultipartFile image) throws IOException {
        product.setImageData(image.getBytes());
        product.setImageType(image.getContentType());
        product.setImageName(image.getOriginalFilename());

        return productRepository.save(product);
    }

    @Transactional
    public void deleteProduct(int id) {
        productRepository.deleteById(id);
    }

    public List<Product> getProductByCategory(String category) {
        return productRepository.findByCategoryIgnoreCase(category);
    }

    public void updateQuantity(int id, int quantity) {
        Product product = productRepository.findById(id).orElse(new Product(-1));
        if (product.getId() != -1) {
            product.setStockQuantity(product.getStockQuantity() - quantity);
            productRepository.save(product);
        }
    }

    public void updateProductWithImage(Product product, MultipartFile image) throws IOException {
        product.setImageData(image.getBytes());
        product.setImageType(image.getContentType());
        product.setImageName(image.getOriginalFilename());
        productRepository.save(product);
    }

    public void updateProductWithoutImage(Product product) {
        productRepository.save(product);
    }
}
