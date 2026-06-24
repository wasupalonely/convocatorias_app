package com.usco.reportes.repository;

import com.usco.convocatorias.domain.Call;
import com.usco.reportes.dto.ReportCount;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface ReportRepository extends Repository<Call, Long> {

    // El filtro de fecha (vigencia que cruza [from, to]) va en el ON del LEFT JOIN para
    // conservar las categorias sin convocatorias en el rango (conteo 0). Cuando no se filtra,
    // el servicio pasa fechas centinela que abarcan todo el rango posible.
    @Query(value = """
            SELECT cat.nombre AS label, COUNT(conv.id) AS total
            FROM categorias cat
            LEFT JOIN convocatoria_categoria cc ON cc.categoria_id = cat.id
            LEFT JOIN convocatorias conv ON conv.id = cc.convocatoria_id
                AND conv.fecha_inicio <= :to AND conv.fecha_fin >= :from
            GROUP BY cat.nombre
            ORDER BY cat.nombre
            """, nativeQuery = true)
    List<ReportCount> callsPerCategory(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query(value = """
            SELECT conv.nombre AS label, COUNT(p.id) AS total
            FROM convocatorias conv
            LEFT JOIN postulaciones p ON p.convocatoria_id = conv.id
                AND CAST(p.fecha_postulacion AS DATE) BETWEEN :from AND :to
            GROUP BY conv.nombre
            ORDER BY conv.nombre
            """, nativeQuery = true)
    List<ReportCount> applicationsPerCall(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query(value = """
            SELECT p.estado AS label, COUNT(*) AS total
            FROM postulaciones p
            WHERE CAST(p.fecha_postulacion AS DATE) BETWEEN :from AND :to
            GROUP BY p.estado
            ORDER BY p.estado
            """, nativeQuery = true)
    List<ReportCount> applicationsByStatus(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
