import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";

interface SystemStatus {
  jobScraping: "active" | "idle" | "error";
  aiProcessing: "running" | "idle" | "error";
  browserAutomation: "active" | "idle" | "error";
  apiConnections: "healthy" | "warning" | "error";
  dailyQuota: {
    used: number;
    total: number;
  };
}

const statusConfig = {
  active: { color: "bg-material-green", text: "Active" },
  running: { color: "bg-material-green", text: "Running" },
  healthy: { color: "bg-material-green", text: "Healthy" },
  idle: { color: "bg-yellow-500", text: "Idle" },
  warning: { color: "bg-yellow-500", text: "Warning" },
  error: { color: "bg-red-500", text: "Error" },
};

export default function SystemStatus() {
  // Mock system status data - in a real app, this would come from an API
  const systemStatus: SystemStatus = {
    jobScraping: "active",
    aiProcessing: "running",
    browserAutomation: "idle",
    apiConnections: "healthy",
    dailyQuota: {
      used: 247,
      total: 500,
    },
  };

  const quotaPercentage = (systemStatus.dailyQuota.used / systemStatus.dailyQuota.total) * 100;

  const statusItems = [
    {
      label: "Job Scraping",
      status: systemStatus.jobScraping,
      testId: "job-scraping-status"
    },
    {
      label: "AI Processing",
      status: systemStatus.aiProcessing,
      testId: "ai-processing-status"
    },
    {
      label: "Browser Automation",
      status: systemStatus.browserAutomation,
      testId: "browser-automation-status"
    },
    {
      label: "API Connections",
      status: systemStatus.apiConnections,
      testId: "api-connections-status"
    },
  ];

  return (
    <Card className="shadow-material">
      <CardHeader>
        <h3 className="text-lg font-medium text-gray-900">System Status</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        {statusItems.map((item) => {
          const config = statusConfig[item.status as keyof typeof statusConfig];
          return (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 ${config.color} rounded-full`}></div>
                <span className="text-sm text-gray-900">{item.label}</span>
              </div>
              <span 
                className="text-sm text-material-gray"
                data-testid={item.testId}
              >
                {config.text}
              </span>
            </div>
          );
        })}
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-900">Daily Quota</span>
            <span 
              className="text-sm text-material-gray"
              data-testid="quota-usage"
            >
              {systemStatus.dailyQuota.used}/{systemStatus.dailyQuota.total}
            </span>
          </div>
          <Progress 
            value={quotaPercentage} 
            className="w-full"
            data-testid="quota-progress"
          />
        </div>
      </CardContent>
    </Card>
  );
}
