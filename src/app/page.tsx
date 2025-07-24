import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";

export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) redirect("/login");
  if (data?.user) {
    // Check if user has completed onboarding
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("id", data.user.id)
      .single();
    if (profileError || !profile) {
      redirect("/onboarding");
    } else {
      redirect("/settlements");
    }
  } else redirect("/login");
  return null;
}
