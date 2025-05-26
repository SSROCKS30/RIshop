package com.ssrocks.rishop_backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.ssrocks.rishop_backend.model.Product;
import com.ssrocks.rishop_backend.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
public class ProductService {

    private static final Logger logger = LoggerFactory.getLogger(ProductService.class);

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private Cloudinary cloudinary;

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
    public Product addProduct(Product product, MultipartFile imageFile) throws IOException {
        if (imageFile != null && !imageFile.isEmpty()) {
            try {
                Map uploadResult = cloudinary.uploader().upload(imageFile.getBytes(), ObjectUtils.emptyMap());
                product.setImageUrl((String) uploadResult.get("secure_url"));
                product.setPublicId((String) uploadResult.get("public_id"));
            } catch (IOException e) {
                logger.error("Cloudinary upload failed for new product: {}", product.getName(), e);
                throw new RuntimeException("Could not upload image to Cloudinary: " + e.getMessage(), e);
            }
        } else {
            product.setImageUrl(null);
            product.setPublicId(null);
        }
        return productRepository.save(product);
    }

    @Transactional
    public void deleteProduct(int id) {
        Product product = productRepository.findById(id).orElse(null);
        if (product != null && product.getPublicId() != null) {
            try {
                cloudinary.uploader().destroy(product.getPublicId(), ObjectUtils.emptyMap());
                logger.info("Successfully deleted image from Cloudinary with public_id: {}", product.getPublicId());
            } catch (IOException e) {
                logger.error("Failed to delete image from Cloudinary with public_id: {}. Error: {}", product.getPublicId(), e.getMessage());
            }
        }
        productRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<Product> getProductByCategory(String category) {
        return productRepository.findByCategoryIgnoreCase(category);
    }

    @Transactional
    public void updateQuantity(int id, int quantity) {
        Product product = productRepository.findById(id).orElse(null);
        if (product != null) {
            product.setStockQuantity(product.getStockQuantity() - quantity);
            productRepository.save(product);
        } else {
            logger.warn("Product not found for quantity update: {}", id);
        }
    }

    @Transactional
    public void updateProductWithImage(Product productDetailsToUpdate, MultipartFile imageFile) throws IOException {
        Product existingProduct = productRepository.findById(productDetailsToUpdate.getId()).orElse(null);
        if (existingProduct == null) {
            logger.error("Product not found for update: {}", productDetailsToUpdate.getId());
            throw new RuntimeException("Product not found with id: " + productDetailsToUpdate.getId());
        }

        existingProduct.setName(productDetailsToUpdate.getName());
        existingProduct.setDescription(productDetailsToUpdate.getDescription());
        existingProduct.setBrand(productDetailsToUpdate.getBrand());
        existingProduct.setCategory(productDetailsToUpdate.getCategory());
        existingProduct.setPrice(productDetailsToUpdate.getPrice());
        existingProduct.setReleaseDate(productDetailsToUpdate.getReleaseDate());
        existingProduct.setProductAvailable(productDetailsToUpdate.isProductAvailable());
        existingProduct.setStockQuantity(productDetailsToUpdate.getStockQuantity());

        if (imageFile != null && !imageFile.isEmpty()) {
            if (existingProduct.getPublicId() != null) {
                try {
                    cloudinary.uploader().destroy(existingProduct.getPublicId(), ObjectUtils.emptyMap());
                    logger.info("Successfully deleted old image from Cloudinary with public_id: {}", existingProduct.getPublicId());
                } catch (IOException e) {
                    logger.error("Failed to delete old image from Cloudinary with public_id: {}. Error: {}", existingProduct.getPublicId(), e.getMessage());
                }
            }
            try {
                Map uploadResult = cloudinary.uploader().upload(imageFile.getBytes(), ObjectUtils.emptyMap());
                existingProduct.setImageUrl((String) uploadResult.get("secure_url"));
                existingProduct.setPublicId((String) uploadResult.get("public_id"));
            } catch (IOException e) {
                logger.error("Cloudinary upload failed for product update: {}", existingProduct.getId(), e);
                throw new RuntimeException("Could not upload new image to Cloudinary: " + e.getMessage(), e);
            }
        }
        productRepository.save(existingProduct);
    }

    @Transactional
    public void updateProductWithoutImage(Product productDetailsToUpdate) {
        Product existingProduct = productRepository.findById(productDetailsToUpdate.getId()).orElse(null);
        if (existingProduct != null) {
            productDetailsToUpdate.setImageUrl(existingProduct.getImageUrl());
            productDetailsToUpdate.setPublicId(existingProduct.getPublicId());

            existingProduct.setName(productDetailsToUpdate.getName());
            existingProduct.setDescription(productDetailsToUpdate.getDescription());
            existingProduct.setBrand(productDetailsToUpdate.getBrand());
            existingProduct.setCategory(productDetailsToUpdate.getCategory());
            existingProduct.setPrice(productDetailsToUpdate.getPrice());
            existingProduct.setReleaseDate(productDetailsToUpdate.getReleaseDate());
            existingProduct.setProductAvailable(productDetailsToUpdate.isProductAvailable());
            existingProduct.setStockQuantity(productDetailsToUpdate.getStockQuantity());

            productRepository.save(existingProduct);
        } else {
            logger.warn("Product not found for updateWithoutImage: {}", productDetailsToUpdate.getId());
            throw new RuntimeException("Product not found with id: " + productDetailsToUpdate.getId());
        }
    }
}
