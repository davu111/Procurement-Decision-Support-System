package com.ecotel.camera_service.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
public class AsyncConfig implements AsyncConfigurer {

    @Override
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10); // so luong
        executor.setMaxPoolSize(100); // so luong toi da
        executor.setQueueCapacity(500); // suc chua hang doi
        executor.setThreadNamePrefix("camera-async-");
        executor.initialize();
        return executor;
    }
}