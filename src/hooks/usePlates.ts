import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Plate } from '../types';

export const usePlates = () => {
  const [plates, setPlates] = useState<Plate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('plates')
      .select('*')
      .order('order', { ascending: true });

    if (error) {
      console.error('Error fetching plates:', error);
    } else {
      setPlates(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPlates();
  }, []);

  const savePlates = async (newPlates: Plate[]) => {
    // Para simplificar y dado que solo son 2 personas, podemos hacer un upsert.
    // Ojo: En un entorno real esto requeriría más cuidado con los conflictos.
    const { error } = await supabase
      .from('plates')
      .upsert(newPlates.map(p => ({
        ...p,
        updated_at: new Date().toISOString()
      })));

    if (error) {
      console.error('Error saving plates:', error);
    } else {
      setPlates(newPlates);
    }
  };

  const deletePlate = async (id: string) => {
    const { error } = await supabase
      .from('plates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting plate:', error);
    } else {
      setPlates(plates.filter(p => p.id !== id));
    }
  };

  return { plates, setPlates, loading, savePlates, deletePlate, refresh: fetchPlates };
};
