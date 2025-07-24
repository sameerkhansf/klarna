import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  ChevronRight,
  Check,
  Circle,
  Building2,
  Phone,
  PhoneCall,
  Cpu,
  FileCheck,
  ClipboardCheck,
  PenTool,
  DollarSign,
  XCircle,
  Archive
} from 'lucide-react';

export type CompanyStatus = 
  | "Not Reviewed" 
  | "In-Review" 
  | "Studio Fit" 
  | "1st Call Done" 
  | "2nd Call Done" 
  | "Tech DD Stage" 
  | "Ready for PA" 
  | "Exhibit B DD" 
  | "Stage SAFE Signed" 
  | "Funded" 
  | "Rejected" 
  | "Archived";

interface StatusSelectorProps {
  currentStatus: CompanyStatus;
  onStatusChange: (status: CompanyStatus) => void;
  className?: string;
}

const getStatusIcon = (status: CompanyStatus) => {
  switch (status) {
    case "Not Reviewed":
      return <Circle className="h-4 w-4" />;
    case "In-Review":
      return <Building2 className="h-4 w-4" />;
    case "Studio Fit":
      return <Building2 className="h-4 w-4" />;
    case "1st Call Done":
      return <Phone className="h-4 w-4" />;
    case "2nd Call Done":
      return <PhoneCall className="h-4 w-4" />;
    case "Tech DD Stage":
      return <Cpu className="h-4 w-4" />;
    case "Ready for PA":
      return <FileCheck className="h-4 w-4" />;
    case "Exhibit B DD":
      return <ClipboardCheck className="h-4 w-4" />;
    case "Stage SAFE Signed":
      return <PenTool className="h-4 w-4" />;
    case "Funded":
      return <DollarSign className="h-4 w-4" />;
    case "Rejected":
      return <XCircle className="h-4 w-4" />;
    case "Archived":
      return <Archive className="h-4 w-4" />;
    default:
      return <Circle className="h-4 w-4" />;
  }
};

const getStatusColor = (status: CompanyStatus) => {
  switch (status) {
    case "Funded":
      return "bg-green-100 text-green-800 border-green-200";
    case "In-Review":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "Studio Fit":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "1st Call Done":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "2nd Call Done":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "Tech DD Stage":
      return "bg-cyan-100 text-cyan-800 border-cyan-200";
    case "Ready for PA":
      return "bg-teal-100 text-teal-800 border-teal-200";
    case "Exhibit B DD":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "Stage SAFE Signed":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "Not Reviewed":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "Rejected":
      return "bg-red-100 text-red-800 border-red-200";
    case "Archived":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const reviewStages: CompanyStatus[] = [
  "Studio Fit",
  "1st Call Done", 
  "2nd Call Done",
  "Tech DD Stage",
  "Ready for PA",
  "Exhibit B DD",
  "Stage SAFE Signed"
];

const mainStatuses: CompanyStatus[] = [
  "Not Reviewed",
  "In-Review",
  "Funded",
  "Rejected",
  "Archived"
];

export const StatusSelector: React.FC<StatusSelectorProps> = ({
  currentStatus,
  onStatusChange,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showReviewStages, setShowReviewStages] = useState(
    reviewStages.includes(currentStatus)
  );

  const handleStatusClick = (status: CompanyStatus) => {
    if (status === "In-Review") {
      setShowReviewStages(!showReviewStages);
      return;
    }
    onStatusChange(status);
    setIsOpen(false);
    if (!reviewStages.includes(status)) {
      setShowReviewStages(false);
    }
  };

  const isReviewStage = reviewStages.includes(currentStatus);

  return (
    <div className={`relative ${className}`}>
      {/* Current Status Display */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-48 justify-between ${getStatusColor(currentStatus)}`}
      >
        <div className="flex items-center">
          {getStatusIcon(currentStatus)}
          <span className="ml-2">{currentStatus}</span>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <Card className="absolute top-full left-0 w-64 mt-1 z-50 shadow-lg border">
          <CardContent className="p-2">
            <div className="space-y-1">
              {/* Main Statuses */}
              {mainStatuses.map((status) => (
                <div key={status}>
                  <Button
                    variant="ghost"
                    onClick={() => handleStatusClick(status)}
                    className={`w-full justify-start text-left ${
                      currentStatus === status && !isReviewStage ? 'bg-gray-100' : ''
                    }`}
                  >
                    <div className="flex items-center w-full">
                      {getStatusIcon(status)}
                      <span className="ml-2 flex-1">{status}</span>
                      {currentStatus === status && !isReviewStage && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                      {status === "In-Review" && (
                        <ChevronRight className={`h-4 w-4 transition-transform ${showReviewStages ? 'rotate-90' : ''}`} />
                      )}
                    </div>
                  </Button>

                  {/* Review Stages Sub-menu */}
                  {status === "In-Review" && showReviewStages && (
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-3">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                        Review Process
                      </div>
                      {reviewStages.map((reviewStatus) => (
                        <Button
                          key={reviewStatus}
                          variant="ghost"
                          onClick={() => handleStatusClick(reviewStatus)}
                          className={`w-full justify-start text-left text-sm ${
                            currentStatus === reviewStatus ? 'bg-gray-100' : ''
                          }`}
                        >
                          <div className="flex items-center w-full">
                            {getStatusIcon(reviewStatus)}
                            <span className="ml-2 flex-1">{reviewStatus}</span>
                            {currentStatus === reviewStatus && (
                              <Check className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};