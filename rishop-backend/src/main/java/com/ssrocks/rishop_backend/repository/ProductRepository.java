package com.ssrocks.rishop_backend.repository;

import com.ssrocks.rishop_backend.model.Product;
import com.ssrocks.rishop_backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Integer> {

    List<Product> findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrBrandContainingIgnoreCase(
            String keyword, String keyword1, String keyword2);

    List<Product> findByCategoryIgnoreCase(String category);

    /**
     * Find all products uploaded by a specific user
     * @param user - The user who uploaded the products
     * @return List of products uploaded by the user
     */
    List<Product> findByUploadedBy(User user);
}
