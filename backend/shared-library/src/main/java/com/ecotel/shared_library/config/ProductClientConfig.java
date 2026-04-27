package com.ecotel.shared_library.config;

import com.ecotel.shared_library.service.ProductService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
@ConditionalOnProperty(name = "external.product-service.url")
public class ProductClientConfig {

    @Bean
    public ProductService productService(WebClient.Builder builder,
                                         @Value("${external.product-service.url}") String url) {
        WebClient webClient = builder.baseUrl(url).build();
        return new ProductService(webClient, url);
    }
}
