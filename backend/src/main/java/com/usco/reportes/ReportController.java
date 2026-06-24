package com.usco.reportes;

import com.usco.reportes.dto.ReportCountResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reportes")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/convocatorias-categoria")
    public List<ReportCountResponse> callsPerCategory() {
        return reportService.callsPerCategory();
    }

    @GetMapping("/postulaciones-convocatoria")
    public List<ReportCountResponse> applicationsPerCall() {
        return reportService.applicationsPerCall();
    }

    @GetMapping("/resultado-postulaciones")
    public List<ReportCountResponse> applicationsByStatus() {
        return reportService.applicationsByStatus();
    }
}
