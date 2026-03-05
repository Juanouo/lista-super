import { LeftPanel } from '@/components/left-panel/LeftPanel';
import { RightPanel } from '@/components/right-panel/RightPanel';
import { MobileFAB } from '@/components/mobile/MobileFAB';
import { ListProvider } from '@/hooks/useListState';
import { Section } from '@/lib/types';

async function getSections(): Promise<Section[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/master-list`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  } catch {
    const { parseLista } = await import('@/lib/parse-lista');
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
