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

export function ActiveListContent({ onClose }: { onClose?: () => void }) {
  const { state, clearList, removeItem } = useListState();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);

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
                  <span>{item.name}</span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive text-xs px-1 transition-opacity"
                    title="Quitar"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

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
