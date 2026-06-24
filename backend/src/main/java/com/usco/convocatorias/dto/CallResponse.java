package com.usco.convocatorias.dto;

import com.usco.categorias.dto.CategoryResponse;
import com.usco.convocatorias.domain.Call;
import com.usco.convocatorias.domain.CallStatus;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

public record CallResponse(
        Long id,
        String name,
        String description,
        LocalDate startDate,
        LocalDate endDate,
        int availableSlots,
        CallStatus status,
        List<CategoryResponse> categories
) {
    public static CallResponse from(Call call) {
        List<CategoryResponse> categories = call.getCategories().stream()
                .map(CategoryResponse::from)
                .sorted(Comparator.comparing(CategoryResponse::name))
                .toList();
        return new CallResponse(
                call.getId(),
                call.getName(),
                call.getDescription(),
                call.getStartDate(),
                call.getEndDate(),
                call.getAvailableSlots(),
                call.getStatus(),
                categories);
    }
}
