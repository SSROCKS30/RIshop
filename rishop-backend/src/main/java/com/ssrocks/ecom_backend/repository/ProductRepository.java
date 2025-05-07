package com.ssrocks.ecom_backend.repository;

import com.ssrocks.ecom_backend.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Integer> {

    List<Product> findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrBrandContainingIgnoreCase(
            String keyword, String keyword1, String keyword2);

    List<Product> findByCategoryIgnoreCase(String category);
}
