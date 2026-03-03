package com.ecotel.camera_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    private final String[] PUBLIC_ENDPOINT = {
            "/actuator/**"
    };

    private static final String[] SWAGGER_WHITELIST = {
            "/camera-service/v3/api-docs/**",
            "/camera-service/swagger-ui/**",
    };

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
//                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(authorize -> authorize
                                .requestMatchers(SWAGGER_WHITELIST).permitAll()

                                .requestMatchers(PUBLIC_ENDPOINT).permitAll()
//                        .requestMatchers("/api/categories/**").hasRole("WAREHOUSE")
//                                .anyRequest().authenticated()
                                .anyRequest().permitAll() // test
                )
//                .oauth2ResourceServer(oauth2 -> oauth2
//                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
//                )
                .httpBasic(AbstractHttpConfigurer::disable) // Tat Login Swagger
                .formLogin(AbstractHttpConfigurer::disable)
                .build();
    }
}
