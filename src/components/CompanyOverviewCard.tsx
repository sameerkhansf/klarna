import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Zap, Loader2 } from "lucide-react";
import { RichText } from "@/components/ui/rich-content";
import { Company } from "@/types/company.types";
import { ThemedIcon, ThemedLoading } from "@/components/ui/themed-components";
import { getThemeColor } from "@/styles/theme";

interface CompanyOverviewCardProps {
  company: Company;
  analysis?: any;
  isAnalyzing?: boolean;
}

export const CompanyOverviewCard = ({ 
  company, 
  analysis, 
  isAnalyzing = false 
}: CompanyOverviewCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Building2 className="h-5 w-5 mr-2" />
          Company Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600">
              Industry
            </p>
            <p className="text-base text-gray-900">
              {company.industry}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">
              Funding Stage
            </p>
            <Badge variant="outline">{company.stage}</Badge>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">
              Funding Amount
            </p>
            <p className="text-base font-semibold text-gray-900">
              {company.fundingAmount}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">
              Upload Date
            </p>
            <p className="text-base text-gray-900">
              {new Date(company.uploadDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">
              Location
            </p>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1 text-gray-500" />
              <p className="text-base text-gray-900">
                {company.city}, {company.country}
              </p>
            </div>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">
            Description
          </p>
          <p className="text-base text-gray-900">
            {company.description}
          </p>
        </div>
        
        {/* AI Analysis Section - Enhanced Overview */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center">
            <ThemedIcon size="sm"><Zap className="mr-1" /></ThemedIcon>
            AI Analysis
          </h4>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Product Summary
              </p>
              {isAnalyzing ? (
                <div className="flex items-center space-x-2 mt-1">
                  <ThemedLoading size="sm" />
                  <span className="text-sm text-gray-500">
                    Analyzing product details...
                  </span>
                </div>
              ) : analysis?.companyOverview?.productSummary ? (
                <RichText 
                  citations={analysis.citations || []}
                  className="text-sm text-gray-800 mt-1"
                >
                  {analysis.companyOverview.productSummary}
                </RichText>
              ) : (
                <p className="text-sm text-gray-500 mt-1">
                  Product summary not available
                </p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600">
                Business Model
              </p>
              {isAnalyzing ? (
                <div className="flex items-center space-x-2 mt-1">
                  <ThemedLoading size="sm" />
                  <span className="text-sm text-gray-500">
                    Analyzing business model...
                  </span>
                </div>
              ) : analysis?.companyOverview?.businessModel ? (
                <RichText 
                  citations={analysis.citations || []}
                  className="text-sm text-gray-800 mt-1"
                >
                  {analysis.companyOverview.businessModel}
                </RichText>
              ) : (
                <p className="text-sm text-gray-500 mt-1">
                  Business model not available
                </p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600">
                Current Traction
              </p>
              {isAnalyzing ? (
                <div className="flex items-center space-x-2 mt-1">
                  <ThemedLoading size="sm" />
                  <span className="text-sm text-gray-500">
                    Analyzing traction metrics...
                  </span>
                </div>
              ) : analysis?.companyOverview?.currentTraction ? (
                <RichText 
                  citations={analysis.citations || []}
                  className="text-sm text-gray-800 mt-1"
                >
                  {analysis.companyOverview.currentTraction}
                </RichText>
              ) : (
                <p className="text-sm text-gray-500 mt-1">
                  Traction information not available
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};