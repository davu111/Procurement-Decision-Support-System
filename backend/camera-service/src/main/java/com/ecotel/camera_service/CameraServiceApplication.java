package com.ecotel.camera_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class CameraServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(CameraServiceApplication.class, args);
	}

}
