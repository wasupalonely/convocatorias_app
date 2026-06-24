package com.usco;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point of the Institutional Calls Management System.
 *
 * <p>Architecture: modular monolith. Each package under {@code com.usco}
 * represents a business module (usuarios, convocatorias, categorias,
 * postulaciones, reportes) with its own web/service/repository layers.</p>
 */
@SpringBootApplication
public class CallManagementApplication {

    public static void main(String[] args) {
        SpringApplication.run(CallManagementApplication.class, args);
    }
}
