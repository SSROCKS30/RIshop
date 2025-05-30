package com.ssrocks.rishop_backend.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "conversations", 
       uniqueConstraints = @UniqueConstraint(
           name = "unique_conversation", 
           columnNames = {"buyer_id", "seller_id", "product_id"}
       ))
public class Conversation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne
    @JoinColumn(name = "buyer_id", referencedColumnName = "id")
    private User buyer;

    @ManyToOne
    @JoinColumn(name = "seller_id", referencedColumnName = "id")
    private User seller;

    @ManyToOne
    @JoinColumn(name = "product_id", referencedColumnName = "id")
    private Product product;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ConversationStatus status = ConversationStatus.ACTIVE;

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<Message> messages = new ArrayList<>();

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at", nullable = false, updatable = false)
    private Date createdAt;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "updated_at")
    private Date updatedAt;

    @PrePersist
    protected void onPrePersist() {
        if (this.createdAt == null) {
            this.createdAt = new Date();
        }
        this.updatedAt = new Date();
    }

    @PreUpdate
    protected void onPreUpdate() {
        this.updatedAt = new Date();
    }

    // Helper method to check if user is participant in conversation
    public boolean isParticipant(User user) {
        return (buyer != null && buyer.getId() == user.getId()) || 
               (seller != null && seller.getId() == user.getId());
    }

    // Helper method to get the other participant
    public User getOtherParticipant(User currentUser) {
        if (buyer != null && buyer.getId() == currentUser.getId()) {
            return seller;
        } else if (seller != null && seller.getId() == currentUser.getId()) {
            return buyer;
        }
        return null;
    }
} 