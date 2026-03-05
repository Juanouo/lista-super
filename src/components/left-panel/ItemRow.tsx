'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { useListState } from '@/hooks/useListState';
import { ListItem } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ItemRowProps {
  item: ListItem;
  sectionTitle: string;
  sectionId: string;
  subsectionId?: string;
}

export function ItemRow({ item, sectionTitle, sectionId, subsectionId }: ItemRowProps) {
  const { state, toggleItem, deleteMasterItem } = useListState();
  const checked = state.checkedItemIds.has(item.id);

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    if (confirm(`¿Eliminar "${item.name}" de la lista?`)) {
      deleteMasterItem(sectionId, item.id, subsectionId);
    }
  }

  return (
    <label className="flex items-center gap-3 py-1.5 px-2 rounded-md cursor-pointer hover:bg-muted/50 group">
      <Checkbox
        checked={checked}
        onCheckedChange={() => toggleItem({ id: item.id, name: item.name, sectionTitle })}
      />
      <span className={cn('text-sm select-none flex-1', checked && 'line-through text-muted-foreground')}>
        {item.name}
      </span>
      <button
        onClick={handleDelete}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity p-0.5 rounded"
        tabIndex={-1}
        aria-label={`Eliminar ${item.name}`}
      >
        ✕
      </button>
    </label>
  );
}
