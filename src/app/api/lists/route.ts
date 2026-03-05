import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { ActiveItem } from '@/lib/types';

export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('saved_lists')
    .select('id, created_at, item_count')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const { items } = await request.json() as { items: ActiveItem[] };
  const supabase = createClient();
  const { data, error } = await supabase
    .from('saved_lists')
    .insert({ items, item_count: items.length })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
