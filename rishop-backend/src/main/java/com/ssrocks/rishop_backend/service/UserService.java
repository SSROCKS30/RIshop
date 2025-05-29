package com.ssrocks.rishop_backend.service;

import com.ssrocks.rishop_backend.model.User;
import com.ssrocks.rishop_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);

    public void saveUser(User user) {
        user.setPassword(encoder.encode(user.getPassword()));
        userRepository.save(user);
    }

    /**
     * Find user by username
     * @param username - The username to search for
     * @return User object if found, null otherwise
     */
    public User findByUsername(String username) {
        return userRepository.findByUsername(username);
    }
}
