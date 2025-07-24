import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import MissedPayoutClient from "./MissedPayoutClient";

export default async function MissedPayoutPage() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) redirect("/login");
  return <MissedPayoutClient />;
}
