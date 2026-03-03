#!/bin/bash

# Script to test Docker build for all services
# Run: chmod +x test-docker-build.sh && ./test-docker-build.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Services to build
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

echo -e "${BLUE}🐳 Testing Docker builds for all microservices...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

SUCCESS=0
FAILED=0
TOTAL=${#SERVICES[@]}

# Function to build a service
build_service() {
    local service=$1
    local image_name="warehouse-${service}:test"
    
    echo -e "${YELLOW}Building: $service${NC}"
    echo "Image: $image_name"
    echo "Context: ./$service"
    echo ""
    
    if [ ! -d "$service" ]; then
        echo -e "${RED}✗ Directory not found: $service${NC}"
        return 1
    fi
    
    if [ ! -f "$service/Dockerfile" ]; then
        echo -e "${RED}✗ Dockerfile not found in $service${NC}"
        return 1
    fi
    
    # Build with progress output
    if docker build -t "$image_name" "./$service" --progress=plain; then
        echo -e "${GREEN}✓ Build successful: $service${NC}"
        
        # Get image size
        local size=$(docker images "$image_name" --format "{{.Size}}")
        echo -e "   Image size: ${GREEN}$size${NC}"
        
        return 0
    else
        echo -e "${RED}✗ Build failed: $service${NC}"
        return 1
    fi
}

# Build each service
for service in "${SERVICES[@]}"; do
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if build_service "$service"; then
        SUCCESS=$((SUCCESS+1))
    else
        FAILED=$((FAILED+1))
    fi
    
    echo ""
done

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📊 Build Summary${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total services: $TOTAL"
echo -e "${GREEN}Successful: $SUCCESS${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All builds successful!${NC}"
    echo ""
    echo "📋 Built images:"
    docker images | grep "warehouse-" | grep "test"
    echo ""
    echo "🧪 Test running a container:"
    echo "   docker run -p 8083:8083 -e SPRING_PROFILES_ACTIVE=dev warehouse-employee-service:test"
    echo ""
    echo "🧹 Clean up test images:"
    echo "   docker rmi \$(docker images -q 'warehouse-*:test')"
    exit 0
else
    echo -e "${RED}❌ Some builds failed. Check the logs above.${NC}"
    exit 1
fi