package com.ecotel.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;


@Configuration
@EnableWebFluxSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private static final String[] PUBLIC_ENDPOINTS = {
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/swagger-resources/**",
            "/webjars/**",
            "/*/v3/api-docs/**",      // ** match mọi service
            "/*/swagger-ui/**",
            "/*/swagger-ui.html",
            "/*/swagger-resources/**",
            "/*/webjars/**",
            "/actuator/**"
    };

    @Value("${frontend.url}")
    private String frontendUrl;

    /**
     * CORS configuration for WebFlux
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration corsConfiguration = new CorsConfiguration();

        corsConfiguration.addAllowedOriginPattern(frontendUrl);
        corsConfiguration.addAllowedOriginPattern("http://localhost:9000");
        corsConfiguration.addAllowedOriginPattern("http://localhost:63342");
        corsConfiguration.addAllowedMethod("*");
        corsConfiguration.addAllowedHeader("*");
        corsConfiguration.addExposedHeader("*");
        corsConfiguration.setAllowCredentials(true);
        corsConfiguration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfiguration);

        return source;
    }

    /**
     * Security configuration for WebFlux
     */
    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {

        return http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(exchanges -> exchanges
                        .pathMatchers(PUBLIC_ENDPOINTS).permitAll()
//                        .anyExchange().authenticated()
                                .anyExchange().permitAll() // CHO PHÉP TEST API
                )
                .httpBasic(ServerHttpSecurity.HttpBasicSpec::disable)
                .formLogin(ServerHttpSecurity.FormLoginSpec::disable)
                // Nếu dùng OAuth2 Resource Server (JWT)
                // .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
                .build();
    }

//    @Bean
//    public JwtAuthenticationConverter jwtAuthenticationConverter() {
//        JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
//
//        // Lấy roles từ realm_access.roles
//        grantedAuthoritiesConverter.setAuthoritiesClaimName("realm_access.roles");
//        grantedAuthoritiesConverter.setAuthorityPrefix("ROLE_");
//
//        JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
//        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter);
//
//        return jwtAuthenticationConverter;
//    }
//    // Trong API Gateway hoặc Product Service
//    @Component
//    public class LoggingFilter implements Filter {
//        @Override
//        public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
//                throws IOException, ServletException {
//            HttpServletRequest req = (HttpServletRequest) request;
//            System.out.println("=== REQUEST ===");
//            System.out.println("URI: " + req.getRequestURI());
//            System.out.println("Method: " + req.getMethod());
//            System.out.println("Authorization: " + req.getHeader("Authorization"));
//
//            chain.doFilter(request, response);
//        }
//    }
}
