package com.ecotel.employee_service.service;

import com.ecotel.employee_service.dto.request.RoleRequest;
import com.ecotel.employee_service.dto.request.RoleUpdateRequest;
import com.ecotel.employee_service.dto.response.RoleResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.representations.idm.RoleRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class RoleService {

    private final Keycloak keycloak;

    @Value("${keycloak.realm}")
    private String realm;

    /**
     * Lấy tất cả roles
     */
    public List<RoleResponse> getAllRoles() {
        log.info("Fetching all roles");
        try {
            RealmResource realmResource = keycloak.realm(realm);
            return realmResource.roles().list().stream()
                    .map(r -> new RoleResponse(r.getId(), r.getName(), r.getDescription()))
                    .toList();
        } catch (Exception e) {
            log.error("Error fetching roles from Keycloak: {}", e.getMessage());
            throw new RuntimeException("Failed to fetch roles from Keycloak", e);
        }
    }

    /**
     * Lấy roles theo trang
     */
    public Page<RoleResponse> getRolesPaginated(Pageable pageable) {
        log.info("Fetching roles with pagination: page={}, size={}", pageable.getPageNumber(), pageable.getPageSize());
        List<RoleResponse> all = getAllRoles();
        int start = Math.toIntExact(pageable.getOffset());
        int end = Math.min(start + pageable.getPageSize(), all.size());
        List<RoleResponse> content = start <= end ? all.subList(start, end) : List.of();
        return new org.springframework.data.domain.PageImpl<>(content, pageable, all.size());
    }

    /**
     * Lấy role theo ID
     */
    public RoleResponse getRoleById(String id) {
        log.info("Fetching role with id: {}", id);
        try {
            RealmResource realmResource = keycloak.realm(realm);
            RoleRepresentation r = realmResource.roles().get(id).toRepresentation();
            return new RoleResponse(r.getId(), r.getName(), r.getDescription());
        } catch (Exception e) {
            log.error("Error fetching role from Keycloak: {}", e.getMessage());
            throw new RuntimeException("Role not found: " + id, e);
        }
    }

    /**
     * Tạo role mới
     */
    @Transactional
    public RoleResponse createRole(RoleRequest roleRequest) {
        log.info("Creating new role: {}", roleRequest.getRoleName());

        try {
            // Create role in Keycloak only
            createRoleInKeycloak(roleRequest.getRoleName(), roleRequest.getDescription());
            RealmResource realmResource = keycloak.realm(realm);
            RoleRepresentation r = realmResource.roles().get(roleRequest.getRoleName()).toRepresentation();
            return new RoleResponse(r.getId(), r.getName(), r.getDescription());
        } catch (Exception e) {
            log.error("Error creating role: {}", e.getMessage());
            throw new RuntimeException("Failed to create role", e);
        }
    }

    /**
     * Cập nhật role
     */
    @Transactional
    public RoleResponse updateRole(String id, RoleRequest roleRequest) {
        log.info("Updating role with id: {}", id);

        try {
            RealmResource realmResource = keycloak.realm(realm);
            // Fetch current role representation
            RoleRepresentation current = realmResource.roles().get(id).toRepresentation();
            String oldName = current.getName();

            if (!oldName.equals(roleRequest.getRoleName())) {
                // delete and recreate with new name
                deleteRoleInKeycloak(oldName);
                createRoleInKeycloak(roleRequest.getRoleName(), roleRequest.getDescription());
                RealmResource rr = keycloak.realm(realm);
                RoleRepresentation r = rr.roles().get(roleRequest.getRoleName()).toRepresentation();
                return new RoleResponse(r.getId(), r.getName(), r.getDescription());
            } else {
                updateRoleInKeycloak(roleRequest.getRoleName(), roleRequest.getDescription());
                RoleRepresentation r = realmResource.roles().get(roleRequest.getRoleName()).toRepresentation();
                return new RoleResponse(r.getId(), r.getName(), r.getDescription());
            }
        } catch (Exception e) {
            log.error("Error updating role: {}", e.getMessage());
            throw new RuntimeException("Failed to update role", e);
        }
    }

    /**
     * Xóa role
     */
    @Transactional
    public void deleteRole(String id) {
        log.info("Deleting role with id: {}", id);

        try {
            // Treat id as role name (Keycloak role name)
            deleteRoleInKeycloak(id);
            log.info("Role deleted from Keycloak: {}", id);
        } catch (Exception e) {
            log.error("Error deleting role: {}", e.getMessage());
            throw new RuntimeException("Failed to delete role", e);
        }
    }

    /**
     * Batch create roles
     * Tạo nhiều roles cùng lúc
     */
    @Transactional
    public List<RoleResponse> createRolesBatch(List<RoleRequest> roles) {
        log.info("Creating {} roles in batch", roles.size());

        try {
            List<RoleResponse> savedRoles = new ArrayList<>();

            for (RoleRequest roleRequest : roles) {
                try {
                    // Tạo trong Keycloak
                    createRoleInKeycloak(roleRequest.getRoleName(), roleRequest.getDescription());
                    RealmResource rr = keycloak.realm(realm);
                    RoleRepresentation r = rr.roles().get(roleRequest.getRoleName()).toRepresentation();
                    savedRoles.add(new RoleResponse(r.getId(), r.getName(), r.getDescription()));
                    log.info("Batch: Role created - {} (Keycloak)", roleRequest.getRoleName());
                } catch (Exception e) {
                    log.warn("Batch: Failed to create role {}: {}", roleRequest.getRoleName(), e.getMessage());
                    // Tiếp tục với role tiếp theo
                }
            }

            log.info("Batch creation completed: {} roles created successfully", savedRoles.size());
            return savedRoles;
        } catch (Exception e) {
            log.error("Error in batch creation: {}", e.getMessage());
            throw new RuntimeException("Failed to create roles in batch", e);
        }
    }

    /**
     * Batch update roles
     */
    @Transactional
    public List<RoleResponse> updateRolesBatch(List<RoleUpdateRequest> roles) {
        log.info("Updating {} roles in batch", roles.size());

        try {
            List<RoleResponse> updatedRoles = new ArrayList<>();

            for (RoleUpdateRequest roleRequest : roles) {
                try {
                    // Update in Keycloak only
                    RealmResource rr = keycloak.realm(realm);
                    try {
                        RoleRepresentation current = rr.roles().get(roleRequest.getId()).toRepresentation();
                        String oldName = current.getName();
                        if (!oldName.equals(roleRequest.getRoleName())) {
                            deleteRoleInKeycloak(oldName);
                            createRoleInKeycloak(roleRequest.getRoleName(), roleRequest.getDescription());
                            RoleRepresentation r = rr.roles().get(roleRequest.getRoleName()).toRepresentation();
                            updatedRoles.add(new RoleResponse(r.getId(), r.getName(), r.getDescription()));
                        } else {
                            updateRoleInKeycloak(roleRequest.getRoleName(), roleRequest.getDescription());
                            RoleRepresentation r = rr.roles().get(roleRequest.getRoleName()).toRepresentation();
                            updatedRoles.add(new RoleResponse(r.getId(), r.getName(), r.getDescription()));
                        }

                        log.info("Batch: Role updated - {}", roleRequest.getRoleName());
                    } catch (Exception ex) {
                        log.warn("Batch: Failed to update role {}: {}", roleRequest.getId(), ex.getMessage());
                    }
                } catch (Exception e) {
                    log.warn("Batch: Failed to update role {}: {}", roleRequest.getId(), e.getMessage());
                    // Tiếp tục với role tiếp theo
                }
            }

            log.info("Batch update completed: {} roles updated successfully", updatedRoles.size());
            return updatedRoles;
        } catch (Exception e) {
            log.error("Error in batch update: {}", e.getMessage());
            throw new RuntimeException("Failed to update roles in batch", e);
        }
    }

    /**
     * Batch delete roles
     */
    @Transactional
    public void deleteRolesBatch(List<String> ids) {
        log.info("Deleting {} roles in batch", ids.size());

        try {
            for (String id : ids) {
                try {
                    // Treat id as role name
                    deleteRoleInKeycloak(id);
                    log.info("Batch: Role deleted - {}", id);
                } catch (Exception e) {
                    log.warn("Batch: Failed to delete role {}: {}", id, e.getMessage());
                    // Tiếp tục với role tiếp theo
                }
            }

            log.info("Batch deletion completed");
        } catch (Exception e) {
            log.error("Error in batch deletion: {}", e.getMessage());
            throw new RuntimeException("Failed to delete roles in batch", e);
        }
    }

    /**
     * Helper: Tạo role trong Keycloak
     */
    private void createRoleInKeycloak(String roleName, String description) {
        try {
            RealmResource realmResource = keycloak.realm(realm);

            RoleRepresentation roleRepresentation = new RoleRepresentation();
            roleRepresentation.setName(roleName);
            roleRepresentation.setDescription(description);

            realmResource.roles().create(roleRepresentation);
            log.info("Role created in Keycloak: {}", roleName);
        } catch (Exception e) {
            log.error("Error creating role in Keycloak: {}", e.getMessage());
            throw new RuntimeException("Failed to create role in Keycloak", e);
        }
    }

    /**
     * Helper: Cập nhật role trong Keycloak
     */
    private void updateRoleInKeycloak(String roleName, String description) {
        try {
            RealmResource realmResource = keycloak.realm(realm);

            RoleRepresentation roleRepresentation = realmResource.roles()
                    .get(roleName).toRepresentation();
            roleRepresentation.setDescription(description);

            realmResource.roles().get(roleName).update(roleRepresentation);
            log.info("Role updated in Keycloak: {}", roleName);
        } catch (Exception e) {
            log.error("Error updating role in Keycloak: {}", e.getMessage());
            throw new RuntimeException("Failed to update role in Keycloak", e);
        }
    }

    /**
     * Helper: Xóa role khỏi Keycloak
     */
    private void deleteRoleInKeycloak(String roleName) {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            realmResource.roles().deleteRole(roleName);
            log.info("Role deleted from Keycloak: {}", roleName);
        } catch (Exception e) {
            log.error("Error deleting role from Keycloak: {}", e.getMessage());
            throw new RuntimeException("Failed to delete role from Keycloak", e);
        }
    }
}
