package com.usco.auth.dto;

import com.usco.usuarios.domain.Role;

/** Authentication response: access + refresh tokens and basic user data for the frontend. */
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
