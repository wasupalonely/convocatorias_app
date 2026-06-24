package com.usco.postulaciones.dto;

import com.usco.postulaciones.domain.ApplicationStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record StatusChangeRequest(
        @NotNull(message = "El estado es obligatorio")
        ApplicationStatus status,

        @Size(max = 500, message = "La observacion no puede exceder 500 caracteres")
        String observation
) {
}
