package com.ecotel.shared_library.config;

import com.ecotel.shared_library.service.TokenService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Bean
    @ConditionalOnMissingBean
    public WebClient.Builder webClientBuilder(TokenService tokenService) {
        return WebClient.builder()
                .filter((request, next) -> {
                    String token = tokenService.getToken();

                    ClientRequest newRequest = ClientRequest.from(request)
                            .headers(headers -> {
                                if (token != null) {
                                    headers.setBearerAuth(token);
                                }
                            })
                            .build();

                    return next.exchange(newRequest);
                });
    }
}
