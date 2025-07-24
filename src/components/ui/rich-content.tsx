import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoCard } from "@/components/ui/InfoCard";
import { InlineCitation, Citation } from "@/components/ui/citation";
import { cleanEmbeddedCitations } from "@/lib/utils/textCleaning";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  ExternalLink,
  Lightbulb,
  Zap,
  Shield,
  Clock
} from "lucide-react";

// Rich Text with Citations
interface RichTextProps {
  children: React.ReactNode;
  citations?: Array<{
    section: string;
    url: string;
    title?: string;
    description?: string;
  }>;
  className?: string;
}

export const RichText: React.FC<RichTextProps> = ({
  children,
  citations = [],
  className,
}) => {
  // Clean embedded citations from text as a safeguard
  const cleanedContent = typeof children === 'string' 
    ? cleanEmbeddedCitations(children) 
    : children;

  return (
    <div className={cn("prose prose-sm max-w-none", className)}>
      {typeof cleanedContent === 'string' && citations.length > 0 ? (
        <InlineCitation text={cleanedContent} citations={citations} />
      ) : (
        cleanedContent
      )}
    </div>
  );
};

// Metric Display Component
interface MetricProps {
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  citation?: {
    url: string;
    title?: string;
    description?: string;
  };
  icon?: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md" | "lg";
}

