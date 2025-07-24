import React from "react";

interface SettlementCardProps {
  title: string;
  description: string;
  payout: string;
  deadline: string;
  proofRequired: boolean;
  onClaim: () => void;
}

const SettlementCard: React.FC<SettlementCardProps> = ({
  title,
  description,
  payout,
  deadline,
  proofRequired,
  onClaim,
}) => {
  return (
    <div className="card">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-brand-black mb-2">{title}</h3>
        <p className="text-gray-600 text-sm mb-4">{description}</p>
        <div className="flex justify-between items-center mb-4">
          <span className="font-bold text-brand-blue">{payout}</span>
          <span className="text-sm text-gray-500">Due: {deadline}</span>
        </div>
        {proofRequired && (
          <div className="mb-4">
            <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
              Proof Required
            </span>
          </div>
        )}
        <button onClick={onClaim} className="btn-primary w-full">
          File Claim
        </button>
      </div>
    </div>
  );
};

export default SettlementCard;
