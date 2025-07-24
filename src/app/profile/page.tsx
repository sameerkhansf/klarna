import React, { useState } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const payoutOptions = [
  { label: "PayPal", value: "paypal" },
  { label: "Venmo", value: "venmo" },
  { label: "Check", value: "check" },
];

export default function ProfilePage() {
  const user = useUser();
  const router = useRouter();
  useEffect(() => {
    if (user === null) {
      router.push("/login");
    }
  }, [user, router]);
  if (!user) return null;
  const [method, setMethod] = useState("paypal");
  const [details, setDetails] = useState("");

  return (
    <main className="max-w-md mx-auto pt-8 pb-20 px-4">
      <h1 className="text-2xl font-bold mb-6">Payout Preferences</h1>
      <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4">
        <div>
          <label className="block font-medium mb-2">
            Select payout method:
          </label>
          <div className="flex gap-4 mb-2">
            {payoutOptions.map((opt) => (
              <button
                key={opt.value}
                className={`px-4 py-2 rounded-full border font-semibold transition ${
                  method === opt.value
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-gray-100 text-gray-700 border-gray-200"
                }`}
                onClick={() => setMethod(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block font-medium mb-2">
            {method === "check" ? "Mailing Address" : "Account/Email"}:
          </label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            placeholder={
              method === "check"
                ? "Enter your mailing address"
                : "Enter your account/email"
            }
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
        </div>
        <button className="bg-blue-600 text-white px-6 py-2 rounded font-semibold text-lg hover:bg-blue-700 transition">
          Save Preferences
        </button>
      </div>
    </main>
  );
}
