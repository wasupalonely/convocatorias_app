import { ApplicationStatus } from './enums';

export interface Application {
  id: number;
  callId: number;
  callName: string;
  applicantId: number;
  applicantName: string;
  applicantEmail: string;
  status: ApplicationStatus;
  observation: string | null;
  appliedAt: string; // ISO-8601 UTC
}

// El postulante sale del token; solo se envia la convocatoria.
export interface ApplicationRequest {
  callId: number;
}

export interface StatusChangeRequest {
  status: Extract<ApplicationStatus, 'APROBADA' | 'RECHAZADA'>;
  observation?: string;
}
