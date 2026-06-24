import { ApplicationStatus, CallStatus, Role, UserStatus } from '../core/models';

// Etiquetas legibles para mostrar; al enviar al backend se usa el valor literal del enum.
export const ROLE_LABELS: Record<Role, string> = {
  ADMINISTRADOR: 'Administrador',
  DOCENTE: 'Docente',
  ESTUDIANTE: 'Estudiante',
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
};

export const CALL_STATUS_LABELS: Record<CallStatus, string> = {
  BORRADOR: 'Borrador',
  PUBLICADA: 'Publicada',
  CERRADA: 'Cerrada',
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  PENDIENTE: 'Pendiente',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
};
