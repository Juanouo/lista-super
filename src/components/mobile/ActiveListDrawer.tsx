'use client';

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { ActiveListContent } from '@/components/right-panel/ActiveListContent';

interface ActiveListDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ActiveListDrawer({ open, onOpenChange }: ActiveListDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[70vh]">
        <DrawerHeader className="border-b pb-3">
          <DrawerTitle>Lista activa</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-hidden h-full">
          <ActiveListContent onClose={() => onOpenChange(false)} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
