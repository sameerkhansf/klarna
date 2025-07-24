"use client";
import React from "react";

interface SettlementCardProps {
  title: string;
  description: string;
  payout: string;
  deadline: string;
  proofRequired: boolean;
}

export default function SettlementCard(props: SettlementCardProps) {
  return (
    <div className="card">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-brand-black mb-2">
          {props.title}
        </h3>
        <p className="text-gray-600 text-sm mb-4">{props.description}</p>
        <div className="flex justify-between items-center mb-4">
          <span className="font-bold text-brand-blue">{props.payout}</span>
          <span className="text-sm text-gray-500">Due: {props.deadline}</span>
        </div>
        {props.proofRequired && (
          <div className="mb-4">
            <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
              Proof Required
            </span>
          </div>
        )}
        <button
          onClick={() => alert(`Claiming: ${props.title}`)}
          className="btn-primary w-full"
        >
          Claim
        </button>
      </div>
    </div>
  );
}
