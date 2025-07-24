"use client";

import React, { useState, useEffect } from "react";
import SettlementCard from "@/components/SettlementCard";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const filterOptions = [
  { label: "No Proof", value: "noProof" },
  { label: "Highest Payout", value: "highestPayout" },
  { label: "Expiring Soon", value: "expiringSoon" },
];

export default function SettlementsPage() {
  const user = useUser();
  const router = useRouter();
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user === null) {
      router.push("/login");
    }
  }, [user, router]);

  const fetchSettlements = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("settlements")
      .select("*")
      .order("deadline", { ascending: true });
    if (error) {
      setSettlements([]);
    } else {
      setSettlements(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchSettlements();
  }, [user]);

  const handleFetchFromFirecrawl = async () => {
    setFetching(true);
    setMessage(null);
    try {
      const firecrawlRes = await fetch("/api/settlements", {
        method: "GET",
      });
      if (!firecrawlRes.ok) {
        const err = await firecrawlRes.json();
        setMessage(err.error || "Failed to fetch settlements from Firecrawl");
        setFetching(false);
        return;
      }
      setMessage("Fetched and inserted settlements successfully.");
      await fetchSettlements();
    } catch (e) {
      setMessage("Error fetching settlements.");
    }
    setFetching(false);
  };

  if (!user) return null;
  if (loading) {
    return (
      <main className="max-w-md mx-auto pt-4 pb-20 px-2">
        <h1 className="text-2xl font-bold mb-4">Active Settlements</h1>
        <div>Loading...</div>
      </main>
    );
  }

  let filtered = settlements;
  if (activeFilter === "noProof") {
    filtered = filtered.filter((s) => !s.requires_proof);
  } else if (activeFilter === "highestPayout") {
    filtered = [...settlements].sort((a, b) => {
      // Sort by payout_max descending, fallback to payout_min
      const aMax = a.payout_max ?? a.payout_min ?? 0;
      const bMax = b.payout_max ?? b.payout_min ?? 0;
      return bMax - aMax;
    });
  } else if (activeFilter === "expiringSoon") {
    filtered = [...settlements].sort(
      (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    );
  }

  return (
    <main className="max-w-md mx-auto pt-4 pb-20 px-2">
      <h1 className="text-2xl font-bold mb-4">Active Settlements</h1>
      <button
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        onClick={handleFetchFromFirecrawl}
        disabled={fetching}
      >
        {fetching ? "Fetching from Firecrawl..." : "Fetch Real Settlements"}
      </button>
      {message && <div className="mb-4 text-sm text-red-600">{message}</div>}
      <div className="flex gap-2 mb-4">
        {filterOptions.map((f) => (
          <button
            key={f.value}
            className="focus:outline-none"
            onClick={() =>
              setActiveFilter(activeFilter === f.value ? null : f.value)
            }
          >
            <Badge variant={activeFilter === f.value ? "default" : "outline"}>
              {f.label}
            </Badge>
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-4">
        {filtered.length === 0 ? (
          <div>No settlements found.</div>
        ) : (
          filtered.map((s) => (
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
              onClaim={() => alert(`Claiming: ${s.title}`)}
            />
          ))
        )}
      </div>
    </main>
  );
}
