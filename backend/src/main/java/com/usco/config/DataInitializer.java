package com.usco.config;

import com.usco.usuarios.domain.EstadoUsuario;
import com.usco.usuarios.domain.Rol;
import com.usco.usuarios.domain.Usuario;
import com.usco.usuarios.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.enabled}")
    private boolean seedEnabled;
    @Value("${app.seed.admin-identificacion}")
    private String adminIdentificacion;
    @Value("${app.seed.admin-nombre}")
    private String adminNombre;
    @Value("${app.seed.admin-correo}")
    private String adminCorreo;
    @Value("${app.seed.admin-password}")
    private String adminPassword;

    public DataInitializer(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (!seedEnabled || usuarioRepository.existsByRol(Rol.ADMINISTRADOR)) {
            return;
        }

        Usuario admin = new Usuario();
        admin.setIdentificacion(adminIdentificacion);
        admin.setNombre(adminNombre);
        admin.setCorreo(adminCorreo);
        admin.setPasswordHash(passwordEncoder.encode(adminPassword));
        admin.setRol(Rol.ADMINISTRADOR);
        admin.setEstado(EstadoUsuario.ACTIVO);
        usuarioRepository.save(admin);

        log.info("Usuario ADMINISTRADOR inicial creado: {}", adminCorreo);
    }
}
