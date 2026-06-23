package com.usco.usuarios.dto;

import com.usco.usuarios.domain.EstadoUsuario;
import com.usco.usuarios.domain.Rol;
import com.usco.usuarios.domain.Usuario;

import java.time.Instant;

public record UsuarioResponse(
        Long id,
        String identificacion,
        String nombre,
        String correo,
        Rol rol,
        EstadoUsuario estado,
        Instant creadoEn
) {
    public static UsuarioResponse desde(Usuario usuario) {
        return new UsuarioResponse(
                usuario.getId(),
                usuario.getIdentificacion(),
                usuario.getNombre(),
                usuario.getCorreo(),
                usuario.getRol(),
                usuario.getEstado(),
                usuario.getCreadoEn());
    }
}
