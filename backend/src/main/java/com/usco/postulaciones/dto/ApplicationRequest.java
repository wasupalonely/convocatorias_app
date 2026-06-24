package com.usco.postulaciones.dto;

import jakarta.validation.constraints.NotNull;

public record ApplicationRequest(
        @NotNull(message = "La convocatoria es obligatoria")
        Long callId
) {
}
