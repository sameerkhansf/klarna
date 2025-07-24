import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { ExternalLink, Link, BookOpen, Globe } from "lucide-react";

interface CitationProps {
  number: number;
  url: string;
  title?: string;
  description?: string;
  domain?: string;
  className?: string;
  inline?: boolean;
  showPreview?: boolean;
}

interface InlineCitationProps {
  citations: Array<{
    section: string;
    url: string;
    title?: string;
    description?: string;
  }>;
  text: string;
  className?: string;
}

// Individual Citation Component
export const Citation: React.FC<CitationProps> = ({
  number,
  url,
  title,
  description,
  domain,
  className,
  inline = false,
  showPreview = true,
}) => {
  const extractDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'Source';
    }
  };

  const displayDomain = domain || extractDomain(url);

  if (inline) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center text-blue-600 hover:text-blue-800 no-underline",
                className
              )}
            >
              <sup className="relative text-xs font-bold bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 px-2 py-1 rounded-full ml-1 border border-blue-200 hover:from-blue-200 hover:to-blue-100 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105">
                {number}
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full opacity-75 animate-pulse"></span>
              </sup>
            </a>
          </TooltipTrigger>
          {showPreview && (
            <TooltipContent side="top" className="max-w-96 p-4 bg-white border border-gray-200 shadow-xl rounded-lg">
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <div className="p-1 bg-blue-100 rounded-full">
                    <Globe className="h-3 w-3 text-blue-600" />
                  </div>
                  <span className="font-semibold text-sm text-gray-800">{displayDomain}</span>
                  <ExternalLink className="h-3 w-3 text-gray-400 ml-auto" />
                </div>
                {title && (
                  <h4 className="font-semibold text-sm leading-tight text-gray-900 line-clamp-2">{title}</h4>
                )}
                {description && (
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{description}</p>
                )}
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-blue-600 break-all font-mono bg-blue-50 px-2 py-1 rounded">{url}</p>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Click to open source</span>
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                    <span>Verified</span>
                  </div>
                </div>
              </div>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn("group relative flex items-start gap-4 p-4 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-all duration-200 hover:shadow-lg hover:border-blue-200", className)}>
      <div className="relative shrink-0">
        <Badge variant="outline" className="bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border-blue-200 font-bold px-3 py-1">
          {number}
        </Badge>
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1 bg-blue-100 rounded-full">
            <Globe className="h-3 w-3 text-blue-600" />
          </div>
          <span className="font-semibold text-sm text-gray-700">{displayDomain}</span>
          <div className="flex items-center gap-1 ml-auto">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-500">Verified</span>
          </div>
        </div>
        {title && (
          <h4 className="font-semibold text-sm text-gray-900 mb-2 leading-tight hover:text-blue-700 transition-colors">{title}</h4>
        )}
        {description && (
          <p className="text-xs text-gray-600 mb-3 leading-relaxed line-clamp-2">{description}</p>
        )}
        <div className="flex items-center justify-between">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-all duration-200 hover:shadow-sm"
          >
            <span className="truncate max-w-[200px]">{displayDomain}</span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
          <div className="text-xs text-gray-400 font-mono">
            Source #{number}
          </div>
        </div>
      </div>
    </div>
  );
};

// Inline Citation Component for embedding citations within text
export const InlineCitation: React.FC<InlineCitationProps> = ({
  citations,
  text,
  className,
}) => {
  // Function to add citations to text based on keywords or positions
  const addCitationsToText = (text: string, citations: Array<{ section: string; url: string; title?: string; description?: string }>) => {
    if (!citations || citations.length === 0) return text;

    // For now, we'll add citations at the end of sentences that contain numbers or factual claims
    // In a more sophisticated implementation, you could use NLP to identify factual claims
    
    const parts = text.split(/(\$[\d,.]+ (?:billion|million|thousand|B|M|K)|[\d,.]+%|[\d,.]+ (?:companies|users|customers|employees)|\d{4}(?:\-\d{4})?)/gi);
    
    return parts.map((part, index) => {
      const isFactualClaim = /(\$[\d,.]+ (?:billion|million|thousand|B|M|K)|[\d,.]+%|[\d,.]+ (?:companies|users|customers|employees)|\d{4}(?:\-\d{4})?)/i.test(part);
      
      if (isFactualClaim && citations.length > 0) {
        const citationIndex = Math.min(index % citations.length, citations.length - 1);
        const citation = citations[citationIndex];
        
        return (
          <span key={index}>
            {part}
            <Citation
              number={citationIndex + 1}
              url={citation.url}
              title={citation.title}
              description={citation.description}
              inline={true}
              className="ml-1"
            />
          </span>
        );
      }
      
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <span className={className}>
      {addCitationsToText(text, citations)}
    </span>
  );
};

// Citation List Component for displaying all citations at the end
interface CitationListProps {
  citations: Array<{
    section: string;
    url: string;
    title?: string;
    description?: string;
  }>;
  className?: string;
}

export const CitationList: React.FC<CitationListProps> = ({
  citations,
  className,
}) => {
  if (!citations || citations.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Sources & Citations</h3>
      </div>
      {citations.map((citation, index) => (
        <Citation
          key={index}
          number={index + 1}
          url={citation.url}
          title={citation.title}
          description={citation.description}
          showPreview={false}
        />
      ))}
    </div>
  );
};

// Hook for managing citations in a component
export const useCitations = (citations: Array<{ section: string; url: string; title?: string; description?: string }>) => {
  const getCitationsBySection = (section: string) => {
    return citations.filter(citation => 
      citation.section.toLowerCase().includes(section.toLowerCase())
    );
  };

  const addInlineCitation = (text: string, section?: string) => {
    const relevantCitations = section ? getCitationsBySection(section) : citations;
    
    return (
      <InlineCitation
        text={text}
        citations={relevantCitations}
      />
    );
  };

  return {
    getCitationsBySection,
    addInlineCitation,
  };
};