export const Metric: React.FC<MetricProps> = ({
  label,
  value,
  change,
  trend = "neutral",
  citation,
  icon,
  variant = "default",
  size = "md",
}) => {
  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6"
  };

  const valueSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl"
  };

  const variantClasses = {
    default: "bg-gray-50 border-gray-200",
    success: "bg-green-50 border-green-200",
    warning: "bg-yellow-50 border-yellow-200",
    danger: "bg-red-50 border-red-200",
    info: "bg-blue-50 border-blue-200"
  };

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <Card className={cn("relative", variantClasses[variant])}>
      <CardContent className={sizeClasses[size]}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {icon && <span className="text-gray-600">{icon}</span>}
              <p className="text-sm font-medium text-gray-600">{label}</p>
              {citation && (
                <Citation
                  number={1}
                  url={citation.url}
                  title={citation.title}
                  description={citation.description}
                  inline={true}
                />
              )}
            </div>
            <p className={cn("font-bold text-gray-900", valueSizes[size])}>
              {value}
            </p>
            {change && (
              <div className="flex items-center gap-1 mt-1">
                {getTrendIcon()}
                <span className={cn(
                  "text-sm font-medium",
                  trend === "up" ? "text-green-600" : 
                  trend === "down" ? "text-red-600" : "text-gray-600"
                )}>
                  {change}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Highlight Box Component
interface HighlightBoxProps {
  type: "insight" | "risk" | "opportunity" | "milestone" | "warning";
  title: string;
  children: React.ReactNode;
  citations?: Array<{
    section: string;
    url: string;
    title?: string;
    description?: string;
  }>;
  className?: string;
}

export const HighlightBox: React.FC<HighlightBoxProps> = ({
  type,
  title,
  children,
  citations = [],
  className,
}) => {
  const typeConfig = {
    insight: {
      icon: <Lightbulb className="h-5 w-5" />,
      className: "border-blue-200 bg-blue-50",
      titleColor: "text-blue-900",
      iconColor: "text-blue-600"
    },
    risk: {
      icon: <AlertTriangle className="h-5 w-5" />,
      className: "border-red-200 bg-red-50",
      titleColor: "text-red-900",
      iconColor: "text-red-600"
    },
    opportunity: {
      icon: <Target className="h-5 w-5" />,
      className: "border-green-200 bg-green-50",
      titleColor: "text-green-900",
      iconColor: "text-green-600"
    },
    milestone: {
      icon: <CheckCircle className="h-5 w-5" />,
      className: "border-purple-200 bg-purple-50",
      titleColor: "text-purple-900",
      iconColor: "text-purple-600"
    },
    warning: {
      icon: <Shield className="h-5 w-5" />,
      className: "border-orange-200 bg-orange-50",
      titleColor: "text-orange-900",
      iconColor: "text-orange-600"
    }
  };

  const config = typeConfig[type];

  return (
    <Alert className={cn(config.className, className)}>
      <div className={config.iconColor}>
        {config.icon}
      </div>
      <AlertTitle className={config.titleColor}>
        {title}
        {citations.length > 0 && (
          <span className="ml-2">
            {citations.map((citation, index) => (
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
      </AlertTitle>
      <AlertDescription>
        <RichText citations={citations}>
          {children}
        </RichText>
      </AlertDescription>
    </Alert>
  );
};

// Progress Indicator Component
interface ProgressIndicatorProps {
  label: string;
  current: number;
  total: number;
  unit?: string;
  variant?: "default" | "success" | "warning" | "danger";
  showPercentage?: boolean;
  citation?: {
    url: string;
    title?: string;
    description?: string;
  };
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  label,
  current,
  total,
  unit = "",
  variant = "default",
  showPercentage = true,
  citation,
}) => {
  const percentage = Math.min((current / total) * 100, 100);
  
  const variantClasses = {
    default: "bg-blue-500",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500"
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-700">{label}</span>
          {citation && (
            <Citation
              number={1}
              url={citation.url}
              title={citation.title}
              description={citation.description}
              inline={true}
            />
          )}
        </div>
        <span className="text-gray-600">
          {current.toLocaleString()}{unit} / {total.toLocaleString()}{unit}
          {showPercentage && ` (${percentage.toFixed(1)}%)`}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={cn("h-2 rounded-full transition-all duration-300", variantClasses[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Comparison Table Component
interface ComparisonItem {
  label: string;
  company: string;
  competitor: string;
  advantage?: "company" | "competitor" | "neutral";
  citation?: {
    url: string;
    title?: string;
    description?: string;
  };
}

interface ComparisonTableProps {
  title: string;
  companyName: string;
  competitorName: string;
  items: ComparisonItem[];
  className?: string;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  title,
  companyName,
  competitorName,
  items,
  className,
}) => {
  const getAdvantageIcon = (advantage?: string) => {
    switch (advantage) {
      case "company":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "competitor":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium text-gray-600">Metric</th>
                <th className="text-left py-2 font-medium text-gray-600">{companyName}</th>
                <th className="text-left py-2 font-medium text-gray-600">{competitorName}</th>
                <th className="text-center py-2 font-medium text-gray-600">Advantage</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      {item.label}
                      {item.citation && (
                        <Citation
                          number={1}
                          url={item.citation.url}
                          title={item.citation.title}
                          description={item.citation.description}
                          inline={true}
                        />
                      )}
                    </div>
                  </td>
                  <td className="py-3 text-gray-600">{item.company}</td>
                  <td className="py-3 text-gray-600">{item.competitor}</td>
                  <td className="py-3 text-center">{getAdvantageIcon(item.advantage)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

// Timeline Component
interface TimelineItem {
  date: string;
  title: string;
  description: string;
  type?: "milestone" | "funding" | "product" | "market";
  citation?: {
    url: string;
    title?: string;
    description?: string;
  };
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({
  items,
  className,
}) => {
  const getTypeIcon = (type: string = "milestone") => {
    switch (type) {
      case "funding":
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case "product":
        return <Zap className="h-4 w-4 text-blue-600" />;
      case "market":
        return <TrendingUp className="h-4 w-4 text-purple-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {items.map((item, index) => (
        <div key={index} className="relative flex gap-4">
          {index < items.length - 1 && (
            <div className="absolute left-6 top-8 w-px h-full bg-gray-200" />
          )}
          <div className="flex items-center justify-center w-12 h-12 bg-white border-2 border-gray-200 rounded-full shrink-0">
            {getTypeIcon(item.type)}
          </div>
          <div className="flex-1 min-w-0 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                {item.date}
              </Badge>
              {item.citation && (
                <Citation
                  number={1}
                  url={item.citation.url}
                  title={item.citation.title}
                  description={item.citation.description}
                  inline={true}
                />
              )}
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
            <p className="text-sm text-gray-600">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};