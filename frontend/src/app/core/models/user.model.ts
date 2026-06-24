import { Role, UserStatus } from './enums';

export interface User {
  id: number;
  identification: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
}

export interface UserRequest {
  identification: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  status?: UserStatus;
}

export interface UserUpdateRequest {
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  password?: string; // solo se envia si se cambia
}
