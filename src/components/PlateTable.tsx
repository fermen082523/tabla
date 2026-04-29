import React, { useState, useMemo } from 'react';
import type { Plate, PlateStatus } from '../types';
import { GripVertical, Trash2, Copy, Plus, RefreshCw, Filter, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
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

// Lógica de colores por iniciales (Etiquetas)
const getTagStyle = (tag: string) => {
  const colors: Record<string, string> = {
    'C': '#dbeafe', // Azul (Choerry)
    'K': '#fee2e2', // Rojo (Kim Lip)
    'J': '#fef9c3', // Amarillo
    'M': '#dcfce7', // Verde
  };
  const firstLetter = tag.trim().charAt(0).toUpperCase();
  return {
    backgroundColor: colors[firstLetter] || '#f1f5f9',
    color: '#1e293b',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    marginRight: '4px',
    border: '1px solid rgba(0,0,0,0.1)'
  };
};

const StatusIcon = ({ status }: { status: PlateStatus }) => {
  switch (status) {
    case 'completada': return <CheckCircle2 size={18} color="#10b981" />;
    case 'error': return <AlertCircle size={18} color="#ef4444" />;
    default: return <Circle size={18} color="#94a3b8" />;
  }
};

const SortableRow = ({ plate, onDelete, onUpdateTags, onUpdateStatus }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: plate.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <tr ref={setNodeRef} style={style}>
      <td>
        <div {...attributes} {...listeners} style={{ cursor: 'grab', padding: '0.5rem' }}>
          <GripVertical size={16} color="#94a3b8" />
        </div>
      </td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <StatusIcon status={plate.status} />
          <select 
            value={plate.status || 'pendiente'} 
            onChange={(e) => onUpdateStatus(plate.id, e.target.value as PlateStatus)}
            style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            <option value="pendiente">Pendiente</option>
            <option value="completada">OK</option>
            <option value="error">Error</option>
          </select>
        </div>
      </td>
      <td style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{plate.plate_number}</td>
      <td>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '4px' }}>
          {plate.tags.map((tag: string, i: number) => (
            <span key={i} style={getTagStyle(tag)}>{tag}</span>
          ))}
        </div>
        <input
          type="text"
          defaultValue={plate.tags.join(', ')}
          onBlur={(e) => onUpdateTags(plate.id, e.target.value)}
          placeholder="Etiquetas (C, K...)"
          style={{ width: '100%', fontSize: '0.8rem', border: 'none', borderBottom: '1px dashed #ccc' }}
        />
      </td>
      <td>
        <button onClick={() => onDelete(plate.id)} style={{ background: 'none', color: '#ef4444' }}>
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  );
};

export const PlateTable: React.FC<PlateTableProps> = ({ plates, onPlatesChange, onDelete, onRefresh }) => {
  const [newPlate, setNewPlate] = useState('');
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const filteredPlates = useMemo(() => {
    return plates
      .filter(p => {
        const matchesText = p.plate_number.toLowerCase().includes(filter.toLowerCase()) || 
                           p.tags.some(t => t.toLowerCase().includes(filter.toLowerCase()));
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        return matchesText && matchesStatus;
      })
      .sort((a, b) => a.order - b.order);
  }, [plates, filter, statusFilter]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = plates.findIndex((p) => p.id === active.id);
      const newIndex = plates.findIndex((p) => p.id === over.id);
      const reordered = arrayMove(plates, oldIndex, newIndex).map((p, idx) => ({ ...p, order: idx }));
      onPlatesChange(reordered);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const lines = e.clipboardData.getData('text').split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length > 0) {
      const newEntries: Plate[] = lines.map((line, index) => ({
        id: crypto.randomUUID(),
        plate_number: line.trim().toUpperCase(),
        tags: [],
        status: 'pendiente',
        order: plates.length + index
      }));
      onPlatesChange([...plates, ...newEntries]);
    }
  };

  const handleCopyPlates = () => {
    const text = filteredPlates.map(p => p.plate_number).join('\n');
    navigator.clipboard.writeText(text);
    alert(`${filteredPlates.length} placas copiadas`);
  };

  const updateTags = (id: string, tagString: string) => {
    const tags = tagString.split(',').map(t => t.trim()).filter(t => t !== '');
    onPlatesChange(plates.map(p => p.id === id ? { ...p, tags } : p));
  };

  const updateStatus = (id: string, status: PlateStatus) => {
    onPlatesChange(plates.map(p => p.id === id ? { ...p, status } : p));
  };

  return (
    <div className="plate-table-container">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
        <form onSubmit={(e) => { e.preventDefault(); if (newPlate) { onPlatesChange([...plates, { id: crypto.randomUUID(), plate_number: newPlate.toUpperCase(), tags: [], status: 'pendiente', order: plates.length }]); setNewPlate(''); } }} style={{ flex: '2 1 300px', display: 'flex', gap: '0.5rem' }}>
          <input type="text" placeholder="Nueva placa o PEGA LISTA AQUÍ..." value={newPlate} onChange={(e) => setNewPlate(e.target.value)} onPaste={handlePaste} style={{ flex: 1, fontWeight: 'bold' }} />
          <button type="submit"><Plus size={18} /></button>
        </form>
        
        <div style={{ flex: '1 1 200px', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Filter size={18} color="#64748b" />
          <input type="text" placeholder="Buscar etiqueta o placa..." value={filter} onChange={(e) => setFilter(e.target.value)} style={{ flex: 1, fontSize: '0.875rem' }} />
        </div>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '0.5rem' }}>
          <option value="all">Todos los estados</option>
          <option value="pendiente">⏳ Pendientes</option>
          <option value="completada">✅ OK</option>
          <option value="error">❌ Error</option>
        </select>

        <button onClick={onRefresh} style={{ background: '#64748b' }}><RefreshCw size={18} /></button>
        <button onClick={handleCopyPlates} style={{ background: '#0f172a' }}><Copy size={18} /> Copiar Filtradas</button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <table className="plate-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th style={{ width: '130px' }}>Estado</th>
              <th>Placa</th>
              <th>Etiquetas</th>
              <th style={{ width: '50px' }}></th>
            </tr>
          </thead>
          <tbody>
            <SortableContext items={filteredPlates.map(p => p.id)} strategy={verticalListSortingStrategy}>
              {filteredPlates.map((plate) => (
                <SortableRow key={plate.id} plate={plate} onDelete={onDelete} onUpdateTags={updateTags} onUpdateStatus={updateStatus} />
              ))}
            </SortableContext>
          </tbody>
        </table>
      </DndContext>
    </div>
  );
};
