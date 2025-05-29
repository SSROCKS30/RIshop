package com.ssrocks.rishop_backend.service;

import com.ssrocks.rishop_backend.model.User;
import com.ssrocks.rishop_backend.model.UserPrincipal;
import com.ssrocks.rishop_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class MyUserDetailsService implements UserDetailsService {
    @Autowired
    private UserRepository userRepo;

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        User user = userRepo.findByUsername(identifier);
        if (user == null) {
            // If not found by username, try by email
            user = userRepo.findByEmail(identifier);
        }
        
        if (user == null) {
            throw new UsernameNotFoundException("User not found with identifier: " + identifier);
        }
        return new UserPrincipal(user);
    }
}
