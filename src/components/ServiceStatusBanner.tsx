import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { healthService, HealthCheckResult, ServiceStatus } from '@/lib/healthService';

interface ServiceStatusBannerProps {
  className?: string;
}

export const ServiceStatusBanner: React.FC<ServiceStatusBannerProps> = ({
  className,
}) => {
  const [healthResult, setHealthResult] = useState<HealthCheckResult | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const handleHealthUpdate = (result: HealthCheckResult) => {
      setHealthResult(result);
      
      // Auto-show banner if service is down or degraded
      if (result.overall !== 'healthy') {
        setIsDismissed(false);
      }
    };

    healthService.addListener(handleHealthUpdate);

    // Start monitoring if not already started
    healthService.startMonitoring(60000); // Check every minute

    return () => {
      healthService.removeListener(handleHealthUpdate);
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await healthService.checkNow();
    } catch (error) {
      console.error('Failed to refresh health status:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsExpanded(false);
  };

  const getStatusIcon = (status: 'healthy' | 'degraded' | 'down') => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'down':
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: 'healthy' | 'degraded' | 'down') => {
    switch (status) {
      case 'healthy':
        return 'bg-green-50 border-green-200';
      case 'degraded':
        return 'bg-yellow-50 border-yellow-200';
      case 'down':
        return 'bg-red-50 border-red-200';
    }
  };

  const getStatusBadgeVariant = (status: 'healthy' | 'degraded' | 'down') => {
    switch (status) {
      case 'healthy':
        return 'default';
      case 'degraded':
        return 'secondary';
      case 'down':
        return 'destructive';
    }
  };

  const getMainMessage = (result: HealthCheckResult) => {
    switch (result.overall) {
      case 'healthy':
        return 'All systems operational';
      case 'degraded':
        return 'Some services experiencing issues';
      case 'down':
        return 'Service disruption detected';
    }
  };

  // Only show banner if there are actual issues (degraded or down), or if explicitly expanded, and not dismissed
  if (!healthResult || isDismissed || (healthResult.overall === 'healthy' && !isExpanded)) {
    return null;
  }

  return (
    <div className={cn('w-full', className)}>
      <Alert className={cn('border-l-4', getStatusColor(healthResult.overall))}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon(healthResult.overall)}
            <div className="flex-1">
              <AlertDescription className="font-medium">
                {getMainMessage(healthResult)}
              </AlertDescription>
              {healthResult.overall !== 'healthy' && (
                <AlertDescription className="text-sm text-gray-600 mt-1">
                  Some features may be unavailable. We're working to resolve this.
                </AlertDescription>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant={getStatusBadgeVariant(healthResult.overall)} className="text-xs">
              {healthResult.overall.toUpperCase()}
            </Badge>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 space-y-3 border-t pt-3">
            <div className="text-sm font-medium text-gray-700 mb-2">Service Details:</div>
            
            {healthResult.services.map((service, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(service.status)}
                  <span className="text-sm font-medium">{service.service}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {service.responseTime && (
                    <span className="text-xs text-gray-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {service.responseTime}ms
                    </span>
                  )}
                  <Badge variant={getStatusBadgeVariant(service.status)} className="text-xs">
                    {service.status}
                  </Badge>
                </div>
              </div>
            ))}
            
            <div className="text-xs text-gray-500 mt-2">
              Last checked: {new Date(healthResult.lastChecked).toLocaleTimeString()}
            </div>
          </div>
        )}
      </Alert>
    </div>
  );
};