-- Tạo database nếu chưa có
CREATE DATABASE IF NOT EXISTS employee_service CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE employee_service;
-- Roles are managed in Keycloak; no role table in DB
CREATE TABLE IF NOT EXISTS position (
    id VARCHAR(45) PRIMARY KEY,
    position_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS department (
    id VARCHAR(45) PRIMARY KEY,
    department_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS employee (
    id VARCHAR(45) PRIMARY KEY,
    id_card VARCHAR(25) NOT NULL UNIQUE,
    first_name VARCHAR(20) NOT NULL,
    last_name VARCHAR(20) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    -- role_id removed; roles managed in Keycloak
    position_id VARCHAR(45),
    department_id VARCHAR(45),
    site_id VARCHAR(45) NOT NULL,
    keycloak_user_id VARCHAR(50) NOT NULL UNIQUE,
    ppe_compliant_flag BOOLEAN DEFAULT FALSE,
    in_warehouse_flag BOOLEAN DEFAULT TRUE,
    status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- ========== FOREIGN KEY ==========
    CONSTRAINT fk_employee_position FOREIGN KEY (position_id) REFERENCES `position`(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_employee_department FOREIGN KEY (department_id) REFERENCES department(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    -- ========== INDEX ==========
    INDEX idx_username (username),
    INDEX idx_position_id (position_id),
    INDEX idx_department_id (department_id),
    INDEX idx_status (status)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;