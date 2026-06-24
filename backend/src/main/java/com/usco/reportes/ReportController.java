package com.usco.reportes;

import com.usco.reportes.dto.ReportCountResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reportes")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    // `from`/`to` (yyyy-MM-dd) son opcionales; sin ellos el reporte cubre todo el historico.
    @GetMapping("/convocatorias-categoria")
    public List<ReportCountResponse> callsPerCategory(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return reportService.callsPerCategory(from, to);
    }

    @GetMapping("/postulaciones-convocatoria")
    public List<ReportCountResponse> applicationsPerCall(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return reportService.applicationsPerCall(from, to);
    }

    @GetMapping("/resultado-postulaciones")
    public List<ReportCountResponse> applicationsByStatus(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return reportService.applicationsByStatus(from, to);
    }
}
