package com.usco.reportes.dto;

public record ReportCountResponse(String label, long total) {
    public static ReportCountResponse from(ReportCount projection) {
        return new ReportCountResponse(projection.getLabel(), projection.getTotal());
    }
}
