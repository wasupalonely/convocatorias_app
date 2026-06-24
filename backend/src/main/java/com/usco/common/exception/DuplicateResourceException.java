package com.usco.common.exception;

/** Thrown when creating a resource would violate a uniqueness constraint. Maps to HTTP 409. */
public class DuplicateResourceException extends RuntimeException {

    public DuplicateResourceException(String message) {
        super(message);
    }
}
