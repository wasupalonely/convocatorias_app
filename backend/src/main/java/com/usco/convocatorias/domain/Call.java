package com.usco.convocatorias.domain;

import com.usco.categorias.domain.Category;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "convocatorias")
@Getter
@Setter
@NoArgsConstructor
public class Call {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombre", nullable = false, length = 200)
    private String name;

    @Column(name = "descripcion", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate startDate;

    @Column(name = "fecha_fin", nullable = false)
    private LocalDate endDate;

    @Column(name = "cupos_disponibles", nullable = false)
    private int availableSlots;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 15)
    private CallStatus status = CallStatus.BORRADOR;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "convocatoria_categoria",
            joinColumns = @JoinColumn(name = "convocatoria_id"),
            inverseJoinColumns = @JoinColumn(name = "categoria_id"))
    private Set<Category> categories = new HashSet<>();

    @Column(name = "creado_en", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "actualizado_en")
    private Instant updatedAt;

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
