package com.usco.auth;

import com.usco.auth.dto.LoginRequest;
import com.usco.auth.dto.LoginResponse;
import com.usco.security.JwtService;
import com.usco.usuarios.domain.Usuario;
import com.usco.usuarios.repository.UsuarioRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;

    public AuthService(AuthenticationManager authenticationManager,
                       UsuarioRepository usuarioRepository,
                       JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.usuarioRepository = usuarioRepository;
        this.jwtService = jwtService;
    }

    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.correo(), request.password()));

        Usuario usuario = usuarioRepository.findByCorreo(request.correo())
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));

        String token = jwtService.generarToken(usuario);

        return new LoginResponse(
                token,
                "Bearer",
                jwtService.getExpirationMs(),
                usuario.getId(),
                usuario.getNombre(),
                usuario.getCorreo(),
                usuario.getRol());
    }
}
