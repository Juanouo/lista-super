import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { SavedListCard } from '@/components/listas/SavedListCard';
import { SavedListSummary } from '@/lib/types';

async function getLists(): Promise<SavedListSummary[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('saved_lists')
      .select('id, created_at, item_count')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function ListasPage() {
  const lists = await getLists();

  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-muted-foreground hover:text-foreground text-sm">
          ← Volver
        </Link>
        <h1 className="text-2xl font-bold">Listas guardadas</h1>
      </div>

      {lists.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          <p>No hay listas guardadas aún.</p>
          <Link href="/" className="text-sm underline mt-2 block">
            Crear una lista
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {lists.map((list) => (
            <SavedListCard key={list.id} list={list} />
          ))}
        </div>
      )}
    </div>
  );
}
