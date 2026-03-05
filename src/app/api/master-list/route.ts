import { NextResponse } from 'next/server';
import { parseLista } from '@/lib/parse-lista';
import { createClient } from '@/lib/supabase';
import { Section } from '@/lib/types';

export async function GET() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('master_list')
      .select('sections')
      .eq('id', 1)
      .single();

    if (!error && data) {
      return NextResponse.json(data.sections as Section[]);
    }

    // Seed from markdown
    const sections = parseLista();
    await supabase.from('master_list').upsert({ id: 1, sections });
    return NextResponse.json(sections);
  } catch {
    // Fallback: parse from file if Supabase not configured
    const sections = parseLista();
    return NextResponse.json(sections);
  }
}

export async function PUT(request: Request) {
  try {
    const { sections } = await request.json() as { sections: Section[] };
    const supabase = createClient();
    const { error } = await supabase
      .from('master_list')
      .upsert({ id: 1, sections, updated_at: new Date().toISOString() });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
