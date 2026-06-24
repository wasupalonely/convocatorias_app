package com.usco.reportes.repository;

import com.usco.convocatorias.domain.Call;
import com.usco.reportes.dto.ReportCount;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;

import java.util.List;

public interface ReportRepository extends Repository<Call, Long> {

    @Query(value = """
            SELECT cat.nombre AS label, COUNT(cc.convocatoria_id) AS total
            FROM categorias cat
            LEFT JOIN convocatoria_categoria cc ON cc.categoria_id = cat.id
            GROUP BY cat.nombre
            ORDER BY cat.nombre
            """, nativeQuery = true)
    List<ReportCount> callsPerCategory();

    @Query(value = """
            SELECT conv.nombre AS label, COUNT(p.id) AS total
            FROM convocatorias conv
            LEFT JOIN postulaciones p ON p.convocatoria_id = conv.id
            GROUP BY conv.nombre
            ORDER BY conv.nombre
            """, nativeQuery = true)
    List<ReportCount> applicationsPerCall();

    @Query(value = """
            SELECT p.estado AS label, COUNT(*) AS total
            FROM postulaciones p
            GROUP BY p.estado
            ORDER BY p.estado
            """, nativeQuery = true)
    List<ReportCount> applicationsByStatus();
}
