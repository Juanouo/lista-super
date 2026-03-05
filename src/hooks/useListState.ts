'use client';

import { createContext, useContext, useReducer, useCallback, useEffect, useRef, ReactNode, createElement } from 'react';

const STORAGE_KEY = 'lista-super-active';
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
import { Section, ListItem, ActiveItem } from '@/lib/types';

interface ListState {
  checkedItemIds: Set<string>;
  activeItems: ActiveItem[];
  sections: Section[];
}

type Action =
  | { type: 'TOGGLE_ITEM'; item: ActiveItem }
  | { type: 'REMOVE_ITEM'; id: string }
  | { type: 'TOGGLE_ALL'; items: ActiveItem[] }
  | { type: 'ADD_CUSTOM_ITEM'; sectionId: string; subsectionId?: string; item: ListItem }
  | { type: 'ADD_CUSTOM_SECTION'; section: Section }
  | { type: 'CLEAR_LIST' }
  | { type: 'SET_SECTIONS'; sections: Section[] }
  | { type: 'REORDER_MASTER_ITEM'; sectionId: string; subsectionId?: string; fromId: string; toId: string }
  | { type: 'DELETE_MASTER_ITEM'; sectionId: string; subsectionId?: string; itemId: string }
  | { type: 'HYDRATE'; checkedItemIds: Set<string>; activeItems: ActiveItem[] };

function reducer(state: ListState, action: Action): ListState {
  switch (action.type) {
    case 'TOGGLE_ITEM': {
      const { item } = action;
      const newChecked = new Set(state.checkedItemIds);
      if (newChecked.has(item.id)) {
        newChecked.delete(item.id);
        return {
          ...state,
          checkedItemIds: newChecked,
          activeItems: state.activeItems.filter((i) => i.id !== item.id),
        };
      } else {
        newChecked.add(item.id);
        return {
          ...state,
          checkedItemIds: newChecked,
          activeItems: [...state.activeItems, item],
        };
      }
    }
    case 'REMOVE_ITEM': {
      const newChecked = new Set(state.checkedItemIds);
      newChecked.delete(action.id);
      return {
        ...state,
        checkedItemIds: newChecked,
        activeItems: state.activeItems.filter((i) => i.id !== action.id),
      };
    }
    case 'TOGGLE_ALL': {
      const { items } = action;
      const ids = items.map((i) => i.id);
      const allChecked = ids.every((id) => state.checkedItemIds.has(id));
      if (allChecked) {
        const newChecked = new Set(state.checkedItemIds);
        ids.forEach((id) => newChecked.delete(id));
        return {
          ...state,
          checkedItemIds: newChecked,
          activeItems: state.activeItems.filter((i) => !ids.includes(i.id)),
        };
      } else {
        const newChecked = new Set(state.checkedItemIds);
        const toAdd: ActiveItem[] = [];
        items.forEach((item) => {
          if (!newChecked.has(item.id)) {
            newChecked.add(item.id);
            toAdd.push(item);
          }
        });
        return {
          ...state,
          checkedItemIds: newChecked,
          activeItems: [...state.activeItems, ...toAdd],
        };
      }
    }
    case 'ADD_CUSTOM_ITEM': {
      const newSections = state.sections.map((section) => {
        if (section.id !== action.sectionId) return section;
        if (action.subsectionId) {
          return {
            ...section,
            subsections: section.subsections.map((sub) => {
              if (sub.id !== action.subsectionId) return sub;
              return { ...sub, items: [...sub.items, action.item] };
            }),
          };
        }
        return { ...section, items: [...section.items, action.item] };
      });
      return { ...state, sections: newSections };
    }
    case 'ADD_CUSTOM_SECTION': {
      return { ...state, sections: [...state.sections, action.section] };
    }
    case 'CLEAR_LIST': {
      return { ...state, checkedItemIds: new Set(), activeItems: [] };
    }
    case 'SET_SECTIONS': {
      return { ...state, sections: action.sections };
    }
    case 'DELETE_MASTER_ITEM': {
      const { sectionId, subsectionId, itemId } = action;
      const newChecked = new Set(state.checkedItemIds);
      newChecked.delete(itemId);
      return {
        ...state,
        checkedItemIds: newChecked,
        activeItems: state.activeItems.filter((i) => i.id !== itemId),
        sections: state.sections.map((section) => {
          if (section.id !== sectionId) return section;
          if (subsectionId) {
            return {
              ...section,
              subsections: section.subsections.map((sub) =>
                sub.id === subsectionId ? { ...sub, items: sub.items.filter((i) => i.id !== itemId) } : sub
              ),
            };
          }
          return { ...section, items: section.items.filter((i) => i.id !== itemId) };
        }),
      };
    }
    case 'REORDER_MASTER_ITEM': {
      const { sectionId, subsectionId, fromId, toId } = action;
      const reorder = <T extends { id: string }>(arr: T[]): T[] => {
        const items = [...arr];
        const fromIdx = items.findIndex((i) => i.id === fromId);
        const toIdx = items.findIndex((i) => i.id === toId);
        if (fromIdx < 0 || toIdx < 0) return arr;
        const [moved] = items.splice(fromIdx, 1);
        items.splice(toIdx, 0, moved);
        return items;
      };
      return {
        ...state,
        sections: state.sections.map((section) => {
          if (section.id !== sectionId) return section;
          if (subsectionId) {
            return {
              ...section,
              subsections: section.subsections.map((sub) =>
                sub.id === subsectionId ? { ...sub, items: reorder(sub.items) } : sub
              ),
            };
          }
          return { ...section, items: reorder(section.items) };
        }),
      };
    }
    case 'HYDRATE': {
      return { ...state, checkedItemIds: action.checkedItemIds, activeItems: action.activeItems };
    }
    default:
      return state;
  }
}

