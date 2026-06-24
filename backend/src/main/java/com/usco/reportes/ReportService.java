package com.usco.reportes;

import com.usco.reportes.dto.ReportCountResponse;
import com.usco.reportes.repository.ReportRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class ReportService {

    private final ReportRepository reportRepository;

    public ReportService(ReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

    public List<ReportCountResponse> callsPerCategory() {
        return reportRepository.callsPerCategory().stream().map(ReportCountResponse::from).toList();
    }

    public List<ReportCountResponse> applicationsPerCall() {
        return reportRepository.applicationsPerCall().stream().map(ReportCountResponse::from).toList();
    }

    public List<ReportCountResponse> applicationsByStatus() {
        return reportRepository.applicationsByStatus().stream().map(ReportCountResponse::from).toList();
    }
}
