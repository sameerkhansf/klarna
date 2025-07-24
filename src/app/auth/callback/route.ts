import { cookies as nextCookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
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
    await supabase.auth.exchangeCodeForSession(code);
    // Check onboarding after OAuth login
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("id", userData.user.id)
        .single();
      if (profileError || !profile) {
        return NextResponse.redirect(requestUrl.origin + "/onboarding");
      } else {
        return NextResponse.redirect(requestUrl.origin + "/settlements");
      }
    }
  }
  // Redirect to login if no user
  return NextResponse.redirect(requestUrl.origin + "/login");
} 