interface ListContextValue {
  state: ListState;
  dispatch: React.Dispatch<Action>;
  toggleItem: (item: ActiveItem) => void;
  removeItem: (id: string) => void;
  toggleAll: (items: ActiveItem[]) => void;
  clearList: () => void;
  addCustomItem: (sectionId: string, item: ListItem, subsectionId?: string) => Promise<void>;
  addCustomSection: (section: Section) => Promise<void>;
  reorderMasterItem: (sectionId: string, fromId: string, toId: string, subsectionId?: string) => void;
  deleteMasterItem: (sectionId: string, itemId: string, subsectionId?: string) => void;
}

const ListContext = createContext<ListContextValue | null>(null);

export function ListProvider({
  children,
  sections,
}: {
  children: ReactNode;
  sections: Section[];
}) {
  const [state, dispatch] = useReducer(reducer, {
    checkedItemIds: new Set<string>(),
    activeItems: [],
    sections,
  });

  const toggleItem = useCallback((item: ActiveItem) => dispatch({ type: 'TOGGLE_ITEM', item }), []);
  const removeItem = useCallback((id: string) => dispatch({ type: 'REMOVE_ITEM', id }), []);
  const toggleAll = useCallback((items: ActiveItem[]) => dispatch({ type: 'TOGGLE_ALL', items }), []);
  const clearList = useCallback(() => dispatch({ type: 'CLEAR_LIST' }), []);
  const reorderMasterItem = useCallback(
    (sectionId: string, fromId: string, toId: string, subsectionId?: string) => {
      dispatch({ type: 'REORDER_MASTER_ITEM', sectionId, subsectionId, fromId, toId });
      // Compute new sections for persistence (mirrors reducer logic)
      const reorder = <T extends { id: string }>(arr: T[]): T[] => {
        const items = [...arr];
        const fromIdx = items.findIndex((i) => i.id === fromId);
        const toIdx = items.findIndex((i) => i.id === toId);
        if (fromIdx < 0 || toIdx < 0) return arr;
        const [moved] = items.splice(fromIdx, 1);
        items.splice(toIdx, 0, moved);
        return items;
      };
      const newSections = state.sections.map((section) => {
        if (section.id !== sectionId) return section;
        if (subsectionId) {
          return {
            ...section,
            subsections: section.subsections.map((sub) =>
              sub.id === subsectionId ? { ...sub, items: reorder(sub.items) } : sub
            ),
          };
        }
        return { ...section, items: reorder(section.items) };
      });
      fetch('/api/master-list', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: newSections }),
      }).catch(console.error);
    },
    [state.sections]
  );

  const addCustomItem = useCallback(
    async (sectionId: string, item: ListItem, subsectionId?: string): Promise<void> => {
      dispatch({ type: 'ADD_CUSTOM_ITEM', sectionId, subsectionId, item });
      const res = await fetch('/api/master-list', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections: state.sections.map((s) => {
            if (s.id !== sectionId) return s;
            if (subsectionId) {
              return {
                ...s,
                subsections: s.subsections.map((sub) => {
                  if (sub.id !== subsectionId) return sub;
                  return { ...sub, items: [...sub.items, item] };
                }),
              };
            }
            return { ...s, items: [...s.items, item] };
          }),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error('[addCustomItem] Save failed:', body);
        throw new Error(body.error ?? 'No se pudo guardar el ítem');
      }
    },
    [state.sections]
  );

  const deleteMasterItem = useCallback(
    (sectionId: string, itemId: string, subsectionId?: string) => {
      dispatch({ type: 'DELETE_MASTER_ITEM', sectionId, subsectionId, itemId });
      const newSections = state.sections.map((section) => {
        if (section.id !== sectionId) return section;
        if (subsectionId) {
          return {
            ...section,
            subsections: section.subsections.map((sub) =>
              sub.id === subsectionId ? { ...sub, items: sub.items.filter((i) => i.id !== itemId) } : sub
            ),
          };
        }
        return { ...section, items: section.items.filter((i) => i.id !== itemId) };
      });
      fetch('/api/master-list', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: newSections }),
      }).catch(console.error);
    },
    [state.sections]
  );

  const addCustomSection = useCallback(
    async (section: Section): Promise<void> => {
      dispatch({ type: 'ADD_CUSTOM_SECTION', section });
      const res = await fetch('/api/master-list', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: [...state.sections, section] }),
      });
      if (!res.ok) throw new Error('No se pudo guardar la sección');
    },
    [state.sections]
  );

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const { checkedItemIds, activeItems, savedAt } = JSON.parse(stored);
      if (Date.now() - savedAt > ONE_WEEK_MS) return;
      dispatch({ type: 'HYDRATE', checkedItemIds: new Set(checkedItemIds), activeItems });
    } catch {}
  }, []);

  // Persist to localStorage on every change (skip the initial empty render)
  const skipFirstSave = useRef(true);
  useEffect(() => {
    if (skipFirstSave.current) { skipFirstSave.current = false; return; }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        checkedItemIds: [...state.checkedItemIds],
        activeItems: state.activeItems,
        savedAt: Date.now(),
      }));
    } catch {}
  }, [state.checkedItemIds, state.activeItems]);

  return createElement(
    ListContext.Provider,
    {
      value: {
        state,
        dispatch,
        toggleItem,
        removeItem,
        toggleAll,
        clearList,
        addCustomItem,
        addCustomSection,
        reorderMasterItem,
        deleteMasterItem,
      },
    },
    children
  );
}

export function useListState(): ListContextValue {
  const ctx = useContext(ListContext);
  if (!ctx) throw new Error('useListState must be used within ListProvider');
  return ctx;
}
