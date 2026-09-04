# 📦 Inventory Optimization & Warehouse Management System

> A warehouse management and inventory optimization system based on mathematical models (EOQ, Safety Stock, Reorder Point) combined with multi-algorithm demand forecasting.

---

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Key Features](#key-features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Services & Ports](#services--ports)
- [API Endpoints](#api-endpoints)
- [Authorization](#authorization)
- [Documentation](#documentation)

---

## Overview

The system is built with a **microservices** architecture to achieve:

- **Inventory Management**: Track products, warehouses, suppliers, and inbound/outbound transactions.
- **Stock Optimization**: Calculate EOQ, safety stock, and automatic reorder points.
- **Demand Forecasting**: Multiple strategies (Holt-Winters, Seasonal Regression, Weighted Moving Average) with automatic model selection based on historical data availability.
- **Analytics & Dashboard**: Real-time supply status, ABC classification, loss rate analysis, service level metrics.
- **Stocktaking**: Create stock count drafts with auto-calculated system quantities, variance reconciliation, and CSV/XLSX consumption data import.
- **Report Generation**: Generate Word documents following Vietnamese government standard forms (Circular 99) via LibreOffice.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React + Vite)                   │
│                        http://localhost:5173                      │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway (Spring Cloud Gateway)            │
│                       http://localhost:9000                       │
└────┬──────────┬──────────┬──────────┬──────────┬──────────┬─────┘
     │          │          │          │          │          │
     ▼          ▼          ▼          ▼          ▼          ▼
┌────────┐┌────────┐┌─────────┐┌──────────┐┌──────────┐┌──────────┐
│Employee││Product ││Warehouse││Transaction││ Supplier ││Inventory │
│Service ││Service ││ Service ││ Service   ││ Service  ││Optimizat.│
│ :8083  ││ :8084  ││ :8082   ││  :8085    ││  :8087   ││  :8091   │
└───┬────┘└───┬────┘└────┬────┘└─────┬────┘└─────┬────┘└─────┬────┘
    │         │         │           │           │           │
    ▼         ▼         ▼           ▼           ▼           ▼
┌───────┐┌───────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐
│emp_db ││prod_db││wh_db     ││trans_db  ││supp_db   ││opt_db    │
└───────┘└───────┘──────────┘──────────┘──────────┘──────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Infra: Keycloak (Auth) │ Redis (Cache) │ MinIO (Files)         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Backend

| Technology | Version | Description |
|------------|---------|-------------|
| Java | 21 | Primary language |
| Spring Boot | 3.5.x – 4.0.x | REST API framework |
| Spring Cloud Gateway | 2025.0.0 | API Gateway & routing |
| Spring Data JPA + Hibernate | — | ORM & database queries |
| MySQL | 8.0.36 | Database (one per service) |
| Redis | 7 (Alpine) | Caching |
| MinIO | — | Object storage (images, files) |
| Keycloak | 23.0.3 | OAuth2/OIDC authentication |
| MapStruct | 1.5.5.Final | Object mapping |
| Apache POI | — | XLSX file read/write |
| SpringDoc OpenAPI | — | Swagger UI at Gateway |
| LibreOffice (Docker) | — | Word document conversion |
| Maven | — | Build tool (multi-module) |

### Frontend

| Technology | Version | Description |
|------------|---------|-------------|
| React | 18.3.1 | UI framework |
| TypeScript | — | Primary language |
| Vite | 8.0.0 | Build tool & dev server |
| shadcn/ui + Radix UI | — | Component library |
| Tailwind CSS | 3.4.17 | Styling |
| TanStack React Query | 5.83.0 | Server state management |
| React Router DOM | 6.30.1 | Client-side routing |
| React Hook Form + Zod | — | Form handling & validation |
| Recharts | 2.15.4 | Charts |
| keycloak-js | 26.2.4 | Auth client (PKCE flow) |
| Axios | — | HTTP client |
| Vitest + Playwright | — | Testing |

### Infrastructure

| Technology | Description |
|------------|-------------|
| Docker + Docker Compose | Full system containerization |
| Bridge Network (`micro-net`) | Inter-container networking |
| Named Volumes | Persistent data for MySQL, Redis, MinIO |

---

## Key Features

### 🎯 Inventory Optimization
- **EOQ** (Economic Order Quantity) calculation with configurable parameters
- **Safety stock** calculation based on demand variability and lead time
- Automatic **reorder point** planning
- Plan creation, replanning, and change history tracking

### 📊 Demand Forecasting
- **Weighted Moving Average** — weighted historical averaging
- **Holt-Winters** — multiplicative seasonality model (requires ≥ 6 data points)
- **Seasonal Regression** — seasonal regression (requires ≥ 18 data points, highest accuracy)
- **Forecast Orchestrator** — automatically selects the best model based on available data

### 📈 Dashboard & Analytics
- **Supply Status**: Real-time CRITICAL / WARNING / OK alerts
- **ABC Classification**: Inventory turnover analysis
- **Warehouse Heatmap**: Inventory density visualization
- **Loss Rate**: Analysis from stocktaking data
- **Service Level**: Order fulfillment performance measurement
- **Sawtooth Chart**: Inventory levels over time

### 📋 Stocktaking
- Create draft stock counts with auto-calculated system quantities
- Confirm counts with actual quantities and automatic variance calculation
- Import consumption data from CSV/XLSX

### 🔄 Transaction Management
- Create / update / batch inbound and outbound transactions
- Generate Word reports using Circular 99 templates
- File upload/download via MinIO

### 👥 Master Data Management
- Products, Categories, Warehouses, Suppliers, Employees
- Full CRUD with activate/deactivate status management

---

## Project Structure

```
inventory-optimization/
├── backend/                              # Backend microservices
│   ├── pom.xml                           # Parent POM (Maven multi-module)
│   ├── .env                              # Docker Compose environment variables
│   ├── docker-compose.yml                # Orchestration (15 containers)
│   ├── api-gateway-viet-bac/             # Spring Cloud Gateway (port 9000)
│   ├── employee-service/                 # Employee management (port 8083)
│   ├── inventory-optimization-service/   # Inventory optimization engine (port 8091)
│   ├── product-service/                  # Product management (port 8084)
│   ├── supplier-service/                 # Supplier management (port 8087)
│   ├── transaction-service/              # Inbound/outbound transactions (port 8085)
│   ├── warehouse-service/                # Warehouse & inventory management (port 8082)
│   └── shared-library/                   # Shared DTOs, configs, security
│
├── opt-frontend/                         # Frontend SPA
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── src/
│       ├── api/                          # Axios API clients
│       ├── components/                   # UI components (shadcn/ui, charts)
│       ├── config/                       # Keycloak, role-based access
│       ├── context/                      # Auth context
│       ├── pages/                        # Page components
│       ├── types/                        # TypeScript types
│       └── utils/                        # Utility functions
│
├── Erd/                                  # Entity Relationship Diagrams
├── class-diagram/                        # UML Class Diagrams
├── sequence-diagram/                     # Sequence Diagrams (PlantUML)
└── document/                             # Business documents, CSV samples
```

---

## Getting Started

### Prerequisites

- **Docker** & **Docker Compose** (recommended for full stack)
- **Java 21** (if running backend services individually)
- **Node.js 18+** or **Bun** (for frontend)
- **Maven 3.9+** (if building backend manually)

### 1. Clone the repository

```bash
git clone <repository-url>
cd inventory-optimization
```

### 2. Start Backend (Docker Compose)

```bash
cd backend
docker-compose up -d
```

This starts **15 containers** including:
- 6 MySQL databases
- 6 Microservices
- 1 API Gateway
- 1 Keycloak (Auth server)
- 1 Redis
- 1 MinIO (file storage)
- 1 LibreOffice (document converter)

Wait for all containers to become healthy:

```bash
docker-compose ps
```

### 3. Configure Keycloak

After Keycloak starts (`http://localhost:8180`):

1. Log in to Admin Console with `admin` / `admin`
2. Create Realm: `optimization`
3. Create Client: `react-client` (Public, PKCE enabled)
4. Create 4 roles: `admin`, `warehouse-manager`, `planning-manager`, `admin-manager`
5. Create users and assign roles

### 4. Start Frontend

```bash
cd opt-frontend
npm install       # or: bun install
npm run dev       # http://localhost:5173
```

### 5. Production Build (optional)

```bash
# Frontend
cd opt-frontend
npm run build

# Backend — individual service
cd backend/inventory-optimization-service
mvn spring-boot:run
```

### 6. Build Shared Library (if running backend without Docker)

```bash
cd backend
mvn install -pl shared-library
```

---

## Services & Ports

| Service | Port | Description |
|---------|------|-------------|
| **Frontend** (Vite dev) | `5173` | React SPA |
| **API Gateway** | `9000` | Main gateway, Swagger UI |
| **Keycloak** | `8180` | Auth server |
| **Employee Service** | `8083` | Employee management |
| **Warehouse Service** | `8082` | Warehouse & inventory management |
| **Product Service** | `8084` | Product management |
| **Transaction Service** | `8085` | Inbound/outbound transactions |
| **Supplier Service** | `8087` | Supplier management |
| **Inventory Optimization** | `8091` | Optimization & forecasting engine |
| **MinIO API** | `8901` | Object storage API |
| **MinIO Console** | `8900` | MinIO Web UI |
| **Redis** | `6379` | Caching |

### Swagger API Docs

Access after the system is running:

```
http://localhost:9000/swagger-ui.html
```

---

## API Endpoints

All APIs are proxied through the Gateway at `http://localhost:9000/api/...`.

<details>
<summary><strong>📦 Products</strong></summary>

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/products/all` | List all products |
| GET | `/api/products` | Paginated product list |
| GET | `/api/products/{id}` | Get product details |
| POST | `/api/products` | Create product |
| PUT | `/api/products/{id}` | Update product |
| PATCH | `/api/products/deactivate/{id}` | Deactivate product |
| PATCH | `/api/products/activate/{id}` | Activate product |

</details>

<details>
<summary><strong>🏢 Warehouses</strong></summary>

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/warehouses` | List all warehouses |
| GET | `/api/warehouses/full-info` | Full warehouse info |
| POST | `/api/warehouses` | Create warehouse |
| PUT | `/api/warehouses` | Update warehouse |

</details>

<details>
<summary><strong>🔄 Transactions</strong></summary>

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/transactions` | List transactions |
| POST | `/api/transactions/create` | Create transaction |
| POST | `/api/transactions/generate` | Generate Word report |
| PUT | `/api/transactions/update/{id}` | Update transaction |

</details>

<details>
<summary><strong>🎯 Inventory Optimization</strong></summary>

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/inventory/calculate` | Create inventory plan |
| POST | `/api/inventory/replan` | Replan inventory |
| GET | `/api/inventory/predict-inventory/{productId}` | Predict inventory |
| GET | `/api/inventory/suggest/{productId}` | Get forecast suggestion |
| GET | `/api/inventory/schedule` | Order schedule |

</details>

<details>
<summary><strong>📊 Analytics & Dashboard</strong></summary>

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard/supply-status` | Supply status overview |
| GET | `/api/dashboard/inventory-velocity` | Inventory velocity analysis |
| GET | `/api/analytics/loss-rate/{productId}` | Loss rate analysis |
| GET | `/api/analytics/service-level/{productId}` | Service level analysis |

</details>

<details>
<summary><strong>👥 Employees & Suppliers</strong></summary>

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/employees` | List employees |
| POST | `/api/employees/create` | Create employee |
| GET | `/api/suppliers` | List suppliers |
| POST | `/api/suppliers` | Create supplier |

</details>

---

## Authorization

The system uses **Keycloak** with 4 roles:

| Role | Description | Access Level |
|------|-------------|--------------|
| `admin` | Administrator | Full access |
| `admin-manager` | Senior manager | Employee management, all modules |
| `planning-manager` | Planning manager | Inventory planning, forecasting, analytics |
| `warehouse-manager` | Warehouse manager | Warehouse, transactions, stocktaking |

---

## Documentation

Diagrams and documentation included in the repository:

- **`Erd/`** — Entity Relationship Diagrams per service
- **`class-diagram/`** — UML Class Diagrams
- **`sequence-diagram/`** — Sequence Diagrams (PlantUML)
- **`document/`** — Business documents, CSV data samples

---

## License

Private project — not for external distribution.
