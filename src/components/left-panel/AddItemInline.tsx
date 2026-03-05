'use client';

import { useState } from 'react';
import { useListState } from '@/hooks/useListState';
import { ListItem } from '@/lib/types';

interface AddItemInlineProps {
  sectionId: string;
  subsectionId?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}

export function AddItemInline({ sectionId, subsectionId }: AddItemInlineProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const { addCustomItem } = useListState();

  const submit = async () => {
    const name = value.trim();
    if (!name) { setOpen(false); setValue(''); return; }
    const item: ListItem = {
      id: `${sectionId}__${subsectionId ?? 'direct'}__${slugify(name)}__custom`,
      name,
      isCustom: true,
    };
    setValue('');
    setOpen(false);
    try {
      await addCustomItem(sectionId, item, subsectionId);
    } catch {
      setError(true);
    }
  };

  if (!open) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => { setOpen(true); setError(false); }}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 mt-1"
        >
          + Agregar ítem
        </button>
        {error && (
          <span className="text-xs text-destructive mt-1">⚠ Error al guardar</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-2 mt-1">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') { setOpen(false); setValue(''); }
        }}
        onBlur={submit}
        placeholder="Nombre del ítem..."
        className="text-sm border rounded px-2 py-1 w-full bg-background focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  );
}
