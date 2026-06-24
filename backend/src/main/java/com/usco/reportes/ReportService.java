package com.usco.reportes;

import com.usco.reportes.dto.ReportCountResponse;
import com.usco.reportes.repository.ReportRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class ReportService {

    // Centinelas dentro del rango soportado por DATE en SQL Server (0001-01-01 .. 9999-12-31),
    // usados cuando el filtro de fecha viene vacio para no filtrar nada.
    private static final LocalDate MIN_DATE = LocalDate.of(1, 1, 1);
    private static final LocalDate MAX_DATE = LocalDate.of(9999, 12, 31);

    private final ReportRepository reportRepository;

    public ReportService(ReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

    public List<ReportCountResponse> callsPerCategory(LocalDate from, LocalDate to) {
        return reportRepository.callsPerCategory(orMin(from), orMax(to)).stream().map(ReportCountResponse::from).toList();
    }

    public List<ReportCountResponse> applicationsPerCall(LocalDate from, LocalDate to) {
        return reportRepository.applicationsPerCall(orMin(from), orMax(to)).stream().map(ReportCountResponse::from).toList();
    }

    public List<ReportCountResponse> applicationsByStatus(LocalDate from, LocalDate to) {
        return reportRepository.applicationsByStatus(orMin(from), orMax(to)).stream().map(ReportCountResponse::from).toList();
    }

    private LocalDate orMin(LocalDate from) {
        return from != null ? from : MIN_DATE;
    }

    private LocalDate orMax(LocalDate to) {
        return to != null ? to : MAX_DATE;
    }
}
