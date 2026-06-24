package com.usco.usuarios;

import com.usco.common.exception.BusinessException;
import com.usco.usuarios.domain.Role;
import com.usco.usuarios.domain.User;
import com.usco.usuarios.domain.UserStatus;
import com.usco.usuarios.dto.UserUpdateRequest;
import com.usco.usuarios.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User userWith(Role role, UserStatus status) {
        User user = new User();
        user.setName("Test");
        user.setEmail("user@usco.edu.co");
        user.setRole(role);
        user.setStatus(status);
        return user;
    }

    @Test
    void delete_failsWhenUserHasApplications() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(userWith(Role.ESTUDIANTE, UserStatus.ACTIVO)));
        when(userRepository.countApplicationsByUser(1L)).thenReturn(1L);

        assertThatThrownBy(() -> userService.delete(1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("1 postulacion");

        verify(userRepository, never()).delete(any());
    }

    @Test
    void delete_failsWhenUserIsLastActiveAdmin() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(userWith(Role.ADMINISTRADOR, UserStatus.ACTIVO)));
        when(userRepository.countApplicationsByUser(1L)).thenReturn(0L);
        when(userRepository.countByRoleAndStatus(Role.ADMINISTRADOR, UserStatus.ACTIVO)).thenReturn(1L);

        assertThatThrownBy(() -> userService.delete(1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("administrador");

        verify(userRepository, never()).delete(any());
    }

    @Test
    void delete_succeedsForRegularUserWithoutApplications() {
        User user = userWith(Role.ESTUDIANTE, UserStatus.ACTIVO);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.countApplicationsByUser(1L)).thenReturn(0L);

        userService.delete(1L);

        verify(userRepository, times(1)).delete(user);
    }

    @Test
    void update_failsWhenDemotingLastActiveAdmin() {
        User admin = userWith(Role.ADMINISTRADOR, UserStatus.ACTIVO);
        when(userRepository.findById(1L)).thenReturn(Optional.of(admin));
        when(userRepository.countByRoleAndStatus(Role.ADMINISTRADOR, UserStatus.ACTIVO)).thenReturn(1L);

        var request = new UserUpdateRequest("Test", "user@usco.edu.co", Role.DOCENTE, UserStatus.ACTIVO, null);

        assertThatThrownBy(() -> userService.update(1L, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("administrador");
    }
}
