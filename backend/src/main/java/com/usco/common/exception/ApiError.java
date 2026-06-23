package com.usco.common.exception;

import java.time.OffsetDateTime;
import java.util.Map;

public record ApiError(
        OffsetDateTime timestamp,
        int status,
        String error,
        String message,
        String path,
        Map<String, String> fields
) {
    public static ApiError of(int status, String error, String message, String path, Map<String, String> fields) {
        return new ApiError(OffsetDateTime.now(), status, error, message, path, fields);
    }
}
