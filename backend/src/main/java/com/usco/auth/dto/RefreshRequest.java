package com.usco.auth.dto;

import jakarta.validation.constraints.NotBlank;

/** Request to obtain a new access token from a valid refresh token. */
public record RefreshRequest(
        @NotBlank(message = "El refresh token es obligatorio")
        String refreshToken
) {
}
