import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Job {
  id: string;
  title: string;
  company: string;
  location?: string;
  description: string;
  url: string;
}

interface Application {
  id: string;
  jobId: string;
  status: string;
  appliedAt: string;
  lastUpdated: string;
  notes?: string;
  job?: Job;
}

const statusConfig = {
  pending: { 
    variant: "outline" as const, 
    className: "bg-yellow-100 text-yellow-800 border-yellow-300",
    icon: "schedule"
  },
  submitted: { 
    variant: "default" as const, 
    className: "bg-green-100 text-green-800 border-green-300",
    icon: "send"
  },
  interview: { 
    variant: "secondary" as const, 
    className: "bg-blue-100 text-blue-800 border-blue-300",
    icon: "person"
  },
  rejected: { 
    variant: "destructive" as const, 
    className: "bg-red-100 text-red-800 border-red-300",
    icon: "close"
  },
  offer: { 
    variant: "default" as const, 
    className: "bg-purple-100 text-purple-800 border-purple-300",
    icon: "celebration"
  },
};

export default function Applications() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: applications, isLoading } = useQuery<Application[]>({
    queryKey: ['/api/applications'],
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/applications/${id}`, { status }),
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Application status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const filteredApplications = applications?.filter(app => {
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesSearch = !searchQuery || 
      app.job?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.job?.company.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  }) || [];

  const getStatusCounts = () => {
    if (!applications) return {};
    return applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Topbar 
          title="Applications"
          subtitle="Track and manage your job applications"
        />
        
        <main className="p-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card className="shadow-material">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900" data-testid="total-applications">
                  {applications?.length || 0}
                </div>
                <div className="text-sm text-material-gray">Total</div>
              </CardContent>
            </Card>
            
            {Object.entries(statusConfig).map(([status, config]) => (
              <Card key={status} className="shadow-material">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900" data-testid={`${status}-count`}>
                    {statusCounts[status] || 0}
                  </div>
                  <div className="text-sm text-material-gray capitalize">{status}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <Card className="shadow-material mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by job title or company..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                    data-testid="search-applications"
                  />
                </div>
                <div className="w-full md:w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger data-testid="status-filter">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="offer">Offer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Applications List */}
          <Card className="shadow-material">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Applications</h3>
                <Badge variant="outline" data-testid="filtered-count">
                  {filteredApplications.length} of {applications?.length || 0}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-4 p-6">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Skeleton className="h-5 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-1/2 mb-2" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <div className="flex space-x-4">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <Skeleton className="h-6 w-24" />
                          <Skeleton className="h-8 w-20" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredApplications.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {filteredApplications.map((application) => {
                    const config = statusConfig[application.status as keyof typeof statusConfig];
                    return (
                      <div 
                        key={application.id} 
                        className="p-6 hover:bg-gray-50 transition-colors"
                        data-testid={`application-${application.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-start space-x-4">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                <span className="material-icon text-material-gray">business</span>
                              </div>
                              <div className="flex-1">
                                <h4 
                                  className="text-lg font-medium text-gray-900 mb-1"
                                  data-testid={`job-title-${application.id}`}
                                >
                                  {application.job?.title || 'Unknown Position'}
                                </h4>
                                <p 
                                  className="text-material-blue font-medium mb-2"
                                  data-testid={`company-${application.id}`}
                                >
                                  {application.job?.company || 'Unknown Company'}
                                </p>
                                {application.job?.location && (
                                  <p className="text-sm text-material-gray mb-2 flex items-center">
                                    <span className="material-icon text-sm mr-1">location_on</span>
                                    {application.job.location}
                                  </p>
                                )}
                                <div className="flex items-center space-x-4 text-sm text-material-gray">
                                  <span className="flex items-center">
                                    <span className="material-icon text-sm mr-1">schedule</span>
                                    Applied {formatTimeAgo(application.appliedAt)}
                                  </span>
                                  <span className="flex items-center">
                                    <span className="material-icon text-sm mr-1">update</span>
                                    Updated {formatTimeAgo(application.lastUpdated)}
                                  </span>
                                </div>
                                {application.notes && (
                                  <p className="text-sm text-gray-600 mt-2 italic">
                                    "{application.notes}"
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end space-y-3 ml-4">
                            <Badge 
                              variant={config.variant}
                              className={config.className}
                              data-testid={`status-${application.id}`}
                            >
                              <span className="material-icon text-sm mr-1">{config.icon}</span>
                              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                            </Badge>

                            <div className="flex flex-col space-y-2">
                              <Select
                                value={application.status}
                                onValueChange={(newStatus) => 
                                  updateStatusMutation.mutate({ id: application.id, status: newStatus })
                                }
                              >
                                <SelectTrigger 
                                  className="w-32" 
                                  data-testid={`status-select-${application.id}`}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="submitted">Submitted</SelectItem>
                                  <SelectItem value="interview">Interview</SelectItem>
                                  <SelectItem value="rejected">Rejected</SelectItem>
                                  <SelectItem value="offer">Offer</SelectItem>
                                </SelectContent>
                              </Select>

                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    data-testid={`view-details-${application.id}`}
                                  >
                                    <span className="material-icon text-sm mr-1">visibility</span>
                                    Details
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>
                                      {application.job?.title} - {application.job?.company}
                                    </DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <h4 className="font-medium mb-2">Application Details</h4>
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                          <span className="text-material-gray">Applied:</span>
                                          <span className="ml-2">{formatDate(application.appliedAt)}</span>
                                        </div>
                                        <div>
                                          <span className="text-material-gray">Last Updated:</span>
                                          <span className="ml-2">{formatDate(application.lastUpdated)}</span>
                                        </div>
                                        <div>
                                          <span className="text-material-gray">Status:</span>
                                          <span className="ml-2 capitalize">{application.status}</span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {application.job?.description && (
                                      <div>
                                        <h4 className="font-medium mb-2">Job Description</h4>
                                        <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                                          {application.job.description}
                                        </p>
                                      </div>
                                    )}

                                    <div className="flex space-x-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(application.job?.url, '_blank')}
                                        className="flex-1"
                                      >
                                        <span className="material-icon text-sm mr-1">open_in_new</span>
                                        View Original Job
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(application.job?.url, '_blank')}
                                data-testid={`view-job-${application.id}`}
                              >
                                <span className="material-icon text-sm mr-1">open_in_new</span>
                                View Job
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="material-icon text-material-gray text-2xl">track_changes</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {statusFilter === "all" ? "No applications yet" : `No ${statusFilter} applications`}
                  </h3>
                  <p className="text-material-gray mb-4">
                    {statusFilter === "all" 
                      ? "Start applying to jobs to track your application progress here."
                      : `No applications with "${statusFilter}" status found.`
                    }
                  </p>
                  {statusFilter !== "all" && (
                    <Button
                      variant="outline"
                      onClick={() => setStatusFilter("all")}
                    >
                      Show All Applications
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
