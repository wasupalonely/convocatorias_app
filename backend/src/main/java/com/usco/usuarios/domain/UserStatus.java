package com.usco.usuarios.domain;

/** Account status. An INACTIVO user cannot authenticate. Values match the DB CHECK constraint. */
public enum UserStatus {
    ACTIVO,
    INACTIVO
}
