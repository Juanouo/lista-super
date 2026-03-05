'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { useListState } from '@/hooks/useListState';
import { Section, ActiveItem } from '@/lib/types';
import { ItemRow } from './ItemRow';
import { SubsectionBlock } from './SubsectionBlock';
import { AddItemInline } from './AddItemInline';

interface SectionBlockProps {
  section: Section;
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
  const { state, toggleAll } = useListState();

  const allItems = getAllSectionItems(section);
  const checkedCount = allItems.filter((i) => state.checkedItemIds.has(i.id)).length;
  const allChecked = allItems.length > 0 && checkedCount === allItems.length;
  const someChecked = checkedCount > 0 && !allChecked;

  return (
    <div className="py-4 border-b last:border-b-0">
      <div className="flex items-center gap-3 mb-2 px-2">
        <Checkbox
          checked={allChecked}
          data-state={someChecked ? 'indeterminate' : allChecked ? 'checked' : 'unchecked'}
          onCheckedChange={() => toggleAll(allItems)}
        />
        <h2 className="font-semibold text-base">{section.title}</h2>
        {checkedCount > 0 && (
          <span className="text-xs text-muted-foreground ml-auto">
            {checkedCount}/{allItems.length}
          </span>
        )}
      </div>

      <div className="ml-2">
        {section.items.map((item) => (
          <ItemRow key={item.id} item={item} sectionTitle={section.title} />
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
    </div>
  );
}
