# syntax=docker/dockerfile:1

############################
# Stage 1 — Build
############################
FROM maven:3.9.8-eclipse-temurin-21 AS builder

WORKDIR /app

# Copy root pom trước để Maven nhận biết multi-module
COPY pom.xml .

# Copy pom của shared-library và warehouse-service
COPY shared-library/pom.xml ./shared-library/pom.xml
COPY warehouse-service/pom.xml ./warehouse-service/pom.xml

# Copy source shared-library và install vào local .m2
COPY shared-library/src ./shared-library/src
RUN mvn -B install -pl shared-library -am -DskipTests

# Cache dependencies warehouse-service
RUN mvn -B dependency:go-offline -pl warehouse-service

# Build warehouse-service
COPY warehouse-service/src ./warehouse-service/src
RUN mvn -B package -pl warehouse-service -DskipTests

############################
# Stage 2 — Runtime
############################
FROM eclipse-temurin:21-jre-alpine

RUN apk add --no-cache curl
RUN addgroup -S spring && adduser -S spring -G spring

WORKDIR /app

COPY --from=builder /app/warehouse-service/target/*.jar app.jar

RUN chown -R spring:spring /app
USER spring

EXPOSE 8082

HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8082/actuator/health || exit 1

ENV JAVA_OPTS="-XX:MaxRAMPercentage=75"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
