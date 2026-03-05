'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { useListState } from '@/hooks/useListState';
import { ListItem } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ItemRowProps {
  item: ListItem;
  sectionTitle: string;
}

export function ItemRow({ item, sectionTitle }: ItemRowProps) {
  const { state, toggleItem } = useListState();
  const checked = state.checkedItemIds.has(item.id);

  return (
    <label className="flex items-center gap-3 py-1.5 px-2 rounded-md cursor-pointer hover:bg-muted/50 group">
      <Checkbox
        checked={checked}
        onCheckedChange={() => toggleItem({ id: item.id, name: item.name, sectionTitle })}
      />
      <span className={cn('text-sm select-none', checked && 'line-through text-muted-foreground')}>
        {item.name}
      </span>
    </label>
  );
}
