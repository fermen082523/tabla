export interface Plate {
  id: string;
  plate_number: string;
  tags: string[];
  order: number;
  created_at?: string;
}

export type NewPlate = Omit<Plate, 'id' | 'created_at'>;
