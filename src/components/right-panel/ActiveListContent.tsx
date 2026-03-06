'use client';

import { useState } from 'react';
import { useListState } from '@/hooks/useListState';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Link from 'next/link';
import { ActiveItem } from '@/lib/types';
import { MessageSquare } from 'lucide-react';

export function ActiveListContent({ onClose }: { onClose?: () => void }) {
  const { state, clearList, removeItem, setItemNote } = useListState();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [noteItem, setNoteItem] = useState<ActiveItem | null>(null);
  const [noteText, setNoteText] = useState('');

  const { activeItems } = state;

  // Group by sectionTitle
  const grouped: Record<string, ActiveItem[]> = {};
  for (const item of activeItems) {
    if (!grouped[item.sectionTitle]) grouped[item.sectionTitle] = [];
    grouped[item.sectionTitle].push(item);
  }

  const copyToClipboard = async () => {
    const text = activeItems.map((i) => i.name).join('\n');
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
  };

  const saveList = async () => {
    if (activeItems.length === 0) return;
    setSaving(true);
    try {
      await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: activeItems }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    clearList();
    setClearOpen(false);
    onClose?.();
  };

  if (activeItems.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-muted-foreground gap-2 p-4">
        <p className="text-sm">Tu lista está vacía.</p>
        <p className="text-xs">Selecciona ítems en el panel izquierdo.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(grouped).map(([section, items]) => (
          <div key={section}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {section}
            </h3>
            <ul className="space-y-1">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between text-sm group"
                >
                  <span className="flex-1 min-w-0">
                    {item.name}
                    {item.note && (
                      <span className="ml-1 text-xs text-muted-foreground italic truncate">— {item.note}</span>
                    )}
                  </span>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => { setNoteItem(item); setNoteText(item.note ?? ''); }}
                      className={`${item.note ? 'text-blue-500' : 'opacity-0 group-hover:opacity-100 text-muted-foreground'} hover:text-blue-500 px-1 transition-opacity`}
                      title={item.note ?? 'Agregar nota'}
                    >
                      <MessageSquare size={13} />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive text-xs px-1 transition-opacity"
                      title="Quitar"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <Dialog open={!!noteItem} onOpenChange={(open) => { if (!open) setNoteItem(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nota para {noteItem?.name}</DialogTitle>
            <DialogDescription>Agrega una nota o aclaración para este ítem.</DialogDescription>
          </DialogHeader>
          <textarea
            className="w-full border rounded-md p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            rows={3}
            placeholder="ej. marca específica, cantidad, etc."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteItem(null)}>Cancelar</Button>
            <Button onClick={() => {
              if (noteItem) setItemNote(noteItem.id, noteText);
              setNoteItem(null);
            }}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="p-4 border-t space-y-2">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={copyToClipboard}>
            Copiar
          </Button>
          <Dialog open={clearOpen} onOpenChange={setClearOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                Limpiar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Limpiar lista</DialogTitle>
                <DialogDescription>
                  ¿Estás seguro de que quieres vaciar la lista activa?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setClearOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleClear}>
                  Limpiar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <Button
          size="sm"
          className="w-full"
          onClick={saveList}
          disabled={saving}
        >
          {saved ? '¡Guardado!' : saving ? 'Guardando...' : 'Guardar'}
        </Button>
        <Link
          href="/listas"
          className="block text-center text-xs text-muted-foreground hover:text-foreground mt-1"
        >
          Ver listas guardadas →
        </Link>
      </div>
    </div>
  );
}
