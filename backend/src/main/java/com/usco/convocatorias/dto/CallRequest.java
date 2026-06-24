package com.usco.convocatorias.dto;

import com.usco.convocatorias.domain.CallStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.Set;

public record CallRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 200, message = "El nombre no puede exceder 200 caracteres")
        String name,

        String description,

        @NotNull(message = "La fecha de inicio es obligatoria")
        LocalDate startDate,

        @NotNull(message = "La fecha de fin es obligatoria")
        LocalDate endDate,

        @NotNull(message = "Los cupos disponibles son obligatorios")
        @Min(value = 0, message = "Los cupos no pueden ser negativos")
        Integer availableSlots,

        CallStatus status,

        Set<Long> categoryIds
) {
}
