package com.usco.usuarios.repository;

import com.usco.usuarios.domain.Rol;
import com.usco.usuarios.domain.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByCorreo(String correo);

    boolean existsByCorreo(String correo);

    boolean existsByIdentificacion(String identificacion);

    boolean existsByRol(Rol rol);
}
