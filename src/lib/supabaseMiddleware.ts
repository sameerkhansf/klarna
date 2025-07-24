import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies as nextCookies } from 'next/headers';
import type { NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next();
  const cookieStore = await nextCookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );
  await supabase.auth.getUser();
  return response;
} 