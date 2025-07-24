"use client";

import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { useState } from "react";

export default function ClientRoot({
  children,
}: {
  children: React.ReactNode;
}) {
  const [supabaseClient] = useState(() => createPagesBrowserClient());
  return (
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={null}
    >
      {children}
    </SessionContextProvider>
  );
}
