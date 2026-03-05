'use client';

import { useState } from 'react';
import { useListState } from '@/hooks/useListState';
import { ActiveListDrawer } from './ActiveListDrawer';

export function MobileFAB() {
  const { state } = useListState();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const count = state.activeItems.length;

  return (
    <>
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-5 right-5 lg:hidden z-50 bg-primary text-primary-foreground rounded-full w-14 h-14 flex items-center justify-center shadow-lg"
        aria-label="Ver lista activa"
      >
        {count > 0 ? (
          <span className="font-bold text-lg">{count}</span>
        ) : (
          <span className="text-xl">🛒</span>
        )}
      </button>
      <ActiveListDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
}
