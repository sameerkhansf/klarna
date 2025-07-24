import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  Download,
  FileText,
  MapPin,
  AlertTriangle,
  Target,
  Eye,
  Brain,
  Loader2,
  Info,
  Calendar,
  CheckCircle,
  XCircle,
  Zap,
  Tag,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { useAnalysisManagement } from "@/hooks/useAnalysisManagement";
import { useUserRole } from "@/hooks/useUserRole";
import { downloadPDF } from "@/utils/pdfUtils";
import { formatTimestamp } from "@/utils/formatUtils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Citation,
  CitationList,
  InlineCitation,
  useCitations,
} from "@/components/ui/citation";
import {
  RichText,
  Metric,
  HighlightBox,
  ProgressIndicator,
  ComparisonTable,
  Timeline,
} from "@/components/ui/rich-content";
import { InfoCard } from "@/components/ui/InfoCard";
import { GrowthRateChart } from "@/components/ui/GrowthRateChart";
import { CommentSection } from "@/components/CommentSectionWithAttachments";
import { CompanyChecklist } from "@/components/CompanyChecklist";
import {
  StatusSelector,
  type CompanyStatus,
} from "@/components/StatusSelector";
import { Company, CompanyAnalysis, Label } from "@/types/company.types";
import { InvestmentSummaryCard } from "@/components/InvestmentSummaryCard";
import { CompanyOverviewCard } from "@/components/CompanyOverviewCard";
import { getStatusColor } from "@/utils/statusUtils";
import {
  ThemedButton,
  ThemedIcon,
  ThemedTab,
} from "@/components/ui/themed-components";
import { getThemeColor, getThemeGradient } from "@/styles/theme";
import { LabelSelector } from "@/components/LabelSelector";
import { labelService } from "@/lib/labelService";
import {
  emailAutomationService,
  EmailTrigger,
} from "@/lib/emailAutomationService";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export const CompanyDetailsModal = ({
  company,
  isOpen,
  onClose,
  onStatusUpdate,
  onLabelsUpdate,
}: {
  company: Company;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (companyId: string, newStatus: CompanyStatus) => void;
  onLabelsUpdate: (companyId: string, labels: Label[]) => void;
}) => {
  const {
    analysis,
    analysisTimestamp,
    isAnalyzing,
    handleAnalyzeCompany,
    handleRerunAnalysis,
  } = useAnalysisManagement({ company, isOpen });

  const { role } = useUserRole();

  const [activeTab, setActiveTab] = useState<"overview" | "details">(
    "overview"
  );

  const [selectedLabels, setSelectedLabels] = useState<Label[]>(
    company.labels || []
  );
  const [isUpdatingLabels, setIsUpdatingLabels] = useState(false);
  const [emailConfirmDialog, setEmailConfirmDialog] = useState<{
    isOpen: boolean;
    trigger: EmailTrigger | null;
    labels?: Label[];
    newStatus?: string;
  }>({ isOpen: false, trigger: null });
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [previousStatus, setPreviousStatus] = useState<string>(
    company.status || ""
  );
  const [customRejectionMessage, setCustomRejectionMessage] =
    useState<string>("");

  const { toast } = useToast();

  // Load company labels when modal opens
  useEffect(() => {
    if (isOpen && company.id) {
      const loadLabels = async () => {
        try {
          const labels = await labelService.getCompanyLabels(company.id);
          setSelectedLabels(labels);
        } catch (error) {
          console.error("Error loading company labels:", error);
        }
      };
      loadLabels();
    }
  }, [isOpen, company.id]);

  // Citations hook for managing inline citations
  const { getCitationsBySection, addInlineCitation } = useCitations(
    analysis?.citations || []
  );

  const handleDownloadMemo = async () => {
    await downloadPDF(company, analysis);
  };

  // generatePDFContent function moved to utils/pdfUtils.ts
  const handleStatusChange = async (newStatus: Company["status"]) => {
    // Check for email automation triggers
    const trigger = await emailAutomationService.handleStatusEmailAutomation(
      company.id,
      newStatus,
      previousStatus
    );

    // If there's a triggered email, show confirmation dialog
    if (trigger && role === "admin") {
      setEmailConfirmDialog({
        isOpen: true,
        trigger: trigger,
        newStatus: newStatus,
      });
      return;
    }

    // Update status normally if no email triggers
    updateStatus(newStatus);
  };

  const updateStatus = (newStatus: Company["status"]) => {
    setPreviousStatus(newStatus || "");
    onStatusUpdate(company.id, newStatus);
  };

  const handleLabelsChange = async (labels: Label[]) => {
    const previousLabelNames = selectedLabels.map((label) => label.name);
    const newLabelNames = labels.map((label) => label.name);

    // Check for email automation triggers
    const triggeredEmails =
      await emailAutomationService.handleLabelEmailAutomation(
        company.id,
        newLabelNames,
        previousLabelNames
      );

    // If there are triggered emails, show confirmation dialog
    if (triggeredEmails.length > 0 && role === "admin") {
      setEmailConfirmDialog({
        isOpen: true,
        trigger: triggeredEmails[0], // Handle first trigger for now
        labels: labels,
      });
      if (triggeredEmails[0].emailType === "rejection") {
        const founderNames = company.founders.map((f) => f.name).join(" and ");
        setCustomRejectionMessage(
          getDefaultRejectionTemplate(founderNames, company.name)
        );
      }
      return;
    }

    // Update labels normally if no email triggers
    await updateLabels(labels);
  };

  const updateLabels = async (labels: Label[]) => {
    setSelectedLabels(labels);
    setIsUpdatingLabels(true);

    try {
      const labelIds = labels.map((label) => label.id);
      await labelService.updateCompanyLabels(company.id, labelIds);

      // Update the company object with new labels
      const updatedCompany = { ...company, labels };

      // Call the parent callback if provided
      if (onLabelsUpdate) {
        onLabelsUpdate(company.id, labels);
      }
    } catch (error) {
      console.error("Error updating company labels:", error);
      // Revert to previous state on error
      setSelectedLabels(company.labels || []);
    } finally {
      setIsUpdatingLabels(false);
    }
  };

  // Helper to get default rejection template with placeholders replaced
  function getDefaultRejectionTemplate(
    founderNames: string,
    companyName: string
  ) {
    return `Dear ${founderNames},\n\nThank you again for your interest in the MARL Accelerator program. We appreciate the effort you put into the application process.\n\nAfter careful consideration, we have decided not to move forward with your application at this time. This decision was not easy, as we received many strong applications, and the competition was tough.\n\nThe MARL program is highly competitive, and we only select a small number of startups per cohort to ensure we can provide the most focused support.\n\nWe encourage you to continue pursuing your vision and refining your startup as you continue to develop your product and reach your goals. Many successful companies have faced similar decisions and have gone on to achieve great things.\n\nWe wish you the best of luck with ${companyName} and your future endeavors!\n\n--\nBest regards,\nThe MARL Team`;
  }

  const handleSendEmail = async () => {
    if (!emailConfirmDialog.trigger) return;

    setIsSendingEmail(true);

    try {
      let result;

      if (emailConfirmDialog.trigger.emailType === "first-call") {
        result = await emailAutomationService.sendFirstCallEmail({
          companyId: company.id,
          schedulingLink: "https://id.teamcal.ai/t/marl/cohort-interview", // You can make this configurable
        });
      } else if (emailConfirmDialog.trigger.emailType === "rejection") {
        result = await emailAutomationService.sendRejectionEmail({
          companyId: company.id,
          customMessage: customRejectionMessage.trim()
            ? customRejectionMessage
            : undefined,
        });
      }

      if (result?.success) {
        toast({
          title: "Email sent successfully",
          description: `${
            emailConfirmDialog.trigger.emailType === "first-call"
              ? "First call invitation"
              : "Rejection"
          } email sent to founders.`,
        });

        // Update labels or status after successful email
        if (emailConfirmDialog.labels) {
          await updateLabels(emailConfirmDialog.labels);
        } else if (emailConfirmDialog.newStatus) {
          updateStatus(emailConfirmDialog.newStatus as Company["status"]);
        }
      } else {
        toast({
          title: "Failed to send email",
          description:
            result?.error || "An error occurred while sending the email.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        title: "Failed to send email",
        description: "An error occurred while sending the email.",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
      setEmailConfirmDialog({ isOpen: false, trigger: null });
    }
  };

  const handleSkipEmail = async () => {
    // Update labels or status without sending email
    if (emailConfirmDialog.labels) {
      await updateLabels(emailConfirmDialog.labels);
    } else if (emailConfirmDialog.newStatus) {
      updateStatus(emailConfirmDialog.newStatus as Company["status"]);
    }
    setEmailConfirmDialog({ isOpen: false, trigger: null });
  };

  // Log the analysis object for debugging
  if (analysis) {
    // eslint-disable-next-line no-console
    console.log("AI Analysis:", analysis);
  }

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex flex-col gap-3 pr-8">
              <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center">
                <ThemedIcon size="lg">
                  <Building2 />
                </ThemedIcon>
                {company.name} - Investment Memo
              </DialogTitle>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {analysis?.citations && analysis.citations.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {analysis.citations.length} Sources
                    </Badge>
                  )}
                  {analysisTimestamp && (
                    <Badge variant="outline" className="text-xs text-gray-600">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatTimestamp(analysisTimestamp)}
                    </Badge>
                  )}
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-2">
                  {isAnalyzing && (
                    <div className="flex items-center text-sm text-gray-500">
                      <ThemedIcon size="sm">
                        <Loader2 className="mr-2 animate-spin" />
                      </ThemedIcon>
                      Analyzing...
                    </div>
                  )}
                  {analysis && !isAnalyzing && (
                    <ThemedButton
                      onClick={handleRerunAnalysis}
                      size="sm"
                      variant="outline"
                    >
                      <ThemedIcon size="sm" className="text-white">
                        <Zap className="mr-2" />
                      </ThemedIcon>
                      Re-run Analysis
                    </ThemedButton>
                  )}
                  {!analysis && !isAnalyzing && (
                    <ThemedButton
                      onClick={() => handleAnalyzeCompany(false)}
                      size="sm"
                      variant="primary"
                    >
                      <ThemedIcon size="sm">
                        <Brain className="mr-2" />
                      </ThemedIcon>
                      Generate Analysis
                    </ThemedButton>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Tab Navigation */}
          <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
            <ThemedTab
              isActive={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
            >
              <ThemedIcon
                size="sm"
                className={activeTab === "overview" ? "text-white" : ""}
              >
                <Building2 className="mr-1.5" />
              </ThemedIcon>
              Overview
            </ThemedTab>
            <ThemedTab
              isActive={activeTab === "details"}
              onClick={() => setActiveTab("details")}
            >
              <ThemedIcon
                size="sm"
                className={activeTab === "details" ? "text-white" : ""}
              >
                <Brain className="mr-1.5" />
              </ThemedIcon>
              Detailed Analysis
            </ThemedTab>
          </div>

          <div className="space-y-6">
            {/* Overview Tab Content */}
            {activeTab === "overview" && (
              <>
                {/* Status Update Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>Investment Status</span>
                      <Badge className={getStatusColor(company.status)}>
                        {company.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Status Management */}
                    <div className="flex items-center space-x-4">
                      <label
                        htmlFor="status-select"
                        className="text-sm font-medium text-gray-600"
                      >
                        Update Status:
                      </label>
                      <StatusSelector
                        currentStatus={company.status}
                        onStatusChange={handleStatusChange}
                      />
                    </div>

                    {/* Label Management */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <ThemedIcon size="sm">
                          <Tag className="h-4 w-4" />
                        </ThemedIcon>
                        <label className="text-sm font-medium text-gray-600">
                          Manage Labels:
                        </label>
                        {isUpdatingLabels && (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                        )}
                      </div>
                      <LabelSelector
                        selectedLabels={selectedLabels}
                        onLabelsChange={handleLabelsChange}
                        className="w-full"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Company Overview */}
                <CompanyOverviewCard
                  company={company}
                  analysis={analysis}
                  isAnalyzing={isAnalyzing}
                />

                {/* Pitch Deck Section */}
                {company.pitchDeck && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Pitch Deck
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-4">
                      <span className="font-medium text-gray-900">
                        {company.pitchDeck.name}
                      </span>
                      <a
                        href={company.pitchDeck.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 text-white rounded hover:opacity-90 transition"
                        style={{
                          background: getThemeGradient("primary"),
                        }}
                        download
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </a>
                      <a
                        href={company.pitchDeck.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 bg-gray-100 rounded hover:bg-orange-50 transition border-2"
                        style={{
                          color: getThemeColor("primary.DEFAULT"),
                          borderColor: getThemeColor("primary.DEFAULT"),
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </a>
                    </CardContent>
                  </Card>
                )}

                {/* Custom Fields Section */}
                {/* {company.custom_fields && company.custom_fields.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Info className="h-5 w-5 mr-2 text-purple-600" />
                        Additional Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {company.custom_fields
                          .filter((field) => field.label && field.value)
                          .map((field, index) => (
                            <div key={index} className="space-y-1">
                              <p className="text-sm font-medium text-gray-600">
                                {field.label}
                              </p>
                              <p className="text-base text-gray-900 bg-gray-50 p-2 rounded border">
                                {field.value}
                              </p>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )} */}

                {/* Key Metrics - Enhanced with Rich UI */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Metric
                    label="Founders"
                    value={company.founders.length.toString()}
                    icon={<Users className="h-5 w-5" />}
                    variant="info"
                    citation={getCitationsBySection("team")[0]}
                  />
                  <Metric
                    label="Market Size"
                    value={
                      isAnalyzing
                        ? "Loading..."
                        : analysis?.marketAnalysis?.tamSamSom
                        ? analysis.marketAnalysis.tamSamSom.split(",")[0] // Extract TAM
                        : company.marketSize || "TBD"
                    }
                    icon={<TrendingUp className="h-5 w-5" />}
                    variant="success"
                    citation={getCitationsBySection("market")[0]}
                  />
                  <Metric
                    label="Current Revenue"
                    value={
                      isAnalyzing
                        ? "Loading..."
                        : analysis?.financials?.currentRevenue ||
                          company.revenue ||
                          "Not disclosed"
                    }
                    icon={<DollarSign className="h-5 w-5" />}
                    variant="default"
                    citation={getCitationsBySection("financial")[0]}
                  />
                </div>

                {/* Founder Details Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Users className="h-5 w-5 mr-2 text-blue-600" />
                      Founding Team
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {company.founders.map((founder, index) => {
                        // Get corresponding pitch deck founder data if available
                        const pitchDeckFounder =
                          analysis?.teamFounderFit?.founderBios?.[index];
                        return (
                          <li key={founder.name} className="flex items-center">
                            <Users className="h-4 w-4 mr-2 text-gray-500" />
                            {founder.linkedin ? (
                              <a
                                href={founder.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {pitchDeckFounder?.name || founder.name}
                              </a>
                            ) : (
                              <span className="font-medium">
                                {pitchDeckFounder?.name || founder.name}
                              </span>
                            )}
                            {pitchDeckFounder?.role && (
                              <span className="ml-2 text-gray-600">
                                - {pitchDeckFounder.role}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>
                </Card>

                {/* Investment Summary - Quick Overview */}
                {analysis?.recommendation && (
                  <InvestmentSummaryCard
                    recommendation={{
                      ...analysis.recommendation,
                      thought_summary:
                        analysis.thought_summary ||
                        (analysis as any).analysis_data?.thought_summary,
                    }}
                  />
                )}

                {/* Comment Section - Added right after Investment Summary */}
                <CommentSection companyId={company.id} />

                {/* Checklist Section - Only for viewers */}
                {role === "viewer" && (
                  <CompanyChecklist companyId={company.id} />
                )}
              </>
            )}

            {/* Details Tab Content (AI Investment Analysis) */}
            {activeTab === "details" && (
              <>
                {/* AI-Powered Investment Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Brain className="h-5 w-5 mr-2 text-purple-600" />
                      AI Investment Analysis
                      {isAnalyzing && (
                        <div className="ml-4 flex items-center text-sm text-gray-500">
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing with Gemini AI...
                        </div>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isAnalyzing && (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
                          <p className="text-gray-500">
                            Analyzing company data with Gemini AI...
                          </p>
                          <p className="text-sm text-gray-400 mt-2">
                            This may take up to 30 seconds
                          </p>
                        </div>
                      </div>
                    )}
                    {analysis && (
                      <>
                        {/* Executive Summary - Perplexity Style */}
                        {analysis.executiveSummary && (
                          <Card className="mb-6 border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50">
                            <CardHeader>
                              <CardTitle className="text-xl flex items-center">
                                <Target className="h-6 w-6 mr-2 text-blue-600" />
                                Executive Summary
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div>
                                <h4 className="font-semibold text-blue-900 mb-2">
                                  Investment Thesis
                                </h4>
                                <p className="text-gray-800 bg-white p-3 rounded border-l-2 border-blue-200">
                                  {analysis.executiveSummary.investmentThesis}
                                </p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                                    <TrendingUp className="h-4 w-4 mr-1" />
                                    Investment Highlights
                                  </h4>
                                  <ul className="space-y-1">
                                    {analysis.executiveSummary.investmentHighlights?.map(
                                      (highlight, i) => (
                                        <li
                                          key={i}
                                          className="flex items-start"
                                        >
                                          <span className="text-green-600 mr-2">
                                            ✓
                                          </span>
                                          <span className="text-sm text-gray-700">
                                            {highlight}
                                          </span>
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </div>

                                <div>
                                  <h4 className="font-semibold text-red-900 mb-2 flex items-center">
                                    <AlertTriangle className="h-4 w-4 mr-1" />
                                    Key Risks
                                  </h4>
                                  <ul className="space-y-1">
                                    {analysis.executiveSummary.keyRisks?.map(
                                      (risk, i) => (
                                        <li
                                          key={i}
                                          className="flex items-start"
                                        >
                                          <span className="text-red-600 mr-2">
                                            ⚠
                                          </span>
                                          <span className="text-sm text-gray-700">
                                            {risk}
                                          </span>
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              </div>

                              {analysis.executiveSummary.expectedReturn && (
                                <div className="bg-white p-3 rounded border">
                                  <h4 className="font-semibold text-purple-900 mb-1">
                                    Expected Return
                                  </h4>
                                  <p className="text-lg font-bold text-purple-700">
                                    {analysis.executiveSummary.expectedReturn}
                                  </p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )}

                        {/* 1. Problem & Solution */}
                        <Card className="mb-4">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                              Problem & Solution
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div>
                              <strong>Problem Statement:</strong>{" "}
                              {analysis.problemSolution?.problemStatement ||
                                "-"}
                            </div>
                            <div>
                              <strong>Solution Offered:</strong>{" "}
                              {analysis.problemSolution?.solutionOffered || "-"}
                            </div>
                            <div>
                              <strong>Why now?</strong>{" "}
                              {analysis.problemSolution?.whyNow || "-"}
                            </div>
                          </CardContent>
                        </Card>

                        {/* 2. Market Analysis - Enhanced */}
                        <Card className="mb-4">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                              <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
                              Market Analysis & Opportunity
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            {/* TAM/SAM/SOM Breakdown */}
                            {analysis.marketAnalysis?.tamSamSom && (
                              <HighlightBox
                                type="opportunity"
                                title="Market Size Analysis"
                                citations={getCitationsBySection("market")}
                              >
                                <RichText
                                  citations={getCitationsBySection("market")}
                                >
                                  {analysis.marketAnalysis.tamSamSom}
                                </RichText>
                              </HighlightBox>
                            )}

                            {/* Market Growth Rate Metric */}
                            {analysis.marketAnalysis?.growthRate && (
                              <Metric
                                label="Market Growth Rate"
                                value={analysis.marketAnalysis.growthRate}
                                trend="up"
                                icon={<TrendingUp className="h-5 w-5" />}
                                variant="success"
                                citation={getCitationsBySection("market")[0]}
                              />
                            )}

                            {/* Market Growth Rate Chart (Market Size Projection) */}
                            {analysis.marketAnalysis?.marketSizeStart &&
                              analysis.marketAnalysis?.cagr &&
                              analysis.marketAnalysis?.marketSizeEndYear &&
                              analysis.marketAnalysis?.marketSizeStartYear && (
                                <div className="my-4">
                                  <GrowthRateChart
                                    initialValue={
                                      parseFloat(
                                        analysis.marketAnalysis.marketSizeStart
                                      ) || 1000000
                                    }
                                    cagr={
                                      parseFloat(
                                        analysis.marketAnalysis.cagr
                                      ) || 12.6
                                    }
                                    years={
                                      parseInt(
                                        analysis.marketAnalysis
                                          .marketSizeEndYear
                                      ) -
                                      parseInt(
                                        analysis.marketAnalysis
                                          .marketSizeStartYear
                                      )
                                    }
                                    currency="USD"
                                  />
                                </div>
                              )}

                            {/* Market Drivers */}
                            {analysis.marketAnalysis?.marketDrivers &&
                              analysis.marketAnalysis.marketDrivers.length >
                                0 && (
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                    <Target className="h-4 w-4 mr-1 text-green-500" />
                                    Key Market Drivers
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {analysis.marketAnalysis.marketDrivers.map(
                                      (driver: string, index: number) => (
                                        <div
                                          key={index}
                                          className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-200"
                                        >
                                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                                          <span className="text-sm text-green-800">
                                            {driver}
                                          </span>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Market Trends */}
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">
                                Market Trends & Tailwinds
                              </h4>
                              <RichText
                                citations={getCitationsBySection("market")}
                                className="text-gray-700"
                              >
                                {analysis.marketAnalysis?.marketTrends ||
                                  "Market trend analysis pending"}
                              </RichText>
                            </div>

                            {/* Third-party Validation */}
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">
                                Third-party Validation
                              </h4>
                              <RichText
                                citations={getCitationsBySection("market")}
                                className="text-gray-700"
                              >
                                {analysis.marketAnalysis?.validation ||
                                  "Market validation research in progress"}
                              </RichText>
                            </div>

                            {/* Regulatory Environment */}
                            {analysis.marketAnalysis?.regulatoryEnvironment && (
                              <HighlightBox
                                type="warning"
                                title="Regulatory Environment"
                                citations={getCitationsBySection("regulatory")}
                              >
                                <RichText
                                  citations={getCitationsBySection(
                                    "regulatory"
                                  )}
                                >
                                  {
                                    analysis.marketAnalysis
                                      .regulatoryEnvironment
                                  }
                                </RichText>
                              </HighlightBox>
                            )}
                          </CardContent>
                        </Card>

                        {/* 3. Competitive Landscape - Enhanced */}
                        <Card className="mb-4">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                              <Target
                                className="h-5 w-5 mr-2"
                                style={{
                                  color: getThemeColor("primary.DEFAULT"),
                                }}
                              />
                              Competitive Landscape & Positioning
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            {/* Competitive Advantages */}
                            {analysis.competitiveLandscape
                              ?.competitiveAdvantages &&
                              analysis.competitiveLandscape
                                .competitiveAdvantages.length > 0 && (
                                <HighlightBox
                                  type="insight"
                                  title="Competitive Advantages"
                                  citations={getCitationsBySection(
                                    "competitive"
                                  )}
                                >
                                  <ul className="space-y-2">
                                    {analysis.competitiveLandscape.competitiveAdvantages.map(
                                      (advantage: string, index: number) => (
                                        <li
                                          key={index}
                                          className="flex items-start gap-2"
                                        >
                                          <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                                          <span className="text-sm">
                                            {advantage}
                                          </span>
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </HighlightBox>
                              )}

                            {/* Competitor Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Direct Competitors */}
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                  <XCircle className="h-4 w-4 mr-1 text-red-500" />
                                  Direct Competitors
                                </h4>
                                <div className="space-y-2">
                                  {analysis.competitiveLandscape?.directCompetitors?.map(
                                    (competitor: string, index: number) => (
                                      <Badge
                                        key={index}
                                        variant="destructive"
                                        className="mr-2"
                                      >
                                        {competitor}
                                      </Badge>
                                    )
                                  ) || (
                                    <span className="text-gray-500 text-sm">
                                      No direct competitors identified
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Indirect Competitors */}
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                  <Info className="h-4 w-4 mr-1 text-yellow-500" />
                                  Indirect Competitors
                                </h4>
                                <div className="space-y-2">
                                  {analysis.competitiveLandscape?.indirectCompetitors?.map(
                                    (competitor: string, index: number) => (
                                      <Badge
                                        key={index}
                                        variant="secondary"
                                        className="mr-2"
                                      >
                                        {competitor}
                                      </Badge>
                                    )
                                  ) || (
                                    <span className="text-gray-500 text-sm">
                                      No indirect competitors identified
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Competitor Funding Data */}
                            {analysis.competitiveLandscape?.competitorFunding &&
                              analysis.competitiveLandscape.competitorFunding
                                .length > 0 && (
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                    <DollarSign className="h-4 w-4 mr-1 text-green-500" />
                                    Competitor Funding Landscape
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {analysis.competitiveLandscape.competitorFunding.map(
                                      (funding: any, index: number) => (
                                        <div
                                          key={index}
                                          className="p-3 border rounded-lg bg-gray-50"
                                        >
                                          <div className="font-medium text-sm text-gray-900">
                                            {funding.company}
                                          </div>
                                          <div className="text-green-600 font-semibold">
                                            {funding.amount}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            {funding.year}
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Key Differentiation */}
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">
                                Key Differentiation
                              </h4>
                              <RichText
                                citations={getCitationsBySection("competitive")}
                                className="text-gray-700"
                              >
                                {analysis.competitiveLandscape
                                  ?.keyDifferentiation ||
                                  "Competitive differentiation analysis pending"}
                              </RichText>
                            </div>

                            {/* Market Position */}
                            {analysis.competitiveLandscape?.marketPosition && (
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2">
                                  Market Position
                                </h4>
                                <RichText
                                  citations={getCitationsBySection(
                                    "competitive"
                                  )}
                                  className="text-gray-700"
                                >
                                  {analysis.competitiveLandscape.marketPosition}
                                </RichText>
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* 4. Team & Founder Fit */}
                        <Card className="mb-4">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                              <Users className="h-5 w-5 mr-2 text-green-500" />
                              Team & Founder Fit
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div>
                              <strong>Founders:</strong>{" "}
                              <ul className="list-disc list-inside">
                                {Array.isArray(
                                  analysis.teamFounderFit?.founderBios
                                ) &&
                                analysis.teamFounderFit.founderBios.length ? (
                                  analysis.teamFounderFit.founderBios.map(
                                    (bio: any, i: number) =>
                                      typeof bio === "string" ? (
                                        <li key={i}>{bio}</li>
                                      ) : bio && typeof bio === "object" ? (
                                        <li key={i}>
                                          <strong>{bio.name}</strong>
                                          {bio.role ? ` - ${bio.role}` : ""}
                                        </li>
                                      ) : null
                                  )
                                ) : (
                                  <li>-</li>
                                )}
                              </ul>
                            </div>
                            <div>
                              <strong>Technical & domain strengths:</strong>{" "}
                              {analysis.teamFounderFit
                                ?.technicalDomainStrengths || "-"}
                            </div>
                            <div>
                              <strong>Prior founder-market fit:</strong>{" "}
                              {analysis.teamFounderFit?.priorFounderMarketFit ||
                                "-"}
                            </div>
                            <div>
                              <strong>Team compatibility & credibility:</strong>{" "}
                              {analysis.teamFounderFit?.teamCompatibility ||
                                "-"}
                            </div>
                          </CardContent>
                        </Card>

                        {/* 5. Product & Tech - Enhanced */}
                        <Card className="mb-4">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                              <Brain className="h-5 w-5 mr-2 text-purple-600" />
                              Product & Technology
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <strong>Product Stage:</strong>{" "}
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                                  {analysis.productTech?.productStage || "-"}
                                </span>
                              </div>
                              <div>
                                <strong>Technology Stack:</strong>{" "}
                                {analysis.productTech?.technologyStack || "-"}
                              </div>
                            </div>

                            <div>
                              <strong>Technical Defensibility:</strong>{" "}
                              <p className="mt-1 text-gray-700 bg-gray-50 p-2 rounded">
                                {analysis.productTech?.technicalDefensibility ||
                                  "-"}
                              </p>
                            </div>

                            <div>
                              <strong>IP & Moats:</strong>{" "}
                              <p className="mt-1 text-gray-700 bg-gray-50 p-2 rounded">
                                {analysis.productTech?.ipOrMoat || "-"}
                              </p>
                            </div>

                            {analysis.productTech?.scalabilityFactors &&
                              analysis.productTech.scalabilityFactors.length >
                                0 && (
                                <div>
                                  <strong>Scalability Factors:</strong>
                                  <ul className="mt-1 list-disc list-inside space-y-1">
                                    {analysis.productTech.scalabilityFactors.map(
                                      (factor, i) => (
                                        <li
                                          key={i}
                                          className="text-sm text-gray-700"
                                        >
                                          {factor}
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              )}

                            {analysis.productTech?.developmentTimeline && (
                              <div>
                                <strong>Development Timeline:</strong>{" "}
                                {analysis.productTech.developmentTimeline}
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* New Financials Section */}
                        {analysis.financials && (
                          <Card className="mb-4">
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center">
                                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                                Financial Analysis
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center p-3 bg-green-50 rounded">
                                  <div className="text-sm text-gray-600">
                                    Current Revenue
                                  </div>
                                  <div className="text-lg font-bold text-green-700">
                                    {analysis.financials.currentRevenue ||
                                      "TBD"}
                                  </div>
                                </div>
                                <div className="text-center p-3 bg-blue-50 rounded">
                                  <div className="text-sm text-gray-600">
                                    Gross Margins
                                  </div>
                                  <div className="text-lg font-bold text-blue-700">
                                    {analysis.financials.grossMargins || "TBD"}
                                  </div>
                                </div>
                                <div className="text-center p-3 bg-red-50 rounded">
                                  <div className="text-sm text-gray-600">
                                    Monthly Burn
                                  </div>
                                  <div className="text-lg font-bold text-red-700">
                                    {analysis.financials.burnRate || "TBD"}
                                  </div>
                                </div>
                              </div>

                              <div>
                                <strong>Revenue Model:</strong>{" "}
                                <p className="mt-1 text-gray-700">
                                  {analysis.financials.revenueModel || "-"}
                                </p>
                              </div>

                              <div>
                                <strong>Runway:</strong>{" "}
                                <span
                                  className="px-2 py-1 rounded"
                                  style={{
                                    backgroundColor: `${getThemeColor(
                                      "primary.DEFAULT"
                                    )}20`,
                                    color: getThemeColor("primary.DEFAULT"),
                                  }}
                                >
                                  {analysis.financials.runway || "TBD"}
                                </span>
                              </div>

                              {analysis.financials.keyMetrics &&
                                analysis.financials.keyMetrics.length > 0 && (
                                  <div>
                                    <strong>Key Metrics vs Benchmarks:</strong>
                                    <div className="mt-2 space-y-2">
                                      {analysis.financials.keyMetrics.map(
                                        (metric, i) => (
                                          <div
                                            key={i}
                                            className="flex justify-between items-center p-2 bg-gray-50 rounded"
                                          >
                                            <span className="font-medium">
                                              {metric.metric}
                                            </span>
                                            <div className="text-right">
                                              <div className="font-bold">
                                                {metric.value}
                                              </div>
                                              <div className="text-xs text-gray-500">
                                                {metric.benchmark}
                                              </div>
                                            </div>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}
                            </CardContent>
                          </Card>
                        )}

                        {/* 6. Go-To-Market Strategy */}
                        <Card className="mb-4">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                              <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                              Go-To-Market Strategy
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div>
                              <strong>Target customer:</strong>{" "}
                              {analysis.goToMarket?.targetCustomer || "-"}
                            </div>
                            <div>
                              <strong>Acquisition channels:</strong>{" "}
                              {analysis.goToMarket?.acquisitionChannels || "-"}
                            </div>
                            <div>
                              <strong>Early traction or pilots:</strong>{" "}
                              {analysis.goToMarket?.earlyTraction || "-"}
                            </div>
                          </CardContent>
                        </Card>

                        {/* 7. Risks & Red Flags */}
                        <Card className="mb-4">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                              Risks & Red Flags
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div>
                              <strong>Market risks:</strong>{" "}
                              {analysis.risksRedFlags?.marketRisks || "-"}
                            </div>
                            <div>
                              <strong>Execution risks:</strong>{" "}
                              {analysis.risksRedFlags?.executionRisks || "-"}
                            </div>
                            <div>
                              <strong>Team risks:</strong>{" "}
                              {analysis.risksRedFlags?.teamRisks || "-"}
                            </div>
                            <div>
                              <strong>Other concerns:</strong>{" "}
                              {analysis.risksRedFlags?.otherConcerns || "-"}
                            </div>
                          </CardContent>
                        </Card>

                        {/* 8. Exit Scenarios */}
                        <Card className="mb-4">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                              <Target className="h-5 w-5 mr-2 text-green-500" />
                              Exit Scenarios
                              {getCitationsBySection("exit").length > 0 && (
                                <span className="ml-2">
                                  {getCitationsBySection("exit")
                                    .slice(0, 1)
                                    .map((citation, index) => (
                                      <Citation
                                        key={index}
                                        number={index + 1}
                                        url={citation.url}
                                        title={citation.title}
                                        description={citation.description}
                                        inline={true}
                                      />
                                    ))}
                                </span>
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {analysis &&
                            analysis.exitScenarios &&
                            ["conservative", "moderate", "optimistic"].some(
                              (type) => analysis.exitScenarios[type]
                            ) ? (
                              <div className="flex flex-col md:flex-row gap-4 my-4">
                                {["conservative", "moderate", "optimistic"].map(
                                  (type, index) => {
                                    const colors = [
                                      {
                                        bg: "bg-yellow-50",
                                        border: "border-yellow-200",
                                        title: "text-yellow-800",
                                        accent: "text-yellow-600",
                                      },
                                      {
                                        bg: "bg-blue-50",
                                        border: "border-blue-200",
                                        title: "text-blue-800",
                                        accent: "text-blue-600",
                                      },
                                      {
                                        bg: "bg-green-50",
                                        border: "border-green-200",
                                        title: "text-green-800",
                                        accent: "text-green-600",
                                      },
                                    ];
                                    const color = colors[index];

                                    return (
                                      <div
                                        key={type}
                                        className={`flex-1 ${color.bg} border-2 ${color.border} rounded-xl shadow-lg p-4 flex flex-col items-start transform hover:scale-105 transition-transform duration-200`}
                                      >
                                        <div
                                          className={`font-bold text-lg capitalize mb-3 ${color.title} flex items-center`}
                                        >
                                          <Target className="h-5 w-5 mr-2" />
                                          {type} Case
                                        </div>
                                        <div className="mb-2 bg-white rounded-lg p-3 w-full">
                                          <div className="flex items-center mb-1">
                                            <DollarSign className="h-4 w-4 mr-1 text-gray-600" />
                                            <span className="font-semibold text-sm text-gray-700">
                                              Revenue Multiple
                                            </span>
                                          </div>
                                          <span
                                            className={`text-lg font-bold ${color.accent}`}
                                          >
                                            {analysis.exitScenarios[type]
                                              ?.multiple || "-"}
                                          </span>
                                        </div>

                                        <div className="mb-2 bg-white rounded-lg p-3 w-full">
                                          <div className="flex items-center mb-1">
                                            <TrendingUp className="h-4 w-4 mr-1 text-gray-600" />
                                            <span className="font-semibold text-sm text-gray-700">
                                              Investment Return
                                            </span>
                                          </div>
                                          <span className="text-lg font-bold text-green-700">
                                            {analysis.exitScenarios[type]
                                              ?.return || "-"}
                                          </span>
                                        </div>

                                        <div className="bg-white rounded-lg p-3 w-full">
                                          <div className="flex items-center mb-1">
                                            <Eye className="h-4 w-4 mr-1 text-gray-600" />
                                            <span className="font-semibold text-sm text-gray-700">
                                              Exit Scenario
                                            </span>
                                          </div>
                                          <span className="text-sm text-gray-600 leading-relaxed">
                                            {analysis.exitScenarios[type]
                                              ?.scenario || "-"}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            ) : (
                              <div>
                                <div>
                                  <strong>Likely Acquirers:</strong>{" "}
                                  {Array.isArray(
                                    analysis.exitScenarios.likelyAcquirers
                                  )
                                    ? analysis.exitScenarios.likelyAcquirers.join(
                                        ", "
                                      )
                                    : "-"}
                                </div>
                                <div>
                                  <strong>Comparable Exits:</strong>{" "}
                                  {Array.isArray(
                                    analysis.exitScenarios.comparableExits
                                  ) &&
                                  analysis.exitScenarios.comparableExits
                                    .length > 0 ? (
                                    <ul className="list-disc list-inside">
                                      {analysis.exitScenarios.comparableExits.map(
                                        (exit, idx) =>
                                          typeof exit === "object" &&
                                          exit !== null ? (
                                            <li key={idx}>
                                              {exit.valuation ? (
                                                <span>
                                                  <strong>Valuation:</strong>{" "}
                                                  {exit.valuation};{" "}
                                                </span>
                                              ) : null}
                                              {exit.year ? (
                                                <span>
                                                  <strong>Year:</strong>{" "}
                                                  {exit.year};{" "}
                                                </span>
                                              ) : null}
                                              {exit.acquirer ? (
                                                <span>
                                                  <strong>Acquirer:</strong>{" "}
                                                  {exit.acquirer}
                                                </span>
                                              ) : null}
                                            </li>
                                          ) : (
                                            <li key={idx}>{String(exit)}</li>
                                          )
                                      )}
                                    </ul>
                                  ) : (
                                    "-"
                                  )}
                                </div>
                                <div>
                                  <strong>Return Potential:</strong>{" "}
                                  {analysis.exitScenarios.returnPotential ||
                                    "-"}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* 9. Recommendation */}
                        <Card className="mb-4">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                              <Eye className="h-5 w-5 mr-2 text-blue-700" />
                              Recommendation
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="text-sm text-gray-600 mb-1">
                                  Investment Decision
                                </div>
                                <div className="text-xl font-bold text-blue-700">
                                  {analysis.recommendation?.summaryJudgment ||
                                    "-"}
                                </div>
                              </div>
                              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                                <div className="text-sm text-gray-600 mb-1">
                                  Investment Score
                                </div>
                                <div className="text-xl font-bold text-green-700">
                                  {(() => {
                                    const scoreValue =
                                      analysis.recommendation.investmentScore;
                                    if (
                                      scoreValue === null ||
                                      typeof scoreValue === "undefined"
                                    )
                                      return "-";
                                    const score = parseFloat(scoreValue as any);
                                    return !isNaN(score)
                                      ? `${score.toFixed(1)}/10`
                                      : "-";
                                  })()}
                                </div>
                              </div>
                              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                                <div className="text-sm text-gray-600 mb-1">
                                  Proposed Check
                                </div>
                                <div className="text-lg font-bold text-purple-700">
                                  {analysis.recommendation?.proposedCheck ||
                                    "-"}
                                </div>
                              </div>
                            </div>

                            <div>
                              <strong>Investment Rationale:</strong>
                              <p className="mt-2 text-gray-700 bg-gray-50 p-3 rounded">
                                {analysis.recommendation?.justification || "-"}
                              </p>
                            </div>

                            {/* Exit Scenarios Summary in Recommendation */}
                            {analysis.exitScenarios &&
                              ["conservative", "moderate", "optimistic"].some(
                                (type) => analysis.exitScenarios[type]
                              ) && (
                                <div>
                                  <strong>Return Scenarios:</strong>
                                  <div className="flex flex-col md:flex-row gap-3 mt-3">
                                    {[
                                      "conservative",
                                      "moderate",
                                      "optimistic",
                                    ].map((type) => (
                                      <div
                                        key={type}
                                        className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg shadow-sm p-3"
                                      >
                                        <div className="font-semibold text-sm capitalize mb-2 text-gray-800">
                                          {type} Case
                                        </div>
                                        <div className="text-sm">
                                          <div className="text-green-600 font-bold">
                                            {analysis.exitScenarios[type]
                                              ?.return || "-"}
                                          </div>
                                          <div className="text-gray-600 text-xs mt-1">
                                            {analysis.exitScenarios[type]
                                              ?.multiple || "-"}{" "}
                                            multiple
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                            {/* Key Milestones */}
                            {analysis.recommendation?.keyMilestones &&
                              analysis.recommendation.keyMilestones.length >
                                0 && (
                                <div>
                                  <strong>Key Milestones to Track:</strong>
                                  <ul className="mt-2 space-y-1">
                                    {analysis.recommendation.keyMilestones.map(
                                      (milestone, i) => (
                                        <li
                                          key={i}
                                          className="flex items-start gap-2"
                                        >
                                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                                          <span className="text-sm text-gray-700">
                                            {milestone}
                                          </span>
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              )}

                            {/* Follow-up Actions */}
                            {analysis.recommendation?.followUpActions &&
                              analysis.recommendation.followUpActions.length >
                                0 && (
                                <div>
                                  <strong>
                                    Recommended Follow-up Actions:
                                  </strong>
                                  <ul className="mt-2 space-y-1">
                                    {analysis.recommendation.followUpActions.map(
                                      (action, i) => (
                                        <li
                                          key={i}
                                          className="flex items-start gap-2"
                                        >
                                          <Target className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                                          <span className="text-sm text-gray-700">
                                            {action}
                                          </span>
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              )}
                          </CardContent>
                        </Card>

                        {/* Citations */}
                        {analysis?.citations &&
                          analysis.citations.length > 0 && (
                            <Card className="mb-4">
                              <CardHeader>
                                <CardTitle className="text-lg flex items-center">
                                  <Eye className="h-5 w-5 mr-2 text-blue-700" />
                                  Citations & Sources
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                <ul className="list-disc list-inside">
                                  {analysis.citations.map((citation, idx) => (
                                    <li key={idx}>
                                      <span className="font-semibold">
                                        {citation.section}:
                                      </span>{" "}
                                      <a
                                        href={citation.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 underline break-all"
                                      >
                                        {citation.url}
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                          )}
                      </>
                    )}
                    {!analysis && !isAnalyzing && (
                      <div className="text-center py-8 text-gray-500">
                        <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>
                          Click "Generate Analysis" to get AI-powered investment
                          insights
                        </p>
                        <p className="text-sm mt-2">
                          Powered by Google Gemini with web search capabilities
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <ThemedButton onClick={handleDownloadMemo} variant="primary">
                <ThemedIcon size="sm" className="text-white">
                  <Download className="mr-2" />
                </ThemedIcon>
                Download Full Memo
              </ThemedButton>
            </div>
          </div>
        </DialogContent>

        {/* Email Automation Confirmation Dialog */}
        <AlertDialog
          open={emailConfirmDialog.isOpen}
          onOpenChange={(open) =>
            !open && setEmailConfirmDialog({ isOpen: false, trigger: null })
          }
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Send{" "}
                {emailConfirmDialog.trigger?.emailType === "first-call"
                  ? "First Call Invitation"
                  : "Rejection"}{" "}
                Email?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {emailConfirmDialog.trigger?.emailType === "first-call"
                  ? `Would you like to send a first call invitation email to the founders of ${company.name}? This will invite them to schedule a 30-minute introductory call.`
                  : `Would you like to send a rejection email to the founders of ${company.name}? This will notify them that their application was not accepted.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            {emailConfirmDialog.trigger?.emailType === "rejection" && (
              <div className="mb-4">
                <label
                  htmlFor="custom-rejection-message"
                  className="block font-medium mb-1"
                >
                  Edit Rejection Email
                </label>
                <textarea
                  id="custom-rejection-message"
                  className="w-full border rounded p-2 text-sm min-h-[120px]"
                  value={customRejectionMessage}
                  onChange={(e) => setCustomRejectionMessage(e.target.value)}
                  placeholder="Edit the rejection email here..."
                />
                <div className="text-xs text-gray-500 mt-1">
                  You can personalize the message before sending. Placeholders:
                  (Name of founders), (Startup Name)
                </div>
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={handleSkipEmail}
                disabled={isSendingEmail}
              >
                Skip Email
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSendEmail}
                disabled={isSendingEmail}
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Email"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Dialog>
    </TooltipProvider>
  );
};
