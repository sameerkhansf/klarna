import { Card, CardContent } from "@/components/ui/card";
import { Building2, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { Company } from "@/types/company.types";
import { formatFundingShort } from "@/utils/formatUtils";
import { ThemedIcon } from "@/components/ui/themed-components";
import { getThemeColor } from "@/styles/theme";

interface StatsCardsProps {
  companies: Company[];
  totalFunding: number;
  averageFunding: number;
  getAllReviewStageCount: () => number;
}

export const StatsCards = ({ 
  companies, 
  totalFunding, 
  averageFunding, 
  getAllReviewStageCount 
}: StatsCardsProps) => {
  const fundedCount = companies.filter(company => company.status === "Funded").length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 xl:gap-6 mb-6 xl:mb-8">
      <Card className="bg-white/90 backdrop-blur-sm border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <CardContent className="p-4 lg:p-6">
          <div className="flex items-center">
            <div 
              className="p-3 rounded-xl shadow-sm" 
              style={{ 
                background: `linear-gradient(to bottom right, ${getThemeColor('primary.100')}, ${getThemeColor('primary.200')})` 
              }}
            >
              <ThemedIcon size="lg"><Building2 /></ThemedIcon>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Companies
              </p>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                {companies.length}
              </p>
              <p className="text-xs text-green-600 font-medium">
                +2 this week
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/90 backdrop-blur-sm border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <CardContent className="p-4 lg:p-6">
          <div className="flex items-center">
            <div 
              className="p-3 rounded-xl shadow-sm" 
              style={{ 
                background: `linear-gradient(to bottom right, ${getThemeColor('success.100')}, ${getThemeColor('success.200')})` 
              }}
            >
              <ThemedIcon color="success" size="lg"><TrendingUp /></ThemedIcon>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Funded
              </p>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                {fundedCount}
              </p>
              <p className="text-xs text-green-600 font-medium">
                {companies.length > 0 ? Math.round((fundedCount / companies.length) * 100) : 0}% success rate
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/90 backdrop-blur-sm border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <CardContent className="p-4 lg:p-6">
          <div className="flex items-center">
            <div 
              className="p-3 rounded-xl shadow-sm" 
              style={{ 
                background: `linear-gradient(to bottom right, ${getThemeColor('warning.100')}, ${getThemeColor('warning.200')})` 
              }}
            >
              <ThemedIcon color="warning" size="lg"><Calendar /></ThemedIcon>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                In Review
              </p>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                {getAllReviewStageCount()}
              </p>
              <p className="text-xs text-amber-600 font-medium">
                Avg 5 days
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/90 backdrop-blur-sm border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <CardContent className="p-4 lg:p-6">
          <div className="flex items-center">
            <div 
              className="p-3 rounded-xl shadow-sm" 
              style={{ 
                background: `linear-gradient(to bottom right, ${getThemeColor('primary.100')}, ${getThemeColor('primary.200')})` 
              }}
            >
              <ThemedIcon size="lg"><DollarSign /></ThemedIcon>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Funding
              </p>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                {formatFundingShort(totalFunding)}
              </p>
              <p className="text-xs text-purple-600 font-medium">
                {formatFundingShort(averageFunding)} average
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};