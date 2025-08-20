import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SystemConfig {
  automationEnabled: boolean;
  dailyApplicationLimit: number;
  scrapeInterval: number;
}

interface AutomationLog {
  id: string;
  action: string;
  details: {
    jobTitle?: string;
    company?: string;
    jobsFound?: number;
    keywords?: string[];
    status?: string;
    error?: string;
  };
  status: string;
  timestamp: string;
}

const activityConfig: Record<string, { icon: string; color: string }> = {
  automated_application: { icon: "send", color: "material-blue" },
  manual_job_search: { icon: "search", color: "material-orange" },
  cover_letter_generated: { icon: "auto_awesome", color: "material-green" },
  resume_optimized: { icon: "psychology", color: "purple-500" },
  automation_toggle: { icon: "power_settings_new", color: "material-gray" },
};

const statusConfig: Record<string, { color: string; text: string }> = {
  success: { color: "bg-material-green", text: "Success" },
  error: { color: "bg-red-500", text: "Error" },
  warning: { color: "bg-yellow-500", text: "Warning" },
};

export default function Automation() {
  const [automationEnabled, setAutomationEnabled] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(50);
  const [scrapeInterval, setScrapeInterval] = useState(60);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: config, isLoading: configLoading } = useQuery<SystemConfig>({
    queryKey: ['/api/system/config'],
  });

  const { data: logs, isLoading: logsLoading } = useQuery<AutomationLog[]>({
    queryKey: ['/api/automation/logs'],
  });

  // Update local state when config loads
  if (config && !configLoading) {
    if (automationEnabled !== config.automationEnabled) {
      setAutomationEnabled(config.automationEnabled);
    }
    if (dailyLimit !== config.dailyApplicationLimit) {
      setDailyLimit(config.dailyApplicationLimit);
    }
    if (scrapeInterval !== config.scrapeInterval) {
      setScrapeInterval(config.scrapeInterval);
    }
  }

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
      queryClient.invalidateQueries({ queryKey: ['/api/system/config'] });
      queryClient.invalidateQueries({ queryKey: ['/api/automation/logs'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to toggle automation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveConfigMutation = useMutation({
    mutationFn: (data: Partial<SystemConfig>) => 
      apiRequest("POST", "/api/system/config", data),
    onSuccess: () => {
      toast({
        title: "Configuration Saved",
        description: "Automation settings have been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/system/config'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to save configuration",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleToggleAutomation = (checked: boolean) => {
    toggleAutomationMutation.mutate(checked);
  };

  const handleSaveConfig = () => {
    saveConfigMutation.mutate({
      dailyApplicationLimit: dailyLimit,
      scrapeInterval: scrapeInterval,
    });
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 60) return `${diffMins}m ago`;
    return `${diffHours}h ago`;
  };

  const getActivityDescription = (log: AutomationLog): string => {
    switch (log.action) {
      case 'automated_application':
        return `Applied to ${log.details.jobTitle} at ${log.details.company}`;
      case 'manual_job_search':
        return `Found ${log.details.jobsFound || 0} new jobs matching criteria`;
      case 'cover_letter_generated':
        return `Generated cover letter for ${log.details.jobTitle}`;
      case 'resume_optimized':
        return `Optimized resume for ${log.details.keywords?.join(', ')} keywords`;
      case 'automation_toggle':
        return `Automation ${log.details.status === 'enabled' ? 'enabled' : 'disabled'}`;
      default:
        return `${log.action.replace('_', ' ')} completed`;
    }
  };

  // Mock current usage for demo
  const currentUsage = 23;
  const usagePercentage = (currentUsage / dailyLimit) * 100;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Topbar 
          title="Automation"
          subtitle="Configure and monitor your automation settings"
        />
        
        <main className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Configuration Panel */}
            <div className="lg:col-span-1 space-y-6">
              {/* Main Toggle */}
              <Card className="shadow-material">
                <CardHeader>
                  <h3 className="text-lg font-medium text-gray-900">Automation Control</h3>
                </CardHeader>
                <CardContent>
                  {configLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base font-medium text-gray-900">
                            Enable Automation
                          </Label>
                          <p className="text-sm text-material-gray">
                            Allow JobBot to automatically search and apply to jobs
                          </p>
                        </div>
                        <Switch
                          checked={automationEnabled}
                          onCheckedChange={handleToggleAutomation}
                          disabled={toggleAutomationMutation.isPending}
                          data-testid="automation-master-toggle"
                        />
                      </div>

                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                        <div className={`w-3 h-3 rounded-full ${automationEnabled ? 'bg-material-green' : 'bg-gray-400'}`}></div>
                        <span className="text-sm font-medium text-gray-900">
                          Status: {automationEnabled ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Settings */}
              <Card className="shadow-material">
                <CardHeader>
                  <h3 className="text-lg font-medium text-gray-900">Settings</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="daily-limit" className="text-sm font-medium text-gray-900">
                      Daily Application Limit
                    </Label>
                    <Input
                      id="daily-limit"
                      type="number"
                      value={dailyLimit}
                      onChange={(e) => setDailyLimit(parseInt(e.target.value) || 0)}
                      min="1"
                      max="200"
                      className="mt-2"
                      data-testid="daily-limit-input"
                    />
                    <p className="text-xs text-material-gray mt-1">
                      Maximum applications to send per day
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="scrape-interval" className="text-sm font-medium text-gray-900">
                      Search Interval (minutes)
                    </Label>
                    <Input
                      id="scrape-interval"
                      type="number"
                      value={scrapeInterval}
                      onChange={(e) => setScrapeInterval(parseInt(e.target.value) || 0)}
                      min="15"
                      max="1440"
                      className="mt-2"
                      data-testid="scrape-interval-input"
                    />
                    <p className="text-xs text-material-gray mt-1">
                      How often to search for new jobs
                    </p>
                  </div>

                  <Button
                    onClick={handleSaveConfig}
                    disabled={saveConfigMutation.isPending}
                    className="w-full bg-material-blue hover:bg-blue-700"
                    data-testid="save-config-button"
                  >
                    {saveConfigMutation.isPending ? "Saving..." : "Save Settings"}
                  </Button>
                </CardContent>
              </Card>

              {/* Daily Quota */}
              <Card className="shadow-material">
                <CardHeader>
                  <h3 className="text-lg font-medium text-gray-900">Daily Quota</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-900">Applications Sent</span>
                      <span className="text-sm text-material-gray" data-testid="quota-usage">
                        {currentUsage}/{dailyLimit}
                      </span>
                    </div>
                    <Progress 
                      value={usagePercentage} 
                      className="w-full"
                      data-testid="quota-progress"
                    />
                    <div className="text-xs text-material-gray">
                      {dailyLimit - currentUsage} applications remaining today
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Status and Logs */}
            <div className="lg:col-span-2 space-y-6">
              {/* System Status */}
              <Card className="shadow-material">
                <CardHeader>
                  <h3 className="text-lg font-medium text-gray-900">System Status</h3>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="w-3 h-3 bg-material-green rounded-full mx-auto mb-2"></div>
                      <div className="text-sm font-medium text-gray-900">Job Scraping</div>
                      <div className="text-xs text-material-gray" data-testid="job-scraping-status">Active</div>
                    </div>
                    <div className="text-center">
                      <div className="w-3 h-3 bg-material-green rounded-full mx-auto mb-2"></div>
                      <div className="text-sm font-medium text-gray-900">AI Processing</div>
                      <div className="text-xs text-material-gray" data-testid="ai-processing-status">Running</div>
                    </div>
                    <div className="text-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mx-auto mb-2"></div>
                      <div className="text-sm font-medium text-gray-900">Browser Automation</div>
                      <div className="text-xs text-material-gray" data-testid="browser-automation-status">Idle</div>
                    </div>
                    <div className="text-center">
                      <div className="w-3 h-3 bg-material-green rounded-full mx-auto mb-2"></div>
                      <div className="text-sm font-medium text-gray-900">API Connections</div>
                      <div className="text-xs text-material-gray" data-testid="api-connections-status">Healthy</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Activity Log */}
              <Card className="shadow-material">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Activity Log</h3>
                    <Badge variant="outline" data-testid="logs-count">
                      {logs?.length || 0} entries
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {logsLoading ? (
                    <div className="space-y-4 p-6">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex space-x-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-3/4 mb-1" />
                            <Skeleton className="h-3 w-1/4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : logs && logs.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto">
                      <div className="flow-root p-6">
                        <ul className="-mb-8">
                          {logs.map((log, index) => {
                            const config = activityConfig[log.action] || { icon: "info", color: "material-gray" };
                            const statusConf = statusConfig[log.status] || { color: "bg-gray-500", text: "Unknown" };
                            const isLast = index === logs.length - 1;
                            
                            return (
                              <li key={log.id}>
                                <div className={`relative ${!isLast ? 'pb-8' : ''}`}>
                                  {!isLast && (
                                    <span
                                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                      aria-hidden="true"
                                    />
                                  )}
                                  <div className="relative flex space-x-3">
                                    <div>
                                      <span 
                                        className={`h-8 w-8 rounded-full bg-${config.color} flex items-center justify-center ring-8 ring-white`}
                                      >
                                        <span className="material-icon text-white text-sm">
                                          {config.icon}
                                        </span>
                                      </span>
                                    </div>
                                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                      <div className="flex-1">
                                        <p 
                                          className="text-sm text-gray-900"
                                          data-testid={`log-description-${log.id}`}
                                        >
                                          {getActivityDescription(log)}
                                        </p>
                                        {log.details.error && (
                                          <p className="text-xs text-red-600 mt-1">
                                            Error: {log.details.error}
                                          </p>
                                        )}
                                      </div>
                                      <div className="text-right flex flex-col items-end space-y-1">
                                        <Badge 
                                          variant="outline" 
                                          className={`text-xs ${
                                            log.status === 'success' ? 'border-green-300 text-green-800' :
                                            log.status === 'error' ? 'border-red-300 text-red-800' :
                                            'border-yellow-300 text-yellow-800'
                                          }`}
                                        >
                                          {statusConf.text}
                                        </Badge>
                                        <time 
                                          className="text-xs text-material-gray"
                                          data-testid={`log-time-${log.id}`}
                                        >
                                          {formatTimeAgo(log.timestamp)}
                                        </time>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span className="material-icon text-material-gray text-2xl">history</span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
                      <p className="text-material-gray mb-4">
                        Enable automation to start seeing activity logs here.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => handleToggleAutomation(true)}
                        disabled={automationEnabled}
                      >
                        <span className="material-icon mr-2">power_settings_new</span>
                        Enable Automation
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
