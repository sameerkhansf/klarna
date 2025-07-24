import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";
import { ThemedIcon, ThemedCard } from "@/components/ui/themed-components";
import { getThemeColor, getThemeGradient } from "@/styles/theme";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { InvestmentScoreBreakdown } from "./InvestmentScoreBreakdown";
import { GeminiAnalyzer } from "@/lib/gemini";

interface InvestmentSummaryCardProps {
  recommendation: {
    summaryJudgment?: string;
    investmentScore?: number;
    proposedCheck?: string;
    justification?: string;
    scoreBreakdown?: {
      TeamScore: number;
      TractionScore: number;
      MarketScore: number;
      TotalScore: number;
      Normalized: number;
      E: number;
      T: number;
      I: number;
      L: number;
      P: number;
      C: number;
      Pi: number;
      M: number;
      G: number;
      Comp: number;
    };
    score_breakdown?: {
      TeamScore: number;
      TractionScore: number;
      MarketScore: number;
      TotalScore: number;
      Normalized: number;
      E: number;
      T: number;
      I: number;
      L: number;
      P: number;
      C: number;
      Pi: number;
      M: number;
      G: number;
      Comp: number;
    };
    thought_summary?: string;
  };
}

export const InvestmentSummaryCard = ({
  recommendation,
}: InvestmentSummaryCardProps) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const breakdown =
    recommendation.scoreBreakdown || recommendation.score_breakdown;
  const thoughtSummary = (recommendation.thought_summary ||
    (recommendation as any).thought_summary) as string | undefined;
  return (
    <Card
      className="border-2"
      style={{
        background: getThemeGradient("primaryLight"),
        borderColor: getThemeColor("primary.200"),
      }}
    >
      <CardHeader>
        <CardTitle
          className="text-lg flex items-center"
          style={{ color: getThemeColor("primary.DEFAULT") }}
        >
          <ThemedIcon>
            <Target className="mr-2" />
          </ThemedIcon>
          Investment Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div
            className="text-center p-4 bg-white rounded-lg border-2"
            style={{ borderColor: getThemeColor("primary.200") }}
          >
            <div className="text-sm text-gray-600 mb-1">
              Investment Decision
            </div>
            <div
              className="text-xl font-bold"
              style={{ color: getThemeColor("primary.DEFAULT") }}
            >
              {recommendation.summaryJudgment || "-"}
            </div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border border-green-200">
            <div className="text-sm text-gray-600 mb-1 flex items-center justify-center gap-2">
              Investment Score
              <button
                className="ml-2 text-xs text-blue-600 underline hover:text-blue-800"
                onClick={() => setShowBreakdown(true)}
                aria-label="View score breakdown"
              >
                View breakdown
              </button>
            </div>
            <div className="text-xl font-bold text-green-700">
              {(() => {
                const scoreValue = recommendation.investmentScore;
                if (scoreValue === null || typeof scoreValue === 'undefined') return '-';
                const score = parseFloat(scoreValue as any);
                return !isNaN(score) ? `${score.toFixed(1)}/10` : '-';
              })()}
            </div>
          </div>
          <div
            className="text-center p-4 bg-white rounded-lg border-2"
            style={{ borderColor: getThemeColor("primary.200") }}
          >
            <div className="text-sm text-gray-600 mb-1">Proposed Check</div>
            <div
              className="text-lg font-bold"
              style={{ color: getThemeColor("primary.dark") }}
            >
              {recommendation.proposedCheck || "-"}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-2">
            Investment Rationale:
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">
            {recommendation.justification || "Analysis in progress..."}
          </p>
        </div>

        {/* Score Breakdown Modal */}
        <Dialog open={showBreakdown} onOpenChange={setShowBreakdown}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Investment Score Breakdown</DialogTitle>
            </DialogHeader>
            {breakdown ? (
              <InvestmentScoreBreakdown
                teamScore={breakdown.TeamScore}
                teamScoreMax={GeminiAnalyzer.SCORING_MAX_VALUES.TEAM_SCORE_MAX}
                tractionScore={breakdown.TractionScore}
                tractionScoreMax={
                  GeminiAnalyzer.SCORING_MAX_VALUES.TRACTION_SCORE_MAX
                }
                marketScore={breakdown.MarketScore}
                marketScoreMax={
                  GeminiAnalyzer.SCORING_MAX_VALUES.MARKET_SCORE_MAX
                }
                totalScore={breakdown.TotalScore}
                totalScoreMax={
                  GeminiAnalyzer.SCORING_MAX_VALUES.TOTAL_SCORE_MAX
                }
                subScores={{
                  E: breakdown.E,
                  T: breakdown.T,
                  I: breakdown.I,
                  L: breakdown.L,
                  P: breakdown.P,
                  C: breakdown.C,
                  Pi: breakdown.Pi,
                  M: breakdown.M,
                  G: breakdown.G,
                  Comp: breakdown.Comp,
                }}
              />
            ) : (
              <div className="text-gray-500">
                Score breakdown not available for this analysis.
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Show AI Thought Process Button */}
        {thoughtSummary && (
          <div className="mt-4 flex justify-center">
            <button
              className="text-xs text-purple-700 underline hover:text-purple-900 px-2 py-1 rounded"
              onClick={() => setShowReasoning(true)}
              aria-label="Show AI Thought Process"
            >
              Show AI Thought Process
            </button>
          </div>
        )}

        {/* AI Thought Process Modal */}
        <Dialog open={showReasoning} onOpenChange={setShowReasoning}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>AI Thought Process & Analysis</DialogTitle>
            </DialogHeader>
            {thoughtSummary ? (
              <div>
                <div className="text-xs text-gray-500 mb-4 p-2 bg-gray-50 rounded">
                  Debug: Content length: {thoughtSummary.length} characters
                </div>
                <div className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                  {thoughtSummary}
                </div>
              </div>
            ) : (
              <div className="text-gray-500">
                No thought process or step-by-step analysis available for this
                investment evaluation.
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
