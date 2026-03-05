'use client';

import { createContext, useContext, useReducer, useCallback, ReactNode, createElement } from 'react';
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
  | { type: 'SET_SECTIONS'; sections: Section[] };

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
  addCustomItem: (sectionId: string, item: ListItem, subsectionId?: string) => void;
  addCustomSection: (section: Section) => void;
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

  const addCustomItem = useCallback(
    (sectionId: string, item: ListItem, subsectionId?: string) => {
      dispatch({ type: 'ADD_CUSTOM_ITEM', sectionId, subsectionId, item });
      // Persist to Supabase (fire and forget)
      fetch('/api/master-list', {
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
      }).catch(console.error);
    },
    [state.sections]
  );

  const addCustomSection = useCallback(
    (section: Section) => {
      dispatch({ type: 'ADD_CUSTOM_SECTION', section });
      fetch('/api/master-list', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: [...state.sections, section] }),
      }).catch(console.error);
    },
    [state.sections]
  );

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
