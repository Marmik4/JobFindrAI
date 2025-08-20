import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsData {
  applicationsSent: number;
  responseRate: number;
  activeJobs: number;
  aiAccuracy: number;
}

export default function StatsCards() {
  const { data: stats, isLoading } = useQuery<StatsData>({
    queryKey: ['/api/dashboard/stats'],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <CardContent className="p-0">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-4" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsConfig = [
    {
      title: "Applications Sent",
      value: stats?.applicationsSent || 0,
      icon: "send",
      color: "material-blue",
      change: "+12%",
      changeText: "from last week",
      testId: "applications-sent"
    },
    {
      title: "Response Rate",
      value: `${stats?.responseRate || 0}%`,
      icon: "trending_up",
      color: "material-green",
      change: "+5%",
      changeText: "from last month",
      testId: "response-rate"
    },
    {
      title: "Active Jobs",
      value: stats?.activeJobs || 0,
      icon: "work",
      color: "material-orange",
      change: "+89",
      changeText: "new today",
      testId: "active-jobs"
    },
    {
      title: "AI Accuracy",
      value: `${stats?.aiAccuracy || 0}%`,
      icon: "psychology",
      color: "purple-500",
      change: "+2%",
      changeText: "improved",
      testId: "ai-accuracy"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsConfig.map((stat, index) => (
        <Card key={index} className="shadow-material">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-material-gray text-sm font-medium">{stat.title}</p>
                <p 
                  className="text-3xl font-bold text-gray-900"
                  data-testid={`stat-${stat.testId}`}
                >
                  {stat.value}
                </p>
              </div>
              <div className={`w-12 h-12 bg-${stat.color} bg-opacity-10 rounded-lg flex items-center justify-center`}>
                <span className={`material-icon text-${stat.color} text-xl`}>
                  {stat.icon}
                </span>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-material-green text-sm font-medium">{stat.change}</span>
              <span className="text-material-gray text-sm ml-2">{stat.changeText}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
