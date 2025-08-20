import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

interface Application {
  id: string;
  jobId: string;
  status: string;
  appliedAt: string;
  jobTitle: string;
  company: string;
}

const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className: string }> = {
  pending: { variant: "outline", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" },
  submitted: { variant: "default", className: "bg-green-100 text-green-800 hover:bg-green-200" },
  interview: { variant: "secondary", className: "bg-blue-100 text-blue-800 hover:bg-blue-200" },
  rejected: { variant: "destructive", className: "bg-red-100 text-red-800 hover:bg-red-200" },
  offer: { variant: "default", className: "bg-purple-100 text-purple-800 hover:bg-purple-200" },
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

export default function RecentApplications() {
  const { data: applications, isLoading } = useQuery<Application[]>({
    queryKey: ['/api/applications/recent'],
  });

  if (isLoading) {
    return (
      <Card className="lg:col-span-2 shadow-material">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Recent Applications</h3>
            <Button variant="ghost" size="sm" disabled>
              View all
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-4">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-40 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2 shadow-material">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Recent Applications</h3>
          <Link href="/applications">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-material-blue hover:text-blue-700"
              data-testid="view-all-applications"
            >
              View all
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {applications && applications.length > 0 ? (
          <div>
            {applications.map((application, index) => (
              <div
                key={application.id}
                className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                  index < applications.length - 1 ? 'border-b border-gray-100' : ''
                }`}
                data-testid={`application-${application.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="material-icon text-material-gray">business</span>
                      </div>
                      <div>
                        <h4 
                          className="text-sm font-medium text-gray-900"
                          data-testid={`job-title-${application.id}`}
                        >
                          {application.jobTitle}
                        </h4>
                        <p 
                          className="text-sm text-material-gray"
                          data-testid={`company-${application.id}`}
                        >
                          {application.company}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge
                      variant={statusConfig[application.status]?.variant || "outline"}
                      className={statusConfig[application.status]?.className}
                      data-testid={`status-${application.id}`}
                    >
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </Badge>
                    <span 
                      className="text-sm text-material-gray"
                      data-testid={`applied-at-${application.id}`}
                    >
                      {formatTimeAgo(application.appliedAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-8 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="material-icon text-material-gray">work_off</span>
            </div>
            <p className="text-gray-500 text-sm">No applications yet</p>
            <p className="text-gray-400 text-xs mt-1">Start applying to jobs to see your recent applications here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
