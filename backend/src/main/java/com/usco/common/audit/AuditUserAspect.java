package com.usco.common.audit;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Aspect
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class AuditUserAspect {

    private static final String SYSTEM_USER = "SISTEMA";

    @PersistenceContext
    private EntityManager entityManager;

    @Before("execution(* com.usco.usuarios.UserService.*(..)) "
            + "|| execution(* com.usco.convocatorias.CallService.*(..)) "
            + "|| execution(* com.usco.categorias.CategoryService.*(..)) "
            + "|| execution(* com.usco.postulaciones.ApplicationService.*(..))")
    public void propagateAppUser() {
        entityManager
                .createNativeQuery("EXEC sys.sp_set_session_context @key = N'app_user', @value = :appUser")
                .setParameter("appUser", resolveCurrentUser())
                .executeUpdate();
    }

    private String resolveCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return SYSTEM_USER;
        }
        if (authentication.getPrincipal() instanceof UserDetails userDetails) {
            return userDetails.getUsername();
        }
        String name = authentication.getName();
        return (name == null || "anonymousUser".equals(name)) ? SYSTEM_USER : name;
    }
}
