package com.usco.usuarios.domain;

/**
 * System roles. The enum constants keep the institutional (Spanish) vocabulary
 * because they are persisted as-is and matched by the database CHECK constraint.
 * Spring Security prefixes them with ROLE_ when building authorities.
 */
public enum Role {
    ADMINISTRADOR,
    DOCENTE,
    ESTUDIANTE
}
