"use client";

import React, { useState } from "react";
import SettlementCard from "@/components/SettlementCard";
import { Badge } from "@/components/ui/badge";

const mockSettlements = [
  {
    id: 1,
    title: "Brand X Data Breach",
    payout: "$50 - $200",
    deadline: "2024-08-15",
    proofRequired: false,
    description:
      "If you purchased Brand X products, you may be eligible for compensation.",
  },
  {
    id: 2,
    title: "Product Y False Advertising",
    payout: "$10 - $30",
    deadline: "2024-07-01",
    proofRequired: true,
    description:
      "Product Y customers can claim a payout for false advertising.",
  },
  {
    id: 3,
    title: "Service Z Overcharge",
    payout: "$100+",
    deadline: "2024-06-30",
    proofRequired: false,
    description: "Service Z users who were overcharged are eligible.",
  },
];

const filterOptions = [
  { label: "No Proof", value: "noProof" },
  { label: "Highest Payout", value: "highestPayout" },
  { label: "Expiring Soon", value: "expiringSoon" },
];

export default function SettlementsPage() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  let filtered = mockSettlements;
  if (activeFilter === "noProof") {
    filtered = filtered.filter((s) => !s.proofRequired);
  } else if (activeFilter === "highestPayout") {
    filtered = [
      mockSettlements[2],
      ...mockSettlements.filter((s) => s.id !== 3),
    ];
  } else if (activeFilter === "expiringSoon") {
    filtered = [...mockSettlements].sort(
      (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    );
  }

  return (
    <main className="max-w-md mx-auto pt-4 pb-20 px-2">
      <h1 className="text-2xl font-bold mb-4">Active Settlements</h1>
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
        {filtered.map((s) => (
          <SettlementCard
            key={s.id}
            title={s.title}
            description={s.description}
            payout={s.payout}
            deadline={s.deadline}
            proofRequired={s.proofRequired}
            onClaim={() => alert(`Claiming: ${s.title}`)}
          />
        ))}
      </div>
    </main>
  );
}
