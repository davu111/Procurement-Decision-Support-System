package com.ecotel.supplier_service.config;

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

    };

    private static final String[] SWAGGER_WHITELIST = {
            "/supplier-service/v3/api-docs/**",
            "/supplier-service/swagger-ui/**",
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


//    @Bean
//    public JwtAuthenticationConverter jwtAuthenticationConverter() {
//        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
//
//        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
//            Map<String, Object> realmAccess = jwt.getClaim("realm_access");
//
//            if (realmAccess == null || realmAccess.get("roles") == null) {
//                return Collections.emptyList();
//            }
//
//            Collection<String> roles = (Collection<String>) realmAccess.get("roles");
//
//            return roles.stream()
//                    .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
//                    .collect(Collectors.toList());
//        });
//
//        return converter;
//    }
}
