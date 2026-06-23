package com.usco.auth.dto;

import com.usco.usuarios.domain.Rol;

public record LoginResponse(
        String token,
        String tipo,
        long expiraEnMs,
        Long usuarioId,
        String nombre,
        String correo,
        Rol rol
) {
}
