import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import React from "react";

const mockClaims = [
  { id: 1, title: "Brand X Data Breach", status: "Filed", payout: "$150" },
  {
    id: 2,
    title: "Product Y False Advertising",
    status: "Pending",
    payout: "$20",
  },
];

const statusColors: Record<string, string> = {
  Filed: "bg-blue-100 text-blue-800",
  Pending: "bg-yellow-100 text-yellow-800",
  Paid: "bg-green-100 text-green-800",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) redirect("/login");
  return (
    <main className="max-w-md mx-auto pt-8 pb-20 px-4">
      <h1 className="text-2xl font-bold mb-6">Your Claims</h1>
      <div className="flex flex-col gap-4">
        {mockClaims.map((claim) => (
          <div
            key={claim.id}
            className="bg-white rounded-xl shadow p-4 flex justify-between items-center"
          >
            <div>
              <div className="font-semibold text-gray-900">{claim.title}</div>
              <div className="text-sm text-gray-500">
                Estimated Payout:{" "}
                <span className="font-medium">{claim.payout}</span>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                statusColors[claim.status]
              }`}
            >
              {claim.status}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}
