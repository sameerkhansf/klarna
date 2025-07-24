"use client";
import React, { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export const SupabaseContext = React.createContext(null);

export default function ClientRoot({
  children,
}: {
  children: React.ReactNode;
}) {
  const [supabaseClient] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );
  return (
    <SupabaseContext.Provider value={supabaseClient}>
      {children}
    </SupabaseContext.Provider>
  );
}
