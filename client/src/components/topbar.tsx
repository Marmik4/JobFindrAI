import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface TopbarProps {
  title: string;
  subtitle?: string;
  showManualScan?: boolean;
  showAutomationToggle?: boolean;
}

export default function Topbar({ 
  title, 
  subtitle, 
  showManualScan = false, 
  showAutomationToggle = false 
}: TopbarProps) {
  const [automationEnabled, setAutomationEnabled] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const manualScanMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/job-search/manual"),
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: "Manual Scan Complete",
        description: data.message || `Found ${data.jobsFound || 0} new jobs`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
    },
    onError: (error) => {
      toast({
        title: "Manual Scan Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleAutomationMutation = useMutation({
    mutationFn: (enabled: boolean) => 
      apiRequest("POST", "/api/automation/toggle", { enabled }),
    onSuccess: async (response) => {
      const data = await response.json();
      setAutomationEnabled(data.enabled);
      toast({
        title: data.enabled ? "Automation Enabled" : "Automation Disabled",
        description: data.enabled 
          ? "JobBot will now automatically search and apply to jobs" 
          : "Automation has been paused",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to toggle automation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleManualScan = () => {
    manualScanMutation.mutate();
  };

  const handleToggleAutomation = (checked: boolean) => {
    toggleAutomationMutation.mutate(checked);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-medium text-gray-900" data-testid="page-title">{title}</h2>
            {subtitle && (
              <p className="text-material-gray" data-testid="page-subtitle">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {showAutomationToggle && (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-material-gray">Automation</span>
                <Switch
                  checked={automationEnabled}
                  onCheckedChange={handleToggleAutomation}
                  disabled={toggleAutomationMutation.isPending}
                  data-testid="automation-toggle"
                />
              </div>
            )}
            {showManualScan && (
              <Button
                onClick={handleManualScan}
                disabled={manualScanMutation.isPending}
                className="bg-material-blue hover:bg-blue-700 text-white shadow-material"
                data-testid="manual-scan-button"
              >
                <span className="material-icon mr-2 text-lg">search</span>
                {manualScanMutation.isPending ? "Scanning..." : "Manual Scan"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
