import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface Application {
  id: string;
  status: string;
  appliedAt: string;
  job?: {
    title: string;
    company: string;
    jobBoard: string;
  };
}

interface AnalyticsData {
  totalApplications: number;
  responseRate: number;
  averageResponseTime: number;
  topJobBoards: Array<{ name: string; count: number; percentage: number }>;
  applicationTrend: Array<{ date: string; count: number }>;
  statusBreakdown: Array<{ status: string; count: number; percentage: number }>;
  topCompanies: Array<{ company: string; applications: number }>;
}

export default function Analytics() {
  const { data: applications, isLoading: applicationsLoading } = useQuery<Application[]>({
    queryKey: ['/api/applications'],
  });

  // Calculate analytics from application data
  const calculateAnalytics = (apps: Application[]): AnalyticsData => {
    if (!apps || apps.length === 0) {
      return {
        totalApplications: 0,
        responseRate: 0,
        averageResponseTime: 0,
        topJobBoards: [],
        applicationTrend: [],
        statusBreakdown: [],
        topCompanies: [],
      };
    }

    // Status breakdown
    const statusCounts = apps.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: (count / apps.length) * 100,
    }));

    // Job boards breakdown
    const jobBoardCounts = apps.reduce((acc, app) => {
      const jobBoard = app.job?.jobBoard || 'Unknown';
      acc[jobBoard] = (acc[jobBoard] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topJobBoards = Object.entries(jobBoardCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: (count / apps.length) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top companies
    const companyCounts = apps.reduce((acc, app) => {
      const company = app.job?.company || 'Unknown';
      acc[company] = (acc[company] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCompanies = Object.entries(companyCounts)
      .map(([company, applications]) => ({ company, applications }))
      .sort((a, b) => b.applications - a.applications)
      .slice(0, 10);

    // Response rate (interviews + offers / total applications)
    const responses = apps.filter(app => 
      app.status === 'interview' || app.status === 'offer'
    ).length;
    const responseRate = apps.length > 0 ? (responses / apps.length) * 100 : 0;

    // Application trend (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const applicationTrend = last7Days.map(date => {
      const count = apps.filter(app => 
        app.appliedAt.startsWith(date)
      ).length;
      return { date, count };
    });

    return {
      totalApplications: apps.length,
      responseRate,
      averageResponseTime: 3.2, // Mock value
      topJobBoards,
      applicationTrend,
      statusBreakdown,
      topCompanies,
    };
  };

  const analytics = applications ? calculateAnalytics(applications) : null;

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500',
    submitted: 'bg-blue-500',
    interview: 'bg-green-500',
    rejected: 'bg-red-500',
    offer: 'bg-purple-500',
  };

  const formatPercentage = (value: number): string => {
    return `${Math.round(value)}%`;
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Topbar 
          title="Analytics"
          subtitle="Track your job application performance and insights"
        />
        
        <main className="p-6">
          {applicationsLoading ? (
            <div className="space-y-6">
              {/* Loading stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="shadow-material">
                    <CardContent className="p-6">
                      <Skeleton className="h-4 w-20 mb-2" />
                      <Skeleton className="h-8 w-16 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </CardContent>
                  </Card>
                ))}
              </div>
              {/* Loading charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="shadow-material">
                    <CardHeader>
                      <Skeleton className="h-5 w-32" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-40 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : analytics ? (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="shadow-material">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-material-gray text-sm font-medium">Total Applications</p>
                        <p className="text-3xl font-bold text-gray-900" data-testid="total-applications">
                          {analytics.totalApplications}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-material-blue bg-opacity-10 rounded-lg flex items-center justify-center">
                        <span className="material-icon text-material-blue text-xl">send</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-material">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-material-gray text-sm font-medium">Response Rate</p>
                        <p className="text-3xl font-bold text-gray-900" data-testid="response-rate">
                          {formatPercentage(analytics.responseRate)}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-material-green bg-opacity-10 rounded-lg flex items-center justify-center">
                        <span className="material-icon text-material-green text-xl">trending_up</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-material">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-material-gray text-sm font-medium">Avg Response Time</p>
                        <p className="text-3xl font-bold text-gray-900" data-testid="response-time">
                          {analytics.averageResponseTime} days
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-material-orange bg-opacity-10 rounded-lg flex items-center justify-center">
                        <span className="material-icon text-material-orange text-xl">schedule</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-material">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-material-gray text-sm font-medium">Success Rate</p>
                        <p className="text-3xl font-bold text-gray-900" data-testid="success-rate">
                          {formatPercentage(analytics.responseRate)}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-purple-500 bg-opacity-10 rounded-lg flex items-center justify-center">
                        <span className="material-icon text-purple-500 text-xl">star</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts and Breakdowns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Application Status Breakdown */}
                <Card className="shadow-material">
                  <CardHeader>
                    <h3 className="text-lg font-medium text-gray-900">Application Status</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.statusBreakdown.map((item) => (
                        <div key={item.status} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${statusColors[item.status] || 'bg-gray-400'}`}></div>
                            <span className="text-sm font-medium text-gray-900 capitalize">
                              {item.status}
                            </span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-24">
                              <Progress value={item.percentage} className="h-2" />
                            </div>
                            <span className="text-sm text-material-gray w-12 text-right">
                              {item.count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Job Boards Performance */}
                <Card className="shadow-material">
                  <CardHeader>
                    <h3 className="text-lg font-medium text-gray-900">Job Boards</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.topJobBoards.map((board, index) => (
                        <div key={board.name} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-600">
                                #{index + 1}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {board.name}
                            </span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-24">
                              <Progress value={board.percentage} className="h-2" />
                            </div>
                            <span className="text-sm text-material-gray w-12 text-right">
                              {board.count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Application Trend */}
                <Card className="shadow-material">
                  <CardHeader>
                    <h3 className="text-lg font-medium text-gray-900">7-Day Application Trend</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.applicationTrend.map((day, index) => {
                        const maxCount = Math.max(...analytics.applicationTrend.map(d => d.count));
                        const percentage = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                        const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
                        
                        return (
                          <div key={day.date} className="flex items-center justify-between">
                            <div className="w-12 text-sm text-material-gray">
                              {dayName}
                            </div>
                            <div className="flex-1 mx-4">
                              <div className="h-8 bg-gray-100 rounded flex items-center">
                                <div 
                                  className="h-full bg-material-blue rounded transition-all duration-300"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                                <span className="ml-2 text-xs text-gray-600">
                                  {day.count}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Companies */}
                <Card className="shadow-material">
                  <CardHeader>
                    <h3 className="text-lg font-medium text-gray-900">Top Companies Applied</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.topCompanies.slice(0, 6).map((company, index) => (
                        <div key={company.company} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                              <span className="material-icon text-material-gray text-sm">business</span>
                            </div>
                            <span className="text-sm font-medium text-gray-900 truncate max-w-32">
                              {company.company}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {company.applications} apps
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Insights */}
              <Card className="shadow-material">
                <CardHeader>
                  <h3 className="text-lg font-medium text-gray-900">AI Insights</h3>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="material-icon text-material-blue text-sm">lightbulb</span>
                        <span className="text-sm font-medium text-material-blue">Optimization Tip</span>
                      </div>
                      <p className="text-sm text-gray-700">
                        Your response rate is {formatPercentage(analytics.responseRate)}. 
                        Consider optimizing your resume keywords for better matches.
                      </p>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="material-icon text-material-green text-sm">trending_up</span>
                        <span className="text-sm font-medium text-material-green">Growth Insight</span>
                      </div>
                      <p className="text-sm text-gray-700">
                        {analytics.topJobBoards[0]?.name || 'Indeed'} is your most successful job board. 
                        Focus more search efforts there.
                      </p>
                    </div>

                    <div className="p-4 bg-orange-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="material-icon text-material-orange text-sm">schedule</span>
                        <span className="text-sm font-medium text-material-orange">Timing Insight</span>
                      </div>
                      <p className="text-sm text-gray-700">
                        Average response time is {analytics.averageResponseTime} days. 
                        Follow up after 5-7 days if no response.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="material-icon text-material-gray text-2xl">analytics</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
              <p className="text-material-gray">
                Start applying to jobs to see your performance analytics here.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
