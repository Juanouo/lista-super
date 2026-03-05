'use client';

import { useState, useRef, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { useListState } from '@/hooks/useListState';
import { Subsection } from '@/lib/types';
import { ActiveItem } from '@/lib/types';
import { ItemRow } from './ItemRow';
import { AddItemInline } from './AddItemInline';
import { cn } from '@/lib/utils';

interface SubsectionBlockProps {
  subsection: Subsection;
  sectionId: string;
  sectionTitle: string;
}

export function SubsectionBlock({ subsection, sectionId, sectionTitle }: SubsectionBlockProps) {
  const { state, toggleAll, reorderMasterItem } = useListState();

  const allItems: ActiveItem[] = subsection.items.map((item) => ({
    id: item.id,
    name: item.name,
    sectionTitle,
  }));

  const checkedCount = allItems.filter((i) => state.checkedItemIds.has(i.id)).length;
  const allChecked = allItems.length > 0 && checkedCount === allItems.length;
  const someChecked = checkedCount > 0 && !allChecked;

  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchDragActive = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const prevent = (e: TouchEvent) => { if (touchDragActive.current) e.preventDefault(); };
    el.addEventListener('touchmove', prevent, { passive: false });
    return () => el.removeEventListener('touchmove', prevent);
  }, []);

  function handleDragStart(id: string) { setDragId(id); }
  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    if (id !== dragId) setDragOverId(id);
  }
  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    if (dragId && dragId !== targetId) reorderMasterItem(sectionId, dragId, targetId, subsection.id);
    setDragId(null); setDragOverId(null);
  }
  function handleDragEnd() { setDragId(null); setDragOverId(null); }

  function handleTouchStart(id: string) {
    longPressTimer.current = setTimeout(() => {
      touchDragActive.current = true;
      setDragId(id);
    }, 400);
  }
  function handleTouchMove(e: React.TouchEvent, id: string) {
    if (!touchDragActive.current) {
      if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
      return;
    }
    const touch = e.changedTouches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const itemEl = el?.closest('[data-drag-id]');
    const overId = itemEl?.getAttribute('data-drag-id') ?? null;
    if (overId && overId !== id) setDragOverId(overId);
  }
  function handleTouchEnd(id: string) {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
    if (touchDragActive.current && dragId && dragOverId && dragId !== dragOverId) {
      reorderMasterItem(sectionId, dragId, dragOverId, subsection.id);
    }
    touchDragActive.current = false; setDragId(null); setDragOverId(null);
  }

  return (
    <div className="ml-4 mt-3">
      <div className="flex items-center gap-2 mb-1">
        <Checkbox
          checked={allChecked}
          data-state={someChecked ? 'indeterminate' : allChecked ? 'checked' : 'unchecked'}
          onCheckedChange={() => toggleAll(allItems)}
          className="opacity-60"
        />
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {subsection.title}
        </h3>
      </div>
      <div ref={containerRef} className="ml-2">
        {subsection.items.map((item) => (
          <div
            key={item.id}
            data-drag-id={item.id}
            draggable
            onDragStart={() => handleDragStart(item.id)}
            onDragOver={(e) => handleDragOver(e, item.id)}
            onDrop={(e) => handleDrop(e, item.id)}
            onDragEnd={handleDragEnd}
            onTouchStart={() => handleTouchStart(item.id)}
            onTouchMove={(e) => handleTouchMove(e, item.id)}
            onTouchEnd={() => handleTouchEnd(item.id)}
            className={cn(
              'flex items-center',
              dragId === item.id && 'opacity-30',
              dragOverId === item.id && dragId !== item.id && 'border-t-2 border-primary'
            )}
          >
            <span className="text-muted-foreground/30 px-1 cursor-grab active:cursor-grabbing text-base leading-none select-none">
              ⠿
            </span>
            <ItemRow item={item} sectionTitle={sectionTitle} />
          </div>
        ))}
        <AddItemInline sectionId={sectionId} subsectionId={subsection.id} />
      </div>
    </div>
  );
}
