import React from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { GeminiAnalyzer } from "@/lib/gemini";

interface InvestmentScoreBreakdownProps {
  teamScore: number;
  teamScoreMax?: number;
  tractionScore: number;
  tractionScoreMax?: number;
  marketScore: number;
  marketScoreMax?: number;
  totalScore: number;
  totalScoreMax?: number;
  subScores: {
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
}

export const InvestmentScoreBreakdown: React.FC<
  InvestmentScoreBreakdownProps
> = ({
  teamScore,
  teamScoreMax = GeminiAnalyzer.SCORING_MAX_VALUES.TEAM_SCORE_MAX,
  tractionScore,
  tractionScoreMax = GeminiAnalyzer.SCORING_MAX_VALUES.TRACTION_SCORE_MAX,
  marketScore,
  marketScoreMax = GeminiAnalyzer.SCORING_MAX_VALUES.MARKET_SCORE_MAX,
  totalScore,
  totalScoreMax = GeminiAnalyzer.SCORING_MAX_VALUES.TOTAL_SCORE_MAX,
  subScores,
}) => {
  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div>
                    <strong>Team Score (40%):</strong> {teamScore.toFixed(1)}
          {` out of ${teamScoreMax}`} <br />
          <span className="text-xs text-gray-500 flex gap-2 flex-wrap">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="underline cursor-help">E</span>
              </TooltipTrigger>
              <TooltipContent side="top">Experience</TooltipContent>
            </Tooltip>
            : {subScores.E},
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="underline cursor-help">T</span>
              </TooltipTrigger>
              <TooltipContent side="top">Teamwork</TooltipContent>
            </Tooltip>
            : {subScores.T},
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="underline cursor-help">I</span>
              </TooltipTrigger>
              <TooltipContent side="top">Industry Knowledge</TooltipContent>
            </Tooltip>
            : {subScores.I},
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="underline cursor-help">L</span>
              </TooltipTrigger>
              <TooltipContent side="top">Leadership</TooltipContent>
            </Tooltip>
            : {subScores.L}
          </span>
        </div>
        <div>
                    <strong>Traction Score (35%):</strong> {tractionScore.toFixed(1)}
          {` out of ${tractionScoreMax.toFixed(1)}`} <br />
          <span className="text-xs text-gray-500 flex gap-2 flex-wrap">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="underline cursor-help">P</span>
              </TooltipTrigger>
              <TooltipContent side="top">Product Progress</TooltipContent>
            </Tooltip>
            : {subScores.P},
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="underline cursor-help">C</span>
              </TooltipTrigger>
              <TooltipContent side="top">Customer Adoption</TooltipContent>
            </Tooltip>
            : {subScores.C},
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="underline cursor-help">Π</span>
              </TooltipTrigger>
              <TooltipContent side="top">Profitability</TooltipContent>
            </Tooltip>
            : {subScores.Pi}
          </span>
        </div>
        <div>
                    <strong>Market Score (25%):</strong> {marketScore.toFixed(1)}
          {` out of ${marketScoreMax}`} <br />
          <span className="text-xs text-gray-500 flex gap-2 flex-wrap">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="underline cursor-help">M</span>
              </TooltipTrigger>
              <TooltipContent side="top">Market Size</TooltipContent>
            </Tooltip>
            : {subScores.M},
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="underline cursor-help">G</span>
              </TooltipTrigger>
              <TooltipContent side="top">Growth Rate</TooltipContent>
            </Tooltip>
            : {subScores.G},
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="underline cursor-help">Comp</span>
              </TooltipTrigger>
              <TooltipContent side="top">Competition</TooltipContent>
            </Tooltip>
            : {subScores.Comp}
          </span>
        </div>
        <div>
                    <strong>Total Score:</strong> {totalScore.toFixed(1)}
          {` out of ${totalScoreMax.toFixed(1)}`} <br />
        </div>
        <div className="text-xs text-gray-400 mt-2">
          Formula based on{" "}
          <a
            href="/Downloads/startup_scoring_formulas.md"
            className="underline cursor-not-allowed"
            target="_blank"
            rel="noopener noreferrer"
          >
            Startup Scoring Model
          </a>
        </div>
        <div className="text-xs text-gray-400 mt-2">
          <strong>Score Transparency:</strong> Max values are based on the
          scoring formulas:
          <ul className="list-disc ml-4">
            <li>
              Team: {GeminiAnalyzer.SCORING_MAX_VALUES.TEAM_SCORE_MAX} (max E=3,
              T=3, I=4, L=1)
            </li>
            <li>
              Traction: {GeminiAnalyzer.SCORING_MAX_VALUES.TRACTION_SCORE_MAX}{" "}
              (max P=1, C=1, Π=5)
            </li>
            <li>
              Market: {GeminiAnalyzer.SCORING_MAX_VALUES.MARKET_SCORE_MAX} (max
              M=5, G=5, Comp=0)
            </li>
            <li>
              Total: {GeminiAnalyzer.SCORING_MAX_VALUES.TOTAL_SCORE_MAX}{" "}
              (weighted sum of above, see formula link)
            </li>
          </ul>
        </div>
      </div>
    </TooltipProvider>
  );
};
