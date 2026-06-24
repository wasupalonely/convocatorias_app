package com.usco.postulaciones.dto;

import com.usco.postulaciones.domain.Application;
import com.usco.postulaciones.domain.ApplicationStatus;

import java.time.Instant;

public record ApplicationResponse(
        Long id,
        Long callId,
        String callName,
        Long applicantId,
        String applicantName,
        String applicantEmail,
        ApplicationStatus status,
        String observation,
        Instant appliedAt
) {
    public static ApplicationResponse from(Application application) {
        return new ApplicationResponse(
                application.getId(),
                application.getCall().getId(),
                application.getCall().getName(),
                application.getApplicant().getId(),
                application.getApplicant().getName(),
                application.getApplicant().getEmail(),
                application.getStatus(),
                application.getObservation(),
                application.getAppliedAt());
    }
}
