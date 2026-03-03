package com.ecotel.camera_service.controller;

import com.ecotel.camera_service.enums.NotificationType;
import com.ecotel.camera_service.model.WebSocketMessage;
import com.ecotel.camera_service.service.WebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.annotation.SubscribeMapping;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;

@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketController {

    private final WebSocketService webSocketService;

    /**
     * Client subscribe to this to confirm connection
     */
    @SubscribeMapping("/status")
    public WebSocketMessage getStatus() {
        log.info("Client subscribed to status");
        WebSocketMessage message = new WebSocketMessage();
        message.setType(NotificationType.SYSTEM_ALERT);
        message.setMessage("Connected to Camera Service WebSocket");
        message.setTimestamp(LocalDateTime.now());
        return message;
    }

    /**
     * Example: Client can send ping
     */
    @MessageMapping("/ping")
    @SendTo("/topic/pong")
    public WebSocketMessage ping(WebSocketMessage message) {
        log.info("Received ping from client");
        message.setMessage("pong");
        message.setTimestamp(LocalDateTime.now());
        return message;
    }
}
