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

  const updateMultiplePlates = async (updates: Partial<Plate>[], ids: string[]) => {
    if (ids.length === 0) return;
    
    // Para simplificar en la capa gratuita, usamos upsert con los datos actuales actualizados
    const updatedPlates = plates.map(p => {
      if (ids.includes(p.id)) {
        const update = updates.find((_, index) => ids[index] === p.id) || updates[0];
        return { ...p, ...update, updated_at: new Date().toISOString() };
      }
      return p;
    });

    const { error } = await supabase
      .from('plates')
      .upsert(updatedPlates.filter(p => ids.includes(p.id)));

    if (error) {
      console.error('Error updating multiple plates:', error);
    } else {
      setPlates(updatedPlates);
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

  const deletePlates = async (ids: string[]) => {
    if (ids.length === 0) return;
    
    const { error } = await supabase
      .from('plates')
      .delete()
      .in('id', ids);

    if (error) {
      console.error('Error deleting plates:', error);
    } else {
      setPlates(plates.filter(p => !ids.includes(p.id)));
    }
  };

  return { plates, setPlates, loading, savePlates, deletePlate, deletePlates, updateMultiplePlates, refresh: fetchPlates };
};
