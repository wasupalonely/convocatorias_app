package com.usco.usuarios.repository;

import com.usco.usuarios.domain.Role;
import com.usco.usuarios.domain.User;
import com.usco.usuarios.domain.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByIdentification(String identification);

    boolean existsByRole(Role role);

    long countByRoleAndStatus(Role role, UserStatus status);

    @Query(value = "SELECT COUNT(*) FROM postulaciones WHERE postulante_id = :userId",
            nativeQuery = true)
    long countApplicationsByUser(@Param("userId") Long userId);
}
