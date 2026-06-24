package com.usco.common.exception;

/**
 * Thrown when a business rule is violated (e.g. applying twice, applying to a
 * closed call, exceeding available slots). Maps to HTTP 409.
 */
public class BusinessException extends RuntimeException {

    public BusinessException(String message) {
        super(message);
    }
}
