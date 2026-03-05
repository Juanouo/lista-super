import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { parseLista, sectionsToMarkdown } from '@/lib/parse-lista';
import { Section } from '@/lib/types';

export async function GET() {
  let sections: Section[];

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('master_list')
      .select('sections')
      .eq('id', 1)
      .single();

    sections = (!error && data) ? data.sections as Section[] : parseLista();
  } catch {
    sections = parseLista();
  }

  const markdown = sectionsToMarkdown(sections);
  return new NextResponse(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': 'attachment; filename="lista-super.md"',
    },
  });
}
