package com.ecotel.shared_library.service;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
public class TokenService {
    public String getToken(){
        // 🔸 Lấy token từ SecurityContext
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        String tokenValue;

        if (authentication instanceof JwtAuthenticationToken jwtAuth) {
            tokenValue = jwtAuth.getToken().getTokenValue();
        } else {
            tokenValue = null;
        }
        return tokenValue;
    }
}
