import { NextResponse } from 'next/server';
import { parseLista } from '@/lib/parse-lista';

export async function GET() {
  return NextResponse.json(parseLista());
}
