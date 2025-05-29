package com.ssrocks.rishop_backend.repository;

import com.ssrocks.rishop_backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    /**
     * Find user by username
     * @param username - The username to search for
     * @return User object if found, null otherwise
     */
    User findByUsername(String username);
    User findByEmail(String email);
}