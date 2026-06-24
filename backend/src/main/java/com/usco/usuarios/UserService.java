package com.usco.usuarios;

import com.usco.common.exception.BusinessException;
import com.usco.common.exception.DuplicateResourceException;
import com.usco.common.exception.ResourceNotFoundException;
import com.usco.usuarios.domain.Role;
import com.usco.usuarios.domain.User;
import com.usco.usuarios.domain.UserStatus;
import com.usco.usuarios.dto.UserRequest;
import com.usco.usuarios.dto.UserResponse;
import com.usco.usuarios.dto.UserUpdateRequest;
import com.usco.usuarios.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> findAll() {
        return userRepository.findAll().stream().map(UserResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public UserResponse findById(Long id) {
        return UserResponse.from(getOrThrow(id));
    }

    public UserResponse create(UserRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("Ya existe un usuario con el correo " + request.email());
        }
        if (userRepository.existsByIdentification(request.identification())) {
            throw new DuplicateResourceException("Ya existe un usuario con la identificacion " + request.identification());
        }

        User user = new User();
        user.setIdentification(request.identification());
        user.setName(request.name());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(request.role());
        user.setStatus(request.status() != null ? request.status() : UserStatus.ACTIVO);

        return UserResponse.from(userRepository.save(user));
    }

    public UserResponse update(Long id, UserUpdateRequest request) {
        User user = getOrThrow(id);

        if (!user.getEmail().equalsIgnoreCase(request.email()) && userRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("Ya existe un usuario con el correo " + request.email());
        }

        boolean wasActiveAdmin = user.getRole() == Role.ADMINISTRADOR && user.getStatus() == UserStatus.ACTIVO;
        boolean willStayActiveAdmin = request.role() == Role.ADMINISTRADOR && request.status() == UserStatus.ACTIVO;
        if (wasActiveAdmin && !willStayActiveAdmin && isLastActiveAdmin()) {
            throw new BusinessException("No se puede quitar el rol o desactivar al unico administrador activo del sistema.");
        }

        user.setName(request.name());
        user.setEmail(request.email());
        user.setRole(request.role());
        user.setStatus(request.status());
        if (StringUtils.hasText(request.password())) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }

        return UserResponse.from(user);
    }

    public void delete(Long id) {
        User user = getOrThrow(id);

        long applications = userRepository.countApplicationsByUser(id);
        if (applications > 0) {
            throw new BusinessException("No se puede eliminar el usuario porque tiene "
                    + applications + " postulacion(es) asociada(s).");
        }
        if (user.getRole() == Role.ADMINISTRADOR && user.getStatus() == UserStatus.ACTIVO && isLastActiveAdmin()) {
            throw new BusinessException("No se puede eliminar al unico administrador activo del sistema.");
        }

        userRepository.delete(user);
    }

    private boolean isLastActiveAdmin() {
        return userRepository.countByRoleAndStatus(Role.ADMINISTRADOR, UserStatus.ACTIVO) <= 1;
    }

    private User getOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Usuario", id));
    }
}
