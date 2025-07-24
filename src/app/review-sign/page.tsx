import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import ReviewSignClient from "./ReviewSignClient";

export default async function ReviewSignPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) redirect("/login");
  return <ReviewSignClient />;
}
