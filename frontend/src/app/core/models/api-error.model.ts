export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  // En validaciones (400): campo -> mensaje. Null en el resto de errores.
  fields: Record<string, string> | null;
}
