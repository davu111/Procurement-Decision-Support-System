package com.ecotel.transaction_service.config;

import com.ecotel.transaction_service.service.LibreOfficeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Runs once after the application context is fully started.
 * Warms up LibreOffice inside the doc_converter container so that
 * the first call to POST /api/transactions/generate does not suffer
 * from cold-start latency (LibreOffice initialising its JVM, font
 * cache, profile, etc. for the first time).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LibreOfficeWarmupRunner implements ApplicationRunner {

    private final LibreOfficeService libreOfficeService;

    @Override
    public void run(ApplicationArguments args) {
        log.info("[Startup] Triggering LibreOffice warm-up in background...");
        // Run in a daemon thread so it does not delay the HTTP server from
        // becoming ready, while still finishing before typical first user request.
        Thread warmupThread = new Thread(() -> {
            libreOfficeService.warmup();
            log.info("[Startup] LibreOffice warm-up thread finished.");
        }, "libreoffice-warmup");
        warmupThread.setDaemon(true);
        warmupThread.start();
    }
}
