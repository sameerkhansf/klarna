import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import ClaimClient from "./ClaimClient";

export default async function ClaimPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) redirect("/login");
  return <ClaimClient />;
}
