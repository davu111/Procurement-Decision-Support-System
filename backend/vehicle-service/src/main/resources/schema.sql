-- Tạo database nếu chưa có
CREATE DATABASE IF NOT EXISTS vehicle_service CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE vehicle_service;
-- Tạo bảng VEHICLE_TYPE trước (vì VEHICLE có FK tới VEHICLE_TYPE)
CREATE TABLE vehicle_type (
    id VARCHAR(45) PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Tạo bảng VEHICLE
CREATE TABLE vehicle (
    id VARCHAR(45) PRIMARY KEY,
    vehicle_name VARCHAR(100) NOT NULL,
    license_plate VARCHAR(20) NOT NULL UNIQUE COMMENT 'Biển số xe',
    vehicle_type_id VARCHAR(45) NOT NULL,
    current_state ENUM(
        'S0',
        'S1',
        'S2',
        'S3',
        'S4',
        'S5',
        'S6',
        'S7',
        'S8',
        'S9'
    ) DEFAULT 'S0' COMMENT 'Trạng thái xe S0-S9',
    current_plan_id VARCHAR(45) COMMENT 'Kế hoạch hiện tại',
    current_location VARCHAR(100),
    site_id VARCHAR(45),
    in_warehouse_flag BOOLEAN DEFAULT FALSE COMMENT 'Xe trong/ngoài kho',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehicle_type FOREIGN KEY (vehicle_type_id) REFERENCES vehicle_type(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_license_plate (license_plate),
    INDEX idx_vehicle_type_id (vehicle_type_id),
    INDEX idx_current_state (current_state),
    INDEX idx_in_warehouse_flag (in_warehouse_flag)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Tạo bảng VEHICLE_STATE_HISTORY (Lịch sử trạng thái xe)
CREATE TABLE vehicle_state_history (
    id VARCHAR(45) PRIMARY KEY,
    vehicle_id VARCHAR(45) NOT NULL COMMENT 'ID phương tiện (trong cùng vehicle-service)',
    state_code ENUM(
        'S0',
        'S1',
        'S2',
        'S3',
        'S4',
        'S5',
        'S6',
        'S7',
        'S8',
        'S9'
    ) NOT NULL COMMENT 'Mã trạng thái xe',
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm chuyển trạng thái',
    warehouse_id VARCHAR(45) COMMENT 'ID kho (từ warehouse-service) nếu có',
    note TEXT COMMENT 'Ghi chú về trạng thái',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- FK trong cùng service
    CONSTRAINT fk_history_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicle(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_vehicle_id (vehicle_id),
    INDEX idx_state_code (state_code),
    INDEX idx_timestamp (timestamp),
    INDEX idx_warehouse_id (warehouse_id),
    INDEX idx_vehicle_timestamp (vehicle_id, timestamp DESC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Lịch sử trạng thái phương tiện - Vehicle Service';
-- Tạo bảng DRIVER
CREATE TABLE driver (
    id VARCHAR(45) PRIMARY KEY,
    name VARCHAR (50),
    image VARCHAR(100)
);