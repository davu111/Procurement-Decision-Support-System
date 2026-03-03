package com.ecotel.employee_service.service;

import com.ecotel.employee_service.dto.request.RoleRequest;
import com.ecotel.employee_service.dto.request.RoleUpdateRequest;
import com.ecotel.employee_service.dto.response.RoleResponse;
import com.ecotel.employee_service.mapper.RoleMapper;
import com.ecotel.employee_service.model.Role;
import com.ecotel.employee_service.repository.RoleRepository;
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

    private final RoleRepository roleRepository;
    private final RoleMapper roleMapper;
    private final Keycloak keycloak;

    @Value("${keycloak.realm}")
    private String realm;

    /**
     * Lấy tất cả roles
     */
    public List<RoleResponse> getAllRoles() {
        log.info("Fetching all roles");
        return roleRepository.findAll().stream()
                .map(roleMapper::toResponse)
                .toList();
    }

    /**
     * Lấy roles theo trang
     */
    public Page<RoleResponse> getRolesPaginated(Pageable pageable) {
        log.info("Fetching roles with pagination: page={}, size={}", pageable.getPageNumber(), pageable.getPageSize());
        return roleRepository.findAll(pageable)
                .map(roleMapper::toResponse);
    }

    /**
     * Lấy role theo ID
     */
    public RoleResponse getRoleById(String id) {
        log.info("Fetching role with id: {}", id);
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + id));
        return roleMapper.toResponse(role);
    }

    /**
     * Tạo role mới
     * Đồng thời tạo role trong Keycloak
     */
    @Transactional
    public RoleResponse createRole(RoleRequest roleRequest) {
        log.info("Creating new role: {}", roleRequest.getRoleName());

        try {
            Role role = roleMapper.toEntity(roleRequest);
            Role savedRole = roleRepository.save(role);
            log.info("Role saved to database with id: {}", savedRole.getId());

            // Tạo role trong Keycloak
            createRoleInKeycloak(roleRequest.getRoleName(), roleRequest.getDescription());
            log.info("Role created in Keycloak: {}", roleRequest.getRoleName());

            return roleMapper.toResponse(savedRole);
        } catch (Exception e) {
            log.error("Error creating role: {}", e.getMessage());
            throw new RuntimeException("Failed to create role", e);
        }
    }

    /**
     * Cập nhật role
     * Cập nhật cả trong database và Keycloak
     */
    @Transactional
    public RoleResponse updateRole(String id, RoleRequest roleRequest) {
        log.info("Updating role with id: {}", id);

        try {
            Role role = roleRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Role not found with id: " + id));
            
            String oldRoleName = role.getRoleName();
            
            roleMapper.updateEntityFromRequest(roleRequest, role);

            Role updatedRole = roleRepository.save(role);
            log.info("Role updated in database: {}", id);

            // Cập nhật role trong Keycloak
            if (!oldRoleName.equals(roleRequest.getRoleName())) {
                deleteRoleInKeycloak(oldRoleName);
                createRoleInKeycloak(roleRequest.getRoleName(), roleRequest.getDescription());
                log.info("Role updated in Keycloak: {} -> {}", oldRoleName, roleRequest.getRoleName());
            } else {
                updateRoleInKeycloak(roleRequest.getRoleName(), roleRequest.getDescription());
                log.info("Role description updated in Keycloak: {}", roleRequest.getRoleName());
            }

            return roleMapper.toResponse(updatedRole);
        } catch (Exception e) {
            log.error("Error updating role: {}", e.getMessage());
            throw new RuntimeException("Failed to update role", e);
        }
    }

    /**
     * Xóa role
     * Xóa role khỏi database và Keycloak
     */
    @Transactional
    public void deleteRole(String id) {
        log.info("Deleting role with id: {}", id);

        try {
            Role role = roleRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Role not found with id: " + id));

            roleRepository.deleteById(id);
            log.info("Role deleted from database: {}", id);

            // Xóa role khỏi Keycloak
            deleteRoleInKeycloak(role.getRoleName());
            log.info("Role deleted from Keycloak: {}", role.getRoleName());
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
                    // Lưu vào database
                    Role role = roleMapper.toEntity(roleRequest);
                    Role savedRole = roleRepository.save(role);
                    savedRoles.add(roleMapper.toResponse(savedRole));

                    // Tạo trong Keycloak
                    createRoleInKeycloak(roleRequest.getRoleName(), roleRequest.getDescription());
                    log.info("Batch: Role created - {} (DB and Keycloak)", roleRequest.getRoleName());
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
                    Role role = roleRepository.findById(roleRequest.getId())
                            .orElseThrow(() -> new RuntimeException("Role not found with id: " + roleRequest.getId()));
                    
                    String oldRoleName = role.getRoleName();
                    
                    roleMapper.updateEntityFromUpdateRequest(roleRequest, role);

                    Role updatedRole = roleRepository.save(role);
                    updatedRoles.add(roleMapper.toResponse(updatedRole));

                    // Cập nhật trong Keycloak
                    if (!oldRoleName.equals(roleRequest.getRoleName())) {
                        deleteRoleInKeycloak(oldRoleName);
                        createRoleInKeycloak(roleRequest.getRoleName(), roleRequest.getDescription());
                    } else {
                        updateRoleInKeycloak(roleRequest.getRoleName(), roleRequest.getDescription());
                    }

                    log.info("Batch: Role updated - {}", roleRequest.getRoleName());
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
                    Role role = roleRepository.findById(id)
                            .orElseThrow(() -> new RuntimeException("Role not found with id: " + id));

                    roleRepository.deleteById(id);

                    // Xóa từ Keycloak
                    deleteRoleInKeycloak(role.getRoleName());
                    log.info("Batch: Role deleted - {}", role.getRoleName());
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
