package com.ecotel.employee_service.service;

import com.ecotel.employee_service.dto.request.EmployeeRequest;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class KeycloakService {

    private final Keycloak keycloak;

    @Value("${keycloak.realm}")
    private String realm;

    /**
     * Lấy tất cả users từ Keycloak
     */
    public List<UserRepresentation> getAllUsers() {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            UsersResource usersResource = realmResource.users();
            return usersResource.list();
        } catch (Exception e) {
            log.error("Error getting all users from Keycloak: {}", e.getMessage());
            throw new RuntimeException("Failed to get users from Keycloak", e);
        }
    }

    /**
     * Lấy user theo ID từ Keycloak
     */
    public UserRepresentation getUserById(String userId) {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            UserResource userResource = realmResource.users().get(userId);
            return userResource.toRepresentation();
        } catch (Exception e) {
            log.error("Error getting user {} from Keycloak: {}", userId, e.getMessage());
            throw new RuntimeException("Failed to get user from Keycloak", e);
        }
    }

    /**
     * Lấy user theo username từ Keycloak
     */
    public UserRepresentation getUserByUsername(String username) {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            UsersResource usersResource = realmResource.users();
            List<UserRepresentation> users = usersResource.search(username, true);

            if (users.isEmpty()) {
                throw new RuntimeException("User not found: " + username);
            }

            return users.getFirst();
        } catch (Exception e) {
            log.error("Error getting user {} from Keycloak: {}", username, e.getMessage());
            throw new RuntimeException("Failed to get user from Keycloak", e);
        }
    }

    /**
     * Lấy roles của user từ Keycloak
     */
    public List<String> getUserRoles(String userId) {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            UserResource userResource = realmResource.users().get(userId);

            List<RoleRepresentation> realmRoles = userResource.roles().realmLevel().listEffective();

            return realmRoles.stream()
                    .map(RoleRepresentation::getName)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting roles for user {}: {}", userId, e.getMessage());
            throw new RuntimeException("Failed to get user roles from Keycloak", e);
        }
    }

    /**
     * Lấy custom attributes của user
     */
    public String getUserAttribute(UserRepresentation user, String attributeName) {
        if (user.getAttributes() != null && user.getAttributes().containsKey(attributeName)) {
            List<String> values = user.getAttributes().get(attributeName);
            return values != null && !values.isEmpty() ? values.get(0) : null;
        }
        return null;
    }

    /**
     * Kiểm tra user có tồn tại không
     */
    public boolean userExists(String userId) {
        try {
            getUserById(userId);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Tạo user mới trong Keycloak
     */
    public String createUser(String username, String password,
                             String firstName, String lastName,
                             boolean enabled, boolean temporaryPassword) {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            UsersResource usersResource = realmResource.users();

            // Tạo UserRepresentation
            UserRepresentation user = new UserRepresentation();
            user.setUsername(username);
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setEnabled(enabled);
            user.setEmailVerified(true);

            // Tạo user
            Response response = usersResource.create(user);

            if (response.getStatus() != 201) {
                String errorMsg = response.readEntity(String.class);
                log.error("Failed to create user in Keycloak. Status: {}, Error: {}",
                        response.getStatus(), errorMsg);
                throw new RuntimeException("Failed to create user in Keycloak: " + errorMsg);
            }

            // Lấy user ID từ location header
            String location = response.getHeaderString("Location");
            String userId = location.substring(location.lastIndexOf('/') + 1);

            response.close();

            // ✅ Set password với temporary flag
            setUserPassword(userId, password, temporaryPassword);

            // ✅ Force update password nếu là password tạm
            if (temporaryPassword) {
                UserResource userResource = usersResource.get(userId);
                UserRepresentation userRep = userResource.toRepresentation();

                List<String> requiredActions = userRep.getRequiredActions();
                if (requiredActions == null) {
                    requiredActions = new ArrayList<>();
                }

                if (!requiredActions.contains("UPDATE_PASSWORD")) {
                    requiredActions.add("UPDATE_PASSWORD");
                }

                userRep.setRequiredActions(requiredActions);
                userResource.update(userRep);
            }

            log.info("Successfully created user {} in Keycloak with ID: {}", username, userId);
            return userId;

        } catch (Exception e) {
            log.error("Error creating user in Keycloak: {}", e.getMessage());
            throw new RuntimeException("Failed to create user in Keycloak", e);
        }
    }

    // update user in keycloak
    public void updateUser(String userId, EmployeeRequest request) {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            UserResource userResource = realmResource.users().get(userId);

            UserRepresentation user = userResource.toRepresentation();
            user.setFirstName(request.getFirstName());
            user.setLastName(request.getLastName());
            user.setUsername(request.getUsername());

            userResource.update(user);

            log.info("Successfully updated user {} in Keycloak", userId);

        } catch (Exception e) {
            log.error("Error updating user {} in Keycloak: {}", userId, e.getMessage());
            throw new RuntimeException("Failed to update user in Keycloak", e);
        }
    }

    /**
     * Set password cho user
     */
    public void setUserPassword(String userId, String password, boolean temporary) {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            UserResource userResource = realmResource.users().get(userId);

            org.keycloak.representations.idm.CredentialRepresentation credential =
                    new org.keycloak.representations.idm.CredentialRepresentation();
            credential.setType(org.keycloak.representations.idm.CredentialRepresentation.PASSWORD);
            credential.setValue(password);
            credential.setTemporary(temporary);

            userResource.resetPassword(credential);
            log.info("Successfully set password for user {}", userId);

        } catch (Exception e) {
            log.error("Error setting password for user {}: {}", userId, e.getMessage());
            throw new RuntimeException("Failed to set password", e);
        }
    }

    /**
     * Gán role cho user
     */
    public void assignRoleToUser(String userId, String roleName) {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            UserResource userResource = realmResource.users().get(userId);

            // Lấy role từ realm
            RoleRepresentation role = realmResource.roles().get(roleName).toRepresentation();

            // Gán role cho user
            userResource.roles().realmLevel().add(Collections.singletonList(role));

            log.info("Successfully assigned role {} to user {}", roleName, userId);

        } catch (Exception e) {
            log.error("Error assigning role {} to user {}: {}", roleName, userId, e.getMessage());
            throw new RuntimeException("Failed to assign role to user", e);
        }
    }

    /**
     * Set custom attributes cho user
     */
    public void setUserAttributes(String userId, Map<String, List<String>> attributes) {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            UserResource userResource = realmResource.users().get(userId);

            UserRepresentation user = userResource.toRepresentation();
            user.setAttributes(attributes);

            userResource.update(user);

            log.info("Successfully set attributes for user {}", userId);

        } catch (Exception e) {
            log.error("Error setting attributes for user {}: {}", userId, e.getMessage());
            throw new RuntimeException("Failed to set user attributes", e);
        }
    }

    /**
     * Xóa user khỏi Keycloak
     */
    public void deleteUser(String userId) {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            realmResource.users().delete(userId);

            log.info("Successfully deleted user {} from Keycloak", userId);

        } catch (Exception e) {
            log.error("Error deleting user {} from Keycloak: {}", userId, e.getMessage());
            throw new RuntimeException("Failed to delete user from Keycloak", e);
        }
    }
}