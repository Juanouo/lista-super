'use client';

import { useState } from 'react';
import { useListState } from '@/hooks/useListState';
import { SectionBlock } from './SectionBlock';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}

export function LeftPanel() {
  const { state, addCustomSection } = useListState();
  const [addingSect, setAddingSect] = useState(false);
  const [sectName, setSectName] = useState('');

  const submitSection = () => {
    const name = sectName.trim();
    if (!name) { setAddingSect(false); setSectName(''); return; }
    const id = slugify(name) + '__custom';
    addCustomSection({ id, title: name, items: [], subsections: [] });
    setSectName('');
    setAddingSect(false);
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Lista del Súper</h1>
      {state.sections.map((section) => (
        <SectionBlock key={section.id} section={section} />
      ))}

      <div className="mt-4 px-2">
        {addingSect ? (
          <input
            autoFocus
            value={sectName}
            onChange={(e) => setSectName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitSection();
              if (e.key === 'Escape') { setAddingSect(false); setSectName(''); }
            }}
            onBlur={submitSection}
            placeholder="Nombre de la sección..."
            className="text-sm border rounded px-2 py-1 w-full bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        ) : (
          <button
            onClick={() => setAddingSect(true)}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 py-1"
          >
            + Agregar sección
          </button>
        )}
      </div>
    </div>
  );
}
