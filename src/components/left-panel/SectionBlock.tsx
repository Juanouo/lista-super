'use client';

import { useState, useRef, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { useListState } from '@/hooks/useListState';
import { Section, ActiveItem } from '@/lib/types';
import { ItemRow } from './ItemRow';
import { SubsectionBlock } from './SubsectionBlock';
import { AddItemInline } from './AddItemInline';
import { cn } from '@/lib/utils';

interface SectionBlockProps {
  section: Section;
}

type DragTarget = { itemId: string; subsectionId: string | null };

function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
}

function getAllSectionItems(section: Section): ActiveItem[] {
  const direct: ActiveItem[] = section.items.map((item) => ({
    id: item.id,
    name: item.name,
    sectionTitle: section.title,
  }));
  const sub: ActiveItem[] = section.subsections.flatMap((s) =>
    s.items.map((item) => ({ id: item.id, name: item.name, sectionTitle: section.title }))
  );
  return [...direct, ...sub];
}

export function SectionBlock({ section }: SectionBlockProps) {
  const { state, toggleAll, reorderMasterItem, moveMasterItem, addSubsection, deleteSection } = useListState();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const allItems = getAllSectionItems(section);
  const checkedCount = allItems.filter((i) => state.checkedItemIds.has(i.id)).length;
  const allChecked = allItems.length > 0 && checkedCount === allItems.length;
  const someChecked = checkedCount > 0 && !allChecked;

  // Lifted drag state — covers direct items and all subsection items
  const [dragItem, setDragItem] = useState<DragTarget | null>(null);
  const [dragOver, setDragOver] = useState<DragTarget | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchDragActive = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // "Agregar subsección" inline state
  const [addingSub, setAddingSub] = useState(false);
  const [subName, setSubName] = useState('');

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const prevent = (e: TouchEvent) => { if (touchDragActive.current) e.preventDefault(); };
    el.addEventListener('touchmove', prevent, { passive: false });
    return () => el.removeEventListener('touchmove', prevent);
  }, []);

  function submitSubsection() {
    const title = subName.trim();
    setSubName(''); setAddingSub(false);
    if (!title) return;
    addSubsection(section.id, {
      id: `${section.id}__${slugify(title)}__${Date.now()}`,
      title,
      items: [],
    });
  }

  // HTML5 drag handlers
  function handleDragStart(itemId: string, subsectionId: string | null) {
    setDragItem({ itemId, subsectionId });
  }
  function handleDragOver(e: React.DragEvent, itemId: string, subsectionId: string | null) {
    e.preventDefault();
    if (dragItem && itemId !== dragItem.itemId) setDragOver({ itemId, subsectionId });
  }
  function handleDrop(e: React.DragEvent, targetItemId: string, targetSubsectionId: string | null) {
    e.preventDefault();
    if (!dragItem || dragItem.itemId === targetItemId) { setDragItem(null); setDragOver(null); return; }
    if (dragItem.subsectionId === targetSubsectionId) {
      reorderMasterItem(section.id, dragItem.itemId, targetItemId, targetSubsectionId ?? undefined);
    } else {
      moveMasterItem(section.id, dragItem.subsectionId ?? undefined, targetSubsectionId ?? undefined, dragItem.itemId, targetItemId);
    }
    setDragItem(null); setDragOver(null);
  }
  function handleDragEnd() { setDragItem(null); setDragOver(null); }

  // Touch handlers
  function handleTouchStart(itemId: string, subsectionId: string | null) {
    longPressTimer.current = setTimeout(() => {
      touchDragActive.current = true;
      setDragItem({ itemId, subsectionId });
    }, 400);
  }
  function handleTouchMove(e: React.TouchEvent) {
    if (!touchDragActive.current) {
      if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
      return;
    }
    const touch = e.changedTouches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const itemEl = el?.closest('[data-drag-id]');
    const overItemId = itemEl?.getAttribute('data-drag-id') ?? null;
    const rawSubId = itemEl?.getAttribute('data-subsection-id') ?? null;
    const overSubId = rawSubId || null;
    if (overItemId) setDragOver({ itemId: overItemId, subsectionId: overSubId });
  }
  function handleTouchEnd() {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
    if (touchDragActive.current && dragItem && dragOver && dragItem.itemId !== dragOver.itemId) {
      if (dragItem.subsectionId === dragOver.subsectionId) {
        reorderMasterItem(section.id, dragItem.itemId, dragOver.itemId, dragItem.subsectionId ?? undefined);
      } else {
        moveMasterItem(section.id, dragItem.subsectionId ?? undefined, dragOver.subsectionId ?? undefined, dragItem.itemId, dragOver.itemId);
      }
    }
    touchDragActive.current = false; setDragItem(null); setDragOver(null);
  }

  return (
    <div className="py-4 border-b last:border-b-0">
      <div className="flex items-center gap-3 mb-2 px-2 group">
        <Checkbox
          checked={allChecked}
          data-state={someChecked ? 'indeterminate' : allChecked ? 'checked' : 'unchecked'}
          onCheckedChange={() => toggleAll(allItems)}
        />
        <h2 className="font-semibold text-base">{section.title}</h2>
        <div className="ml-auto flex items-center gap-2">
          {checkedCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {checkedCount}/{allItems.length}
            </span>
          )}
          {confirmDelete ? (
            <>
              <span className="text-xs text-destructive">¿Eliminar sección?</span>
              <button
                onClick={() => deleteSection(section.id)}
                className="text-xs text-destructive font-medium hover:underline"
              >
                Sí
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                No
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs text-muted-foreground/50 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              title="Eliminar sección"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div ref={containerRef} className="ml-2">
        {section.items.map((item) => (
          <div
            key={item.id}
            data-drag-id={item.id}
            draggable
            onDragStart={() => handleDragStart(item.id, null)}
            onDragOver={(e) => handleDragOver(e, item.id, null)}
            onDrop={(e) => handleDrop(e, item.id, null)}
            onDragEnd={handleDragEnd}
            onTouchStart={() => handleTouchStart(item.id, null)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={cn(
              'flex items-center',
              dragItem?.itemId === item.id && 'opacity-30',
              dragOver?.itemId === item.id && dragOver?.subsectionId === null && dragItem?.itemId !== item.id && 'border-t-2 border-primary'
            )}
          >
            <span className="text-muted-foreground/30 px-1 cursor-grab active:cursor-grabbing text-base leading-none select-none">
              ⠿
            </span>
            <ItemRow item={item} sectionTitle={section.title} sectionId={section.id} />
          </div>
        ))}
        {section.items.length > 0 && section.subsections.length === 0 && (
          <AddItemInline sectionId={section.id} />
        )}
      </div>

      {section.subsections.map((sub) => (
        <SubsectionBlock
          key={sub.id}
          subsection={sub}
          sectionId={section.id}
          sectionTitle={section.title}
          dragItem={dragItem}
          dragOver={dragOver}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      ))}

      {section.subsections.length > 0 && (
        <div className="ml-4 mt-2">
          <AddItemInline sectionId={section.id} />
        </div>
      )}

      {section.items.length === 0 && section.subsections.length === 0 && (
        <AddItemInline sectionId={section.id} />
      )}

      {addingSub ? (
        <div className="ml-4 mt-2 flex items-center gap-2 px-2">
          <input
            autoFocus
            value={subName}
            onChange={(e) => setSubName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitSubsection();
              if (e.key === 'Escape') { setAddingSub(false); setSubName(''); }
            }}
            onBlur={submitSubsection}
            placeholder="Nombre de la subsección..."
            className="text-sm border rounded px-2 py-1 w-full bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      ) : (
        <div className="ml-4 mt-1">
          <button
            onClick={() => setAddingSub(true)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1"
          >
            + Agregar subsección
          </button>
        </div>
      )}
    </div>
  );
}
