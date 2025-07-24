import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import React from "react";
import SettlementCard from "@/components/SettlementCard";
import { Badge } from "@/components/ui/badge";

const filterOptions = [
  { label: "No Proof", value: "noProof" },
  { label: "Highest Payout", value: "highestPayout" },
  { label: "Expiring Soon", value: "expiringSoon" },
];

export default async function SettlementsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) redirect("/login");
  const { data: settlements = [] } = await supabase
    .from("settlements")
    .select("*")
    .order("deadline", { ascending: true });

  // Filtering logic can be implemented client-side if needed
  return (
    <main className="max-w-md mx-auto pt-4 pb-20 px-2">
      <h1 className="text-2xl font-bold mb-4">Active Settlements</h1>
      <div className="flex gap-2 mb-4">
        {filterOptions.map((f) => (
          <Badge key={f.value} variant="outline">
            {f.label}
          </Badge>
        ))}
      </div>
      <div className="flex flex-col gap-4">
        {(settlements || []).length === 0 ? (
          <div>No settlements found.</div>
        ) : (
          (settlements || []).map((s: any) => (
            <SettlementCard
              key={s.id || s.title}
              title={s.title}
              description={s.description || ""}
              payout={
                s.payout_min && s.payout_max
                  ? `$${s.payout_min} - $${s.payout_max}`
                  : s.payout_min
                  ? `$${s.payout_min}+`
                  : s.payout_max
                  ? `$${s.payout_max}`
                  : "N/A"
              }
              deadline={s.deadline || "N/A"}
              proofRequired={!!s.requires_proof}
              claimUrl={s.claim_url || s.detail_url || "#"}
            />
          ))
        )}
      </div>
    </main>
  );
}
