# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
```

No test suite is configured.

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Architecture

Next.js 14 app (App Router) + Supabase + Tailwind + Radix UI.

**Two Supabase tables:**
- `master_list` — single row (`id=1`) with a `sections` JSONB column storing the full `Section[]` tree
- `saved_lists` — rows with `items` (ActiveItem[]) and `item_count`

**Data flow:**
1. `data/lista-super.md` is the markdown seed file (parsed by `src/lib/parse-lista.ts` into `Section[]`)
2. On first load, if Supabase has no row, the markdown is parsed and upserted as the initial master list
3. All subsequent master list mutations (add item, delete item, reorder) call `PUT /api/master-list` optimistically — dispatch the reducer action first, then persist to Supabase

**State management (`src/hooks/useListState.ts`):**
- Single React context + `useReducer` wrapping all list state
- `ListProvider` is mounted at the root in `src/app/page.tsx` (server component that fetches sections from Supabase)
- `checkedItemIds: Set<string>` tracks which master-list items are in the active shopping list
- `activeItems: ActiveItem[]` is the current shopping list (items checked for the current trip)

**UI layout:**
- Desktop: two-column — `LeftPanel` (master list browser) | `RightPanel` (active list, fixed sidebar)
- Mobile: `LeftPanel` full-width + `MobileFAB` opens `ActiveListDrawer` (vaul drawer)

**Key data types (`src/lib/types.ts`):**
- `Section` (H1) → has direct `items[]` + `subsections[]`
- `Subsection` (H2) → has `items[]`
- `ListItem` — master list item with stable `id` (slugified path)
- `ActiveItem` — checked item for current shopping trip, includes `sectionTitle` for display grouping

**API routes:**
- `GET/PUT /api/master-list` — read/write the full sections tree
- `GET /api/master-list/export` — download current master list as `.md`
- `GET /api/lists` — list saved shopping lists
- `POST /api/lists` — save current active items as a new list
- `GET /api/lists/[id]` — fetch a single saved list

**Pages:**
- `/` — main shopping list builder
- `/listas` — history of saved shopping lists
