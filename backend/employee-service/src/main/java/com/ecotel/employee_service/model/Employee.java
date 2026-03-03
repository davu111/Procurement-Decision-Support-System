package com.ecotel.employee_service.model;

import com.ecotel.employee_service.enums.EmployeeStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "employee", indexes = {
        @Index(name = "idx_username", columnList = "username"),
        @Index(name = "idx_role_id", columnList = "role_id"),
        @Index(name = "idx_department", columnList = "department"),
        @Index(name = "idx_status", columnList = "status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(unique = true, nullable = false)
    String keycloakUserId;  // lưu Keycloak ID riêng

    @Column(unique = true, nullable = false, length = 25)
    String idCard;


    @Column(nullable = false, length = 100)
    String firstName;

    @Column(nullable = false, length = 100)
    String lastName;

    @Column(nullable = false, unique = true, length = 50)
    String username;

    @Column(nullable = false, length = 50)
    String siteId;

    @Column(nullable = false, length = 255)
    String passwordHash;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_employee_role"))
    @ToString.Exclude
    Role role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "position_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_employee_role"))
    @ToString.Exclude
    Position position;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_employee_role"))
    @ToString.Exclude
    Department department;

    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    @Builder.Default
    Boolean ppeCompliantFlag = false;

    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT TRUE")
    @Builder.Default
    Boolean inWarehouseFlag = true;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    EmployeeStatus status = EmployeeStatus.ACTIVE;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    LocalDateTime updatedAt;
}
