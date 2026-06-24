package com.usco.auth.dto;

import com.usco.usuarios.domain.Role;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long accessExpiresInMs,
        Long userId,
        String name,
        String email,
        Role role
) {
}
