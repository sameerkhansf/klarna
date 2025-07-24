import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";

export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) redirect("/login");
  if (data?.user) redirect("/settlements");
  else redirect("/login");
  return null;
}
