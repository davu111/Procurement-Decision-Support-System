package com.ecotel.transaction_service.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.util.stream.Collectors;

import static reactor.netty.http.HttpConnectionLiveness.log;

@Service
@Slf4j
public class LibreOfficeService {

    private static final String TMP_DIR = "./tmp";
    private static final String CONTAINER_TMP_DIR = "/tmp";
    private static final String CONTAINER_NAME = "doc_converter";

    public byte[] convertToPdf(ByteArrayOutputStream docxStream) throws Exception {

        Path tmpDirPath = Paths.get(TMP_DIR);
        if (!Files.exists(tmpDirPath)) {
            Files.createDirectories(tmpDirPath);
        }

        String fileId = UUID.randomUUID().toString();

        String inputFileName = "input_" + fileId + ".docx";
        String outputFileName = "input_" + fileId + ".pdf";

        Path inputPath = tmpDirPath.resolve(inputFileName);
        Path outputPath = tmpDirPath.resolve(outputFileName);

        try {
            // 1. Ghi file DOCX local
            Files.write(inputPath, docxStream.toByteArray());
            log.info("DOCX written to: {}", inputPath);

            // 2. Copy file vào container
            execAndCheck(new ProcessBuilder(
                    "docker", "cp",
                    inputPath.toString(),
                    CONTAINER_NAME + ":" + CONTAINER_TMP_DIR + "/" + inputFileName
            ), "Copy DOCX to container failed");

            // 3. Convert trong container
            String command = String.format(
                    "soffice --headless --convert-to pdf --outdir %s %s/%s",
                    CONTAINER_TMP_DIR,
                    CONTAINER_TMP_DIR,
                    inputFileName
            );

            execAndCheck(new ProcessBuilder(
                    "docker", "exec", CONTAINER_NAME,
                    "bash", "-c", command
            ), "LibreOffice convert failed");

            // 4. Copy PDF về host
            execAndCheck(new ProcessBuilder(
                    "docker", "cp",
                    CONTAINER_NAME + ":" + CONTAINER_TMP_DIR + "/" + outputFileName,
                    outputPath.toString()
            ), "Copy PDF from container failed");

            // 5. Verify file tồn tại
            if (!Files.exists(outputPath)) {
                throw new RuntimeException("PDF file not found: " + outputPath);
            }

            // 6. Đọc PDF
            byte[] pdfBytes = Files.readAllBytes(outputPath);
            log.info("PDF generated: {} ({} bytes)", outputPath, pdfBytes.length);

            return pdfBytes;

        } finally {
            // 7. Cleanup local
            try {
                Files.deleteIfExists(inputPath);
                Files.deleteIfExists(outputPath);
            } catch (Exception e) {
                log.warn("Local cleanup failed: {}", e.getMessage());
            }

            // 8. Cleanup container
            try {
                execSilent(new ProcessBuilder(
                        "docker", "exec", CONTAINER_NAME,
                        "rm", "-f",
                        CONTAINER_TMP_DIR + "/" + inputFileName,
                        CONTAINER_TMP_DIR + "/" + outputFileName
                ));
            } catch (Exception e) {
                log.warn("Container cleanup failed: {}", e.getMessage());
            }
        }
    }

    // Helper: chạy command + check exit code + log output
    private void execAndCheck(ProcessBuilder pb, String errorMessage) throws Exception {
        pb.redirectErrorStream(true);

        Process process = pb.start();

        String logs;
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream()))) {
            logs = reader.lines().collect(Collectors.joining("\n"));
        }

        int exitCode = process.waitFor();

        log.info("Command: {}", String.join(" ", pb.command()));
        log.info("ExitCode: {}", exitCode);
        log.info("Logs:\n{}", logs);

        if (exitCode != 0) {
            throw new RuntimeException(errorMessage + "\nLogs:\n" + logs);
        }
    }

    // Helper: chạy command nhưng không throw (dùng cleanup)
    private void execSilent(ProcessBuilder pb) {
        try {
            pb.start().waitFor();
        } catch (Exception ignored) {
        }
    }
}
