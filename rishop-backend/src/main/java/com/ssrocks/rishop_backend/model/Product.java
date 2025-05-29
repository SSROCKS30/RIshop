package com.ssrocks.rishop_backend.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Date;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;
    private String name;
    private String description;
    private String brand;
    private String category;
    private BigDecimal price;
    @JsonFormat(pattern = "dd-MM-yyyy")
    private Date releaseDate;
    private boolean productAvailable;
    private int stockQuantity;
    private String imageUrl;
    private String publicId;

    @ManyToOne
    @JoinColumn(name = "uploaded_by", referencedColumnName = "id")
    private User uploadedBy;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at", nullable = false, updatable = false)
    private Date createdAt;

    public Product(int id){
        this.id = id;
    }

    @PrePersist
    protected void onPrePersist() {
        if (this.createdAt == null) {
            this.createdAt = new Date(); 
        }
        // Removed the automatic setting of uploadedBy to user ID 1
        // This should be set explicitly in the controller based on authenticated user
    }
}
