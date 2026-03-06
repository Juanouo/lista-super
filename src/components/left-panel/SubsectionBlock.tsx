'use client';

import { useState, useRef, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { useListState } from '@/hooks/useListState';
import { Subsection, ActiveItem } from '@/lib/types';
import { ItemRow } from './ItemRow';
import { AddItemInline } from './AddItemInline';
import { cn } from '@/lib/utils';

type DragTarget = { itemId: string; subsectionId: string | null };

interface SubsectionBlockProps {
  subsection: Subsection;
  sectionId: string;
  sectionTitle: string;
  dragItem: DragTarget | null;
  dragOver: DragTarget | null;
  onDragStart: (itemId: string, subsectionId: string | null) => void;
  onDragOver: (e: React.DragEvent, itemId: string, subsectionId: string | null) => void;
  onDrop: (e: React.DragEvent, targetItemId: string, targetSubsectionId: string | null) => void;
  onDragEnd: () => void;
  onTouchStart: (itemId: string, subsectionId: string | null) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

export function SubsectionBlock({
  subsection, sectionId, sectionTitle,
  dragItem, dragOver,
  onDragStart, onDragOver, onDrop, onDragEnd,
  onTouchStart, onTouchMove, onTouchEnd,
}: SubsectionBlockProps) {
  const { state, toggleAll, renameSubsection } = useListState();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(subsection.title);

  function submitRename() {
    setEditingTitle(false);
    const trimmed = titleValue.trim();
    if (!trimmed || trimmed === subsection.title) { setTitleValue(subsection.title); return; }
    renameSubsection(sectionId, subsection.id, trimmed);
  }

  const allItems: ActiveItem[] = subsection.items.map((item) => ({
    id: item.id,
    name: item.name,
    sectionTitle,
  }));

  const checkedCount = allItems.filter((i) => state.checkedItemIds.has(i.id)).length;
  const allChecked = allItems.length > 0 && checkedCount === allItems.length;
  const someChecked = checkedCount > 0 && !allChecked;

  // Keep containerRef for passive:false touchmove prevention (touchDragActive from parent)
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // We can't access parent's touchDragActive here, so prevent default on all touchmoves
    // when an item is being dragged (parent manages actual state)
    const prevent = (e: TouchEvent) => {
      const target = e.target as Element | null;
      if (target?.closest('[data-drag-id]')) e.preventDefault();
    };
    el.addEventListener('touchmove', prevent, { passive: false });
    return () => el.removeEventListener('touchmove', prevent);
  }, []);

  return (
    <div className="ml-4 mt-3">
      <div className="flex items-center gap-2 mb-1">
        <Checkbox
          checked={allChecked}
          data-state={someChecked ? 'indeterminate' : allChecked ? 'checked' : 'unchecked'}
          onCheckedChange={() => toggleAll(allItems)}
          className="opacity-60"
        />
        {editingTitle ? (
          <input
            autoFocus
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitRename();
              if (e.key === 'Escape') { setEditingTitle(false); setTitleValue(subsection.title); }
            }}
            onBlur={submitRename}
            className="text-sm font-medium text-muted-foreground uppercase tracking-wide bg-transparent border-b border-muted-foreground focus:outline-none w-full"
          />
        ) : (
          <h3
            className="text-sm font-medium text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground"
            onClick={() => setEditingTitle(true)}
          >
            {subsection.title}
          </h3>
        )}
      </div>
      <div ref={containerRef} className="ml-2">
        {subsection.items.map((item) => (
          <div
            key={item.id}
            data-drag-id={item.id}
            data-subsection-id={subsection.id}
            draggable
            onDragStart={() => onDragStart(item.id, subsection.id)}
            onDragOver={(e) => onDragOver(e, item.id, subsection.id)}
            onDrop={(e) => onDrop(e, item.id, subsection.id)}
            onDragEnd={onDragEnd}
            onTouchStart={() => onTouchStart(item.id, subsection.id)}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            className={cn(
              'flex items-center',
              dragItem?.itemId === item.id && 'opacity-30',
              dragOver?.itemId === item.id && dragOver?.subsectionId === subsection.id && dragItem?.itemId !== item.id && 'border-t-2 border-primary'
            )}
          >
            <span className="text-muted-foreground/30 px-1 cursor-grab active:cursor-grabbing text-base leading-none select-none">
              ⠿
            </span>
            <ItemRow item={item} sectionTitle={sectionTitle} sectionId={sectionId} subsectionId={subsection.id} />
          </div>
        ))}
        <AddItemInline sectionId={sectionId} subsectionId={subsection.id} />
      </div>
    </div>
  );
}
