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
      console.log('[master-list GET] Loaded from Supabase');
      return NextResponse.json(data.sections as Section[]);
    }

    // Seed from markdown
    console.warn('[master-list GET] Supabase error, seeding from markdown:', error);
    const sections = parseLista();
    await supabase.from('master_list').upsert({ id: 1, sections });
    return NextResponse.json(sections);
  } catch (e) {
    console.error('[master-list GET] Exception, falling back to markdown:', e);
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

    if (error) {
      console.error('[master-list PUT] Supabase error:', error);
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
