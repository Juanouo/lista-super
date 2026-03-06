export interface ListItem {
  id: string;
  name: string;
  isCustom?: boolean;
}

export interface Subsection {
  id: string;
  title: string;
  items: ListItem[];
}

export interface Section {
  id: string;
  title: string;
  items: ListItem[];         // items directly under H1, before any H2
  subsections: Subsection[];
}

export type ParsedList = Section[];

export interface ActiveItem {
  id: string;
  name: string;
  sectionTitle: string;
  note?: string;
}

export interface SavedListSummary {
  id: string;
  created_at: string;
  item_count: number;
}

export interface SavedList extends SavedListSummary {
  items: ActiveItem[];
}
