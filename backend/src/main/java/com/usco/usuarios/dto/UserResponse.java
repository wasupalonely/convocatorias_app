package com.usco.usuarios.dto;

import com.usco.usuarios.domain.Role;
import com.usco.usuarios.domain.User;
import com.usco.usuarios.domain.UserStatus;

import java.time.Instant;

public record UserResponse(
        Long id,
        String identification,
        String name,
        String email,
        Role role,
        UserStatus status,
        Instant createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getIdentification(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getStatus(),
                user.getCreatedAt());
    }
}
