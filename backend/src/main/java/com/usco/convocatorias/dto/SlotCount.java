package com.usco.convocatorias.dto;

// Proyeccion para contar postulaciones APROBADAS agrupadas por convocatoria (evita N+1 en listados).
public interface SlotCount {
    Long getCallId();
    long getTotal();
}
