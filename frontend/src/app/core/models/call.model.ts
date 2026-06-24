import { CallStatus } from './enums';
import { Category } from './category.model';

export interface Call {
  id: number;
  name: string;
  description: string;
  startDate: string; // yyyy-MM-dd
  endDate: string; // yyyy-MM-dd
  availableSlots: number;
  status: CallStatus;
  categories: Category[];
}

export interface CallRequest {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  availableSlots: number;
  status?: CallStatus;
  categoryIds?: number[]; // relacion N:M; al editar precargar desde Call.categories
}
