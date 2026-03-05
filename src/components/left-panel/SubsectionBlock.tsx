'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { useListState } from '@/hooks/useListState';
import { Subsection } from '@/lib/types';
import { ActiveItem } from '@/lib/types';
import { ItemRow } from './ItemRow';
import { AddItemInline } from './AddItemInline';

interface SubsectionBlockProps {
  subsection: Subsection;
  sectionId: string;
  sectionTitle: string;
}

export function SubsectionBlock({ subsection, sectionId, sectionTitle }: SubsectionBlockProps) {
  const { state, toggleAll } = useListState();

  const allItems: ActiveItem[] = subsection.items.map((item) => ({
    id: item.id,
    name: item.name,
    sectionTitle,
  }));

  const checkedCount = allItems.filter((i) => state.checkedItemIds.has(i.id)).length;
  const allChecked = allItems.length > 0 && checkedCount === allItems.length;
  const someChecked = checkedCount > 0 && !allChecked;

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
      <div className="ml-2">
        {subsection.items.map((item) => (
          <ItemRow key={item.id} item={item} sectionTitle={sectionTitle} />
        ))}
        <AddItemInline sectionId={sectionId} subsectionId={subsection.id} />
      </div>
    </div>
  );
}
