import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivityItem {
  id: string;
  action: string;
  details: {
    jobTitle?: string;
    company?: string;
    jobsFound?: number;
    keywords?: string[];
    status?: string;
  };
  status: string;
  timestamp: string;
}

const activityConfig: Record<string, { icon: string; color: string }> = {
  automated_application: { icon: "send", color: "material-blue" },
  manual_job_search: { icon: "search", color: "material-orange" },
  cover_letter_generated: { icon: "auto_awesome", color: "material-green" },
  resume_optimized: { icon: "psychology", color: "purple-500" },
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 60) return `${diffMins} min ago`;
  return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
}

function getActivityDescription(activity: ActivityItem): string {
  switch (activity.action) {
    case 'automated_application':
      return `Applied to ${activity.details.jobTitle} at ${activity.details.company}`;
    case 'manual_job_search':
      return `Found ${activity.details.jobsFound || 0} new jobs matching your criteria`;
    case 'cover_letter_generated':
      return `Generated custom cover letter for ${activity.details.jobTitle} position`;
    case 'resume_optimized':
      return `AI optimized resume for ${activity.details.keywords?.join(' and ')} keywords`;
    default:
      return 'Activity completed';
  }
}

export default function RecentActivity() {
  const { data: activities, isLoading } = useQuery<ActivityItem[]>({
    queryKey: ['/api/automation/logs'],
  });

  if (isLoading) {
    return (
      <Card className="mt-8 shadow-material">
        <CardHeader>
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-1" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8 shadow-material">
      <CardHeader>
        <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
      </CardHeader>
      <CardContent>
        {activities && activities.length > 0 ? (
          <div className="flow-root">
            <ul className="-mb-8">
              {activities.map((activity, index) => {
                const config = activityConfig[activity.action] || { icon: "info", color: "material-gray" };
                const isLast = index === activities.length - 1;
                
                return (
                  <li key={activity.id}>
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
                          <div>
                            <p 
                              className="text-sm text-gray-900"
                              data-testid={`activity-description-${activity.id}`}
                            >
                              {getActivityDescription(activity)}
                            </p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-material-gray">
                            <time data-testid={`activity-time-${activity.id}`}>
                              {formatTimeAgo(activity.timestamp)}
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
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="material-icon text-material-gray">history</span>
            </div>
            <p className="text-gray-500 text-sm">No recent activity</p>
            <p className="text-gray-400 text-xs mt-1">Activity will appear here as JobBot works</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
