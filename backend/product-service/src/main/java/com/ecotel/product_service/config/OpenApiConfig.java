package com.ecotel.product_service.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Product Service API")
                        .version("1.0")
                        .description("Product management microservice"))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:9000")
                                .description("Via API Gateway"),
                        new Server()
                                .url("http://localhost:8084")
                                .description("Direct to Service"),
                        new Server()
                                .url("https://api-gateway-viet-bac.onrender.com/plan-service")
                                .description("API Gateway")
                ));
    }
}
