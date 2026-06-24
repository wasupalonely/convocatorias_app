package com.usco.config;

import com.usco.usuarios.domain.Role;
import com.usco.usuarios.domain.User;
import com.usco.usuarios.domain.UserStatus;
import com.usco.usuarios.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Creates the initial ADMINISTRADOR user if none exists yet, so the system is
 * operable after the first startup without exposing a password hash in the SQL script.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.enabled}")
    private boolean seedEnabled;
    @Value("${app.seed.admin-identificacion}")
    private String adminIdentification;
    @Value("${app.seed.admin-nombre}")
    private String adminName;
    @Value("${app.seed.admin-correo}")
    private String adminEmail;
    @Value("${app.seed.admin-password}")
    private String adminPassword;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (!seedEnabled || userRepository.existsByRole(Role.ADMINISTRADOR)) {
            return;
        }

        User admin = new User();
        admin.setIdentification(adminIdentification);
        admin.setName(adminName);
        admin.setEmail(adminEmail);
        admin.setPasswordHash(passwordEncoder.encode(adminPassword));
        admin.setRole(Role.ADMINISTRADOR);
        admin.setStatus(UserStatus.ACTIVO);
        userRepository.save(admin);

        log.info("Initial ADMINISTRADOR user created: {}", adminEmail);
    }
}
