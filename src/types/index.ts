export type PlateStatus = 'pendiente' | 'completada' | 'error';

export interface Plate {
  id: string;
  plate_number: string;
  tags: string[];
  status: PlateStatus;
  order: number;
  created_at?: string;
}

export type NewPlate = Omit<Plate, 'id' | 'created_at'>;
