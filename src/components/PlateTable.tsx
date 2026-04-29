import React, { useState } from 'react';
import type { Plate } from '../types';
import { GripVertical, Trash2, Copy, Plus, RefreshCw } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PlateTableProps {
  plates: Plate[];
  onPlatesChange: (newPlates: Plate[]) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

interface SortableRowProps {
  plate: Plate;
  onDelete: (id: string) => void;
  onUpdateTags: (id: string, tagString: string) => void;
}

const SortableRow: React.FC<SortableRowProps> = ({ plate, onDelete, onUpdateTags }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: plate.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr ref={setNodeRef} style={style}>
      <td>
        <div {...attributes} {...listeners} style={{ cursor: 'grab', display: 'flex', alignItems: 'center' }}>
          <GripVertical size={16} color="#94a3b8" />
        </div>
      </td>
      <td style={{ fontWeight: 'bold' }}>{plate.plate_number}</td>
      <td>
        <input
          type="text"
          defaultValue={plate.tags.join(', ')}
          onBlur={(e) => onUpdateTags(plate.id, e.target.value)}
          placeholder="ej. Revisado, Urgente"
          style={{ width: '100%', border: 'none', background: 'transparent' }}
        />
      </td>
      <td>
        <button 
          onClick={() => onDelete(plate.id)}
          style={{ background: 'none', color: '#ef4444', padding: '0.25rem' }}
        >
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  );
};

export const PlateTable: React.FC<PlateTableProps> = ({ plates, onPlatesChange, onDelete, onRefresh }) => {
  const [newPlate, setNewPlate] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = plates.findIndex((p) => p.id === active.id);
      const newIndex = plates.findIndex((p) => p.id === over.id);

      const reordered = arrayMove(plates, oldIndex, newIndex).map((p, idx) => ({
        ...p,
        order: idx,
      }));
      onPlatesChange(reordered);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const lines = pastedData.split(/\r?\n/).filter(line => line.trim() !== '');
    
    if (lines.length > 0) {
      const newEntries: Plate[] = lines.map((line, index) => ({
        id: crypto.randomUUID(),
        plate_number: line.trim().toUpperCase(),
        tags: [],
        order: plates.length + index
      }));
      onPlatesChange([...plates, ...newEntries]);
    }
  };

  const handleCopyAll = () => {
    const textToCopy = plates.map(p => p.plate_number).join('\n');
    navigator.clipboard.writeText(textToCopy);
    alert('Placas copiadas al portapapeles');
  };

  const addSinglePlate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate.trim()) return;
    
    const entry: Plate = {
      id: crypto.randomUUID(),
      plate_number: newPlate.trim().toUpperCase(),
      tags: [],
      order: plates.length
    };
    onPlatesChange([...plates, entry]);
    setNewPlate('');
  };

  const updateTags = (id: string, tagString: string) => {
    const tags = tagString.split(',').map(t => t.trim()).filter(t => t !== '');
    const updated = plates.map(p => p.id === id ? { ...p, tags } : p);
    onPlatesChange(updated);
  };

  return (
    <div className="plate-table-container">
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <form onSubmit={addSinglePlate} style={{ flex: 1, display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="Añadir placa (o pega una lista aquí)..."
            value={newPlate}
            onChange={(e) => setNewPlate(e.target.value)}
            onPaste={handlePaste}
            style={{ flex: 1 }}
          />
          <button type="submit"><Plus size={18} /></button>
        </form>
        <button onClick={onRefresh} title="Refrescar datos" style={{ background: '#64748b' }}>
          <RefreshCw size={18} />
        </button>
        <button onClick={handleCopyAll} title="Copiar todas las placas">
          <Copy size={18} /> Copiar Todo
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <table className="plate-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th>Placa</th>
              <th>Etiquetas (sep. por coma)</th>
              <th style={{ width: '60px' }}></th>
            </tr>
          </thead>
          <tbody>
            <SortableContext
              items={plates.map(p => p.id)}
              strategy={verticalListSortingStrategy}
            >
              {plates.map((plate) => (
                <SortableRow 
                  key={plate.id} 
                  plate={plate} 
                  onDelete={onDelete} 
                  onUpdateTags={updateTags} 
                />
              ))}
            </SortableContext>
            {plates.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No hay placas. Pega una lista en el cuadro de arriba para comenzar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </DndContext>
    </div>
  );
};
