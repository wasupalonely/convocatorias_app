import { Role } from './enums';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessExpiresInMs: number;
  userId: number;
  name: string;
  email: string;
  role: Role;
}
