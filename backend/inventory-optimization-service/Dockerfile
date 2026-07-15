# syntax=docker/dockerfile:1

############################
# Stage 1 — Build
############################
FROM maven:3.9.8-eclipse-temurin-21 AS builder

WORKDIR /app

# Copy root pom trước để Maven nhận biết multi-module
COPY pom.xml .

# Copy pom của shared-library và inventory-optimization-service
COPY shared-library/pom.xml ./shared-library/pom.xml
COPY inventory-optimization-service/pom.xml ./inventory-optimization-service/pom.xml

# Copy source shared-library và install vào local .m2
COPY shared-library/src ./shared-library/src
RUN mvn -B install -pl shared-library -am -DskipTests

# Cache dependencies inventory-optimization-service
RUN mvn -B dependency:go-offline -pl inventory-optimization-service

# Build inventory-optimization-service
COPY inventory-optimization-service/src ./inventory-optimization-service/src
RUN mvn -B package -pl inventory-optimization-service -DskipTests

############################
# Stage 2 — Runtime
############################
FROM eclipse-temurin:21-jre-alpine

RUN apk add --no-cache curl
RUN addgroup -S spring && adduser -S spring -G spring

WORKDIR /app

COPY --from=builder /app/inventory-optimization-service/target/*.jar app.jar

RUN chown -R spring:spring /app
USER spring

EXPOSE 8091

HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8091/actuator/health || exit 1

ENV JAVA_OPTS="-XX:MaxRAMPercentage=75"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
