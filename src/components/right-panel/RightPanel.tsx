'use client';

import { ActiveListContent } from './ActiveListContent';
import { useListState } from '@/hooks/useListState';

export function RightPanel() {
  const { state } = useListState();

  const exportMd = () => {
    window.location.href = '/api/master-list/export';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-semibold">
          Lista activa
          {state.activeItems.length > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({state.activeItems.length})
            </span>
          )}
        </h2>
        <button
          onClick={exportMd}
          className="text-xs text-muted-foreground hover:text-foreground"
          title="Exportar .md"
        >
          Exportar .md
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        <ActiveListContent />
      </div>
    </div>
  );
}
