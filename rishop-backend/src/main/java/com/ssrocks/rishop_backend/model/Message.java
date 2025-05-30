package com.ssrocks.rishop_backend.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "messages")
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne
    @JoinColumn(name = "conversation_id", referencedColumnName = "id")
    @JsonBackReference
    private Conversation conversation;

    @ManyToOne
    @JoinColumn(name = "sender_id", referencedColumnName = "id")
    private User sender;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", nullable = false)
    private MessageType messageType = MessageType.TEXT;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "sent_at", nullable = false, updatable = false)
    private Date sentAt;

    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;

    @PrePersist
    protected void onPrePersist() {
        if (this.sentAt == null) {
            this.sentAt = new Date();
        }
    }

    // Helper method to check if message belongs to a user
    public boolean belongsToUser(User user) {
        return sender != null && sender.getId() == user.getId();
    }
} 