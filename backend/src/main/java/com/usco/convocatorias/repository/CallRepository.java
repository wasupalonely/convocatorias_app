package com.usco.convocatorias.repository;

import com.usco.convocatorias.domain.Call;
import com.usco.convocatorias.domain.CallStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CallRepository extends JpaRepository<Call, Long> {

    @Override
    @EntityGraph(attributePaths = "categories")
    List<Call> findAll();

    @EntityGraph(attributePaths = "categories")
    List<Call> findByStatus(CallStatus status);

    @Override
    @EntityGraph(attributePaths = "categories")
    Optional<Call> findById(Long id);

    @Query(value = "SELECT COUNT(*) FROM postulaciones WHERE convocatoria_id = :callId",
            nativeQuery = true)
    long countApplications(@Param("callId") Long callId);
}
