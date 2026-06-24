package com.usco.usuarios.dto;

import com.usco.usuarios.domain.Role;
import com.usco.usuarios.domain.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Data to create a user. */
public record UserRequest(
        @NotBlank(message = "La identificacion es obligatoria")
        @Size(max = 30, message = "La identificacion no puede exceder 30 caracteres")
        String identification,

        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 150, message = "El nombre no puede exceder 150 caracteres")
        String name,

        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "El correo no tiene un formato valido")
        String email,

        @NotBlank(message = "La contrasena es obligatoria")
        @Size(min = 6, max = 72, message = "La contrasena debe tener entre 6 y 72 caracteres")
        String password,

        @NotNull(message = "El rol es obligatorio")
        Role role,

        UserStatus status
) {
}
