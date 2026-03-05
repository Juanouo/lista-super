import { LeftPanel } from '@/components/left-panel/LeftPanel';
import { RightPanel } from '@/components/right-panel/RightPanel';
import { MobileFAB } from '@/components/mobile/MobileFAB';
import { ListProvider } from '@/hooks/useListState';
import { Section } from '@/lib/types';
import { createClient } from '@/lib/supabase';
import { parseLista } from '@/lib/parse-lista';

async function getSections(): Promise<Section[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('master_list')
      .select('sections')
      .eq('id', 1)
      .single();

    if (!error && data) return data.sections as Section[];

    // Seed from markdown if no row exists yet
    const sections = parseLista();
    await supabase.from('master_list').upsert({ id: 1, sections });
    return sections;
  } catch {
    return parseLista();
  }
}

export default async function Home() {
  const sections = await getSections();

  return (
    <ListProvider sections={sections}>
      <div className="flex h-dvh overflow-hidden">
        <main className="flex-1 overflow-y-auto lg:w-0">
          <LeftPanel />
        </main>
        <aside className="hidden lg:flex lg:flex-col w-80 xl:w-96 border-l">
          <RightPanel />
        </aside>
        <MobileFAB />
      </div>
    </ListProvider>
  );
}
