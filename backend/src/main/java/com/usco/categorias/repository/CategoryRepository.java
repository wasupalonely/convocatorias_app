package com.usco.categorias.repository;

import com.usco.categorias.domain.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    boolean existsByNameIgnoreCase(String name);

    @Query(value = "SELECT COUNT(*) FROM convocatoria_categoria WHERE categoria_id = :categoryId",
            nativeQuery = true)
    long countCallsUsingCategory(@Param("categoryId") Long categoryId);
}
