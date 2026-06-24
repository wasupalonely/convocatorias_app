package com.usco.postulaciones.repository;

import com.usco.postulaciones.domain.Application;
import com.usco.postulaciones.domain.ApplicationStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApplicationRepository extends JpaRepository<Application, Long> {

    boolean existsByCallIdAndApplicantId(Long callId, Long applicantId);

    long countByCallIdAndStatus(Long callId, ApplicationStatus status);

    @EntityGraph(attributePaths = {"call", "applicant"})
    List<Application> findAllByOrderByAppliedAtDesc();

    @EntityGraph(attributePaths = {"call", "applicant"})
    List<Application> findByApplicantIdOrderByAppliedAtDesc(Long applicantId);

    @Override
    @EntityGraph(attributePaths = {"call", "applicant"})
    Optional<Application> findById(Long id);
}
