package com.usco.usuarios;

import com.usco.common.exception.DuplicateResourceException;
import com.usco.common.exception.ResourceNotFoundException;
import com.usco.usuarios.domain.EstadoUsuario;
import com.usco.usuarios.domain.Usuario;
import com.usco.usuarios.dto.UsuarioRequest;
import com.usco.usuarios.dto.UsuarioResponse;
import com.usco.usuarios.dto.UsuarioUpdateRequest;
import com.usco.usuarios.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@Transactional
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponse> listar() {
        return usuarioRepository.findAll().stream().map(UsuarioResponse::desde).toList();
    }

    @Transactional(readOnly = true)
    public UsuarioResponse obtener(Long id) {
        return UsuarioResponse.desde(buscar(id));
    }

    public UsuarioResponse crear(UsuarioRequest request) {
        if (usuarioRepository.existsByCorreo(request.correo())) {
            throw new DuplicateResourceException("Ya existe un usuario con el correo " + request.correo());
        }
        if (usuarioRepository.existsByIdentificacion(request.identificacion())) {
            throw new DuplicateResourceException("Ya existe un usuario con la identificacion " + request.identificacion());
        }

        Usuario usuario = new Usuario();
        usuario.setIdentificacion(request.identificacion());
        usuario.setNombre(request.nombre());
        usuario.setCorreo(request.correo());
        usuario.setPasswordHash(passwordEncoder.encode(request.password()));
        usuario.setRol(request.rol());
        usuario.setEstado(request.estado() != null ? request.estado() : EstadoUsuario.ACTIVO);

        return UsuarioResponse.desde(usuarioRepository.save(usuario));
    }

    public UsuarioResponse actualizar(Long id, UsuarioUpdateRequest request) {
        Usuario usuario = buscar(id);

        if (!usuario.getCorreo().equalsIgnoreCase(request.correo())
                && usuarioRepository.existsByCorreo(request.correo())) {
            throw new DuplicateResourceException("Ya existe un usuario con el correo " + request.correo());
        }

        usuario.setNombre(request.nombre());
        usuario.setCorreo(request.correo());
        usuario.setRol(request.rol());
        usuario.setEstado(request.estado());
        if (StringUtils.hasText(request.password())) {
            usuario.setPasswordHash(passwordEncoder.encode(request.password()));
        }

        return UsuarioResponse.desde(usuario);
    }

    public void eliminar(Long id) {
        Usuario usuario = buscar(id);
        usuarioRepository.delete(usuario);
    }

    private Usuario buscar(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Usuario", id));
    }
}
