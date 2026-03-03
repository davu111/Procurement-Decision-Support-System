package com.ecotel.warehouse_site_service.model;

import com.ecotel.warehouse_site_service.enums.SiteStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "warehouse_site", indexes = {
        @Index(name = "idx_site_code", columnList = "site_code"),
        @Index(name = "idx_site_name", columnList = "site_name"),
        @Index(name = "idx_status", columnList = "status"),
        @Index(name = "idx_location", columnList = "location")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WarehouseSite {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", length = 45, nullable = false, updatable = false)
    String id;

    @Column(name = "site_code", nullable = false, unique = true, length = 20)
    String siteCode;

    @Column(name = "site_name", nullable = false, unique = true, length = 100)
    String siteName;

    @Column(name = "location", nullable = false, length = 255)
    String location;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    SiteStatus status = SiteStatus.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    LocalDateTime updatedAt;

    // Helper methods

    /**
     * Kiểm tra kho tổng có đang hoạt động không
     */
    public boolean isOperational() {
        return status == SiteStatus.ACTIVE;
    }

    /**
     * Kiểm tra kho tổng có đang tạm ngừng không
     */
    public boolean isInactive() {
        return status == SiteStatus.INACTIVE || status == SiteStatus.CLOSED;
    }

    /**
     * Kiểm tra kho tổng có đang xây dựng không
     */
    public boolean isUnderConstruction() {
        return status == SiteStatus.UNDER_CONSTRUCTION;
    }

    /**
     * Lấy mô tả trạng thái
     */
    public String getStatusDescription() {
        return switch (status) {
            case ACTIVE -> "Đang hoạt động";
            case INACTIVE -> "Tạm ngừng";
            case UNDER_CONSTRUCTION -> "Đang xây dựng";
            case CLOSED -> "Đã đóng cửa";
        };
    }

    /**
     * Kích hoạt kho tổng
     */
    public void activate() {
        if (status == SiteStatus.CLOSED) {
            throw new IllegalStateException("Không thể kích hoạt kho đã đóng cửa");
        }
        this.status = SiteStatus.ACTIVE;
    }

    /**
     * Tạm ngừng kho tổng
     */
    public void deactivate() {
        if (status == SiteStatus.CLOSED) {
            throw new IllegalStateException("Kho đã đóng cửa");
        }
        this.status = SiteStatus.INACTIVE;
    }

    /**
     * Đóng cửa kho tổng vĩnh viễn
     */
    public void close() {
        this.status = SiteStatus.CLOSED;
    }

    /**
     * Lấy mã vùng từ site_code (VD: HN từ HN-SITE-01)
     */
    public String getRegionCode() {
        if (siteCode != null && siteCode.contains("-")) {
            return siteCode.substring(0, siteCode.indexOf("-"));
        }
        return siteCode;
    }

    /**
     * Format địa chỉ ngắn gọn (lấy thành phố)
     */
    public String getShortLocation() {
        if (location == null) return "";

        // Tìm tên thành phố cuối cùng trong địa chỉ
        String[] parts = location.split(",");
        if (parts.length > 0) {
            return parts[parts.length - 1].trim();
        }
        return location;
    }
}
