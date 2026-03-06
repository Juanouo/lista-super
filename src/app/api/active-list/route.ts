import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { ActiveItem } from '@/lib/types';

export async function GET() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('active_list')
      .select('items')
      .eq('id', 1)
      .single();

    if (error || !data) {
      return NextResponse.json([] as ActiveItem[]);
    }
    return NextResponse.json(data.items as ActiveItem[]);
  } catch {
    return NextResponse.json([] as ActiveItem[]);
  }
}

export async function PUT(request: Request) {
  try {
    const { items } = await request.json() as { items: ActiveItem[] };
    const supabase = createClient();
    const { error } = await supabase
      .from('active_list')
      .upsert({ id: 1, items, updated_at: new Date().toISOString() });

    if (error) {
      console.error('[active-list PUT] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
