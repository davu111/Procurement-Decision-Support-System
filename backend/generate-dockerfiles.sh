#!/bin/bash

# Script to generate Dockerfile and .dockerignore for all microservices
# Run: chmod +x generate-dockerfiles.sh && ./generate-dockerfiles.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 Generating Dockerfiles for all microservices..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# List of all services
SERVICES=(
    "api-gateway-viet-bac"
    "employee-service"
    "product-service"
    "warehouse-service"
    "vehicle-service"
    "plan-service"
    "transaction-service"
    "warehouse-site-service"
)

# Dockerfile content
read -r -d '' DOCKERFILE_CONTENT << 'EOF' || true
# Multi-stage Dockerfile for Spring Boot Microservices
# Stage 1: Build
FROM maven:3.9.6-eclipse-temurin-21 AS builder

# Set working directory
WORKDIR /app

# Copy pom.xml first for better caching
COPY pom.xml .

# Download dependencies (cached if pom.xml hasn't changed)
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application (skip tests for faster build)
RUN mvn clean package -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring

# Set working directory
WORKDIR /app

# Copy jar from builder stage
COPY --from=builder /app/target/*.jar app.jar

# Change ownership to spring user
RUN chown -R spring:spring /app

# Switch to non-root user
USER spring

# Expose port (will be overridden by Render)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# JVM options for container environment
ENV JAVA_OPTS="-Xmx512m -Xms256m -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

# Run the application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
EOF

# .dockerignore content
read -r -d '' DOCKERIGNORE_CONTENT << 'EOF' || true
# Maven
target/
!.mvn/wrapper/maven-wrapper.jar
!**/src/main/**/target/
!**/src/test/**/target/
pom.xml.tag
pom.xml.releaseBackup
pom.xml.versionsBackup
pom.xml.next
release.properties
dependency-reduced-pom.xml
buildNumber.properties
.mvn/timing.properties

# IDE
.idea/
*.iws
*.iml
*.ipr
.vscode/
*.swp
*.swo
*~
.DS_Store

# Logs
*.log
logs/

# Git
.git/
.gitignore
.gitattributes

# Documentation
README.md
*.md
docs/

# Docker
docker-compose.yml

# Environment
.env
.env.*
*.env

# Temporary files
*.tmp
*.bak
*.swp
*~.nib

# OS
.DS_Store
Thumbs.db
EOF

# Counter for created files
CREATED=0
SKIPPED=0

# Generate Dockerfile for each service
for service in "${SERVICES[@]}"; do
    echo ""
    echo "📦 Processing: $service"
    
    # Check if service directory exists
    if [ ! -d "$service" ]; then
        echo -e "${RED}   ✗ Directory not found: $service${NC}"
        continue
    fi
    
   # Dockerfile
if [ -f "$service/Dockerfile" ]; then
    echo -e "${YELLOW}   ↻ Overwriting existing Dockerfile${NC}"
else
    echo -e "${GREEN}   + Creating new Dockerfile${NC}"
fi
echo "$DOCKERFILE_CONTENT" > "$service/Dockerfile"
CREATED=$((CREATED+1))

# .dockerignore
if [ -f "$service/.dockerignore" ]; then
    echo -e "${YELLOW}   ↻ Overwriting existing .dockerignore${NC}"
else
    echo -e "${GREEN}   + Creating new .dockerignore${NC}"
fi
echo "$DOCKERIGNORE_CONTENT" > "$service/.dockerignore"

done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Done!${NC}"
echo "   Created: $CREATED Dockerfiles"
echo "   Skipped: $SKIPPED Dockerfiles (already exist)"
echo ""
echo "📝 Next steps:"
echo "   1. Review generated Dockerfiles"
echo "   2. Test build locally: docker build -t service-name ./service-name"
echo "   3. Commit and push to Git"
echo "   4. Deploy to Render"
echo ""