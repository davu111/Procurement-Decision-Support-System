package com.ecotel.inventory_optimization_service.config;

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
                        .title("Inventory Optimization Service API")
                        .version("1.0")
                        .description("Inventory Optimization management microservice"))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:9000")
                                .description("Via API Gateway"),
                        new Server()
                                .url("http://localhost:8091")
                                .description("Direct to Service")
                ));
    }
}
