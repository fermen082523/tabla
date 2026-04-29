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

const SortableRow = ({ plate, onDelete, onUpdateTags, onUpdateStatus }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: plate.id });
  const [isEditing, setIsEditing] = useState(false);
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <tr ref={setNodeRef} style={style}>
      <td>
        <div {...attributes} {...listeners} style={{ cursor: 'grab', padding: '0.5rem' }}>
          <GripVertical size={16} color="#94a3b8" />
        </div>
      </td>
      <td className="no-select">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => onUpdateStatus(plate.id, 'pendiente')}
            title="Pendiente"
            style={{ 
              background: 'none', padding: '4px', borderRadius: '4px', display: 'flex',
              border: plate.status === 'pendiente' ? '1px solid #94a3b8' : '1px solid transparent',
              opacity: plate.status === 'pendiente' ? 1 : 0.3
            }}
          >
            <Circle size={18} color="#94a3b8" />
          </button>
          <button
            onClick={() => onUpdateStatus(plate.id, 'completada')}
            title="Completada"
            style={{ 
              background: 'none', padding: '4px', borderRadius: '4px', display: 'flex',
              border: plate.status === 'completada' ? '1px solid #10b981' : '1px solid transparent',
              opacity: plate.status === 'completada' ? 1 : 0.3
            }}
          >
            <CheckCircle2 size={18} color="#10b981" />
          </button>
          <button
            onClick={() => onUpdateStatus(plate.id, 'error')}
            title="Error"
            style={{ 
              background: 'none', padding: '4px', borderRadius: '4px', display: 'flex',
              border: plate.status === 'error' ? '1px solid #ef4444' : '1px solid transparent',
              opacity: plate.status === 'error' ? 1 : 0.3
            }}
          >
            <AlertCircle size={18} color="#ef4444" />
          </button>
        </div>
      </td>
      <td className="plate-number-text" style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
        {plate.plate_number}
      </td>
      <td className="no-select" onDoubleClick={() => setIsEditing(true)}>
        {!isEditing ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', minHeight: '24px', alignItems: 'center' }}>
            {plate.tags.length > 0 ? (
              plate.tags.map((tag: string, i: number) => (
                <span key={i} className="no-select" style={getTagStyle(tag)}>{tag}</span>
              ))
            ) : (
              <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>Doble clic para etiqueta</span>
            )}
          </div>
        ) : (
          <input
            autoFocus
            type="text"
            className="tag-input-hidden"
            defaultValue={plate.tags.join(', ')}
            onBlur={(e) => {
              onUpdateTags(plate.id, e.target.value);
              setIsEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onUpdateTags(plate.id, (e.target as HTMLInputElement).value);
                setIsEditing(false);
              }
            }}
          />
        )}
      </td>
      <td className="no-select">
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
  const [tagFilterMode, setTagFilterMode] = useState<'all' | 'no-tag'>('all');
  const [bulkTag, setBulkTag] = useState('');

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    plates.forEach(p => p.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [plates]);

  const filteredPlates = useMemo(() => {
    return plates
      .filter(p => {
        const matchesText = p.plate_number.toLowerCase().includes(filter.toLowerCase()) || 
                           p.tags.some(t => t.toLowerCase().includes(filter.toLowerCase()));
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        let matchesTagMode = true;
        if (tagFilterMode === 'no-tag') {
          matchesTagMode = p.tags.length === 0;
        } else if (tagFilterMode !== 'all') {
          matchesTagMode = p.tags.includes(tagFilterMode);
        }
        return matchesText && matchesStatus && matchesTagMode;
      })
      .sort((a, b) => a.order - b.order);
  }, [plates, filter, statusFilter, tagFilterMode]);

  const handleApplyBulkTag = () => {
    if (!bulkTag.trim()) return;
    const singleTag = bulkTag.trim().split(',')[0].trim();
    const updated = plates.map(p => {
      const isVisible = filteredPlates.some(fp => fp.id === p.id);
      if (isVisible) {
        return { ...p, tags: [singleTag] };
      }
      return p;
    });
    onPlatesChange(updated);
    setBulkTag('');
  };

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
      const duplicates: string[] = [];
      const toAdd: Plate[] = [];
      
      lines.forEach((line) => {
        const plateNum = line.trim().toUpperCase();
        const existing = plates.find(p => p.plate_number === plateNum);
        
        if (existing) {
          const tagInfo = existing.tags.length > 0 ? ` (Etiqueta: ${existing.tags[0]})` : ' (Sin etiqueta)';
          duplicates.push(`${plateNum}${tagInfo}`);
        } else {
          toAdd.push({
            id: crypto.randomUUID(),
            plate_number: plateNum,
            tags: [],
            status: 'pendiente',
            order: plates.length + toAdd.length
          });
        }
      });

      if (toAdd.length > 0) {
        onPlatesChange([...plates, ...toAdd]);
      }

      let message = `✅ Se han añadido ${toAdd.length} placas nuevas.`;
      if (duplicates.length > 0) {
        message += `\n\n⚠️ Se ignoraron ${duplicates.length} duplicadas:\n${duplicates.join('\n')}`;
      }
      alert(message);
    }
  };

  const handleCopyPlates = () => {
    const text = filteredPlates.map(p => p.plate_number).join('\n');
    navigator.clipboard.writeText(text);
    alert(`${filteredPlates.length} placas copiadas`);
  };

  const updateTags = (id: string, tagString: string) => {
    const singleTag = tagString.trim().split(',')[0].trim();
    const tags = singleTag ? [singleTag] : [];
    onPlatesChange(plates.map(p => p.id === id ? { ...p, tags } : p));
  };

  const updateStatus = (id: string, status: PlateStatus) => {
    onPlatesChange(plates.map(p => p.id === id ? { ...p, status } : p));
  };

  return (
    <div className="plate-table-container">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
        <form onSubmit={(e) => { e.preventDefault(); if (newPlate) { 
          const plateNum = newPlate.toUpperCase();
          const existing = plates.find(p => p.plate_number === plateNum);
          if (existing) {
             const tagInfo = existing.tags.length > 0 ? ` (Etiqueta: ${existing.tags[0]})` : ' (Sin etiqueta)';
             alert(`⚠️ La placa ${plateNum} ya existe${tagInfo}`);
             return;
          }
          onPlatesChange([...plates, { id: crypto.randomUUID(), plate_number: plateNum, tags: [], status: 'pendiente', order: plates.length }]); 
          setNewPlate(''); 
        } }} style={{ flex: '1 1 100%', display: 'flex', gap: '0.5rem' }}>
          <input type="text" placeholder="Nueva placa o PEGA LISTA..." value={newPlate} onChange={(e) => setNewPlate(e.target.value)} onPaste={handlePaste} style={{ flex: 1, fontWeight: 'bold' }} />
          <button type="submit"><Plus size={18} /></button>
        </form>
        
        <div style={{ flex: '1 1 200px', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Filter size={18} color="#64748b" />
          <input type="text" placeholder="Filtrar..." value={filter} onChange={(e) => setFilter(e.target.value)} style={{ flex: 1, fontSize: '0.875rem' }} />
        </div>

        <select value={tagFilterMode} onChange={(e) => setTagFilterMode(e.target.value as any)} style={{ padding: '0.5rem' }}>
          <option value="all">Todas las etiquetas</option>
          <option value="no-tag">⚠️ Sin Etiqueta</option>
          {availableTags.map(tag => (
            <option key={tag} value={tag}>Etiqueta: {tag}</option>
          ))}
        </select>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '0.5rem' }}>
          <option value="all">Cualquier Estado</option>
          <option value="pendiente">Pendientes</option>
          <option value="completada">OK</option>
          <option value="error">Error</option>
        </select>

        <div style={{ display: 'flex', gap: '0.5rem', flex: '1 1 auto', justifyContent: 'flex-end' }}>
          <button onClick={onRefresh} style={{ background: '#64748b' }}><RefreshCw size={18} /></button>
          <button onClick={handleCopyPlates} style={{ background: '#0f172a' }}><Copy size={18} /> Copiar</button>
        </div>
      </div>

      <div className="bulk-actions no-select">
        <span style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>Etiquetado Masivo:</span>
        <input 
          type="text" 
          placeholder="Etiqueta para todas las visibles..." 
          value={bulkTag}
          onChange={(e) => setBulkTag(e.target.value)}
          style={{ flex: 1, padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
        />
        <button onClick={handleApplyBulkTag} style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
          Aplicar a {filteredPlates.length}
        </button>
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
