'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SavedListSummary, SavedList, ActiveItem } from '@/lib/types';

interface SavedListCardProps {
  list: SavedListSummary;
}

export function SavedListCard({ list }: SavedListCardProps) {
  const [items, setItems] = useState<ActiveItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    if (items !== null) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/lists/${list.id}`);
      const data: SavedList = await res.json();
      setItems(data.items);
    } finally {
      setLoading(false);
    }
  };

  const date = new Date(list.created_at).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Group items by sectionTitle
  const grouped: Record<string, ActiveItem[]> = {};
  if (items) {
    for (const item of items) {
      if (!grouped[item.sectionTitle]) grouped[item.sectionTitle] = [];
      grouped[item.sectionTitle].push(item);
    }
  }

  return (
    <div className="border rounded-lg p-4 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">{date}</p>
        <p className="text-xs text-muted-foreground">{list.item_count} ítems</p>
      </div>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" onClick={fetchItems}>
            Ver ítems
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lista del {date}</DialogTitle>
          </DialogHeader>
          {loading && <p className="text-sm text-muted-foreground">Cargando...</p>}
          {items && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {Object.entries(grouped).map(([section, sectionItems]) => (
                <div key={section}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    {section}
                  </h3>
                  <ul className="space-y-1">
                    {sectionItems.map((item) => (
                      <li key={item.id} className="text-sm">{item.name}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
