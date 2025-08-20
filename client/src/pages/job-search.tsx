import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const jobSearchSchema = z.object({
  keywords: z.array(z.string()).min(1, "At least one keyword is required"),
  locations: z.array(z.string()),
  jobBoards: z.array(z.string()).min(1, "At least one job board is required"),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  experienceLevel: z.string().optional(),
  isActive: z.boolean().default(true),
});

type JobSearchFormData = z.infer<typeof jobSearchSchema>;

interface Job {
  id: string;
  title: string;
  company: string;
  location?: string;
  description: string;
  salary?: string;
  jobBoard: string;
  url: string;
  discoveredAt: string;
}

interface JobSearchConfig {
  id?: string;
  keywords: string[];
  locations: string[];
  jobBoards: string[];
  salaryMin?: number;
  salaryMax?: number;
  experienceLevel?: string;
  isActive: boolean;
}

export default function JobSearch() {
  const [keywordInput, setKeywordInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: config, isLoading: configLoading } = useQuery<JobSearchConfig>({
    queryKey: ['/api/job-search/config'],
  });

  const { data: jobs, isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ['/api/jobs'],
  });

  const form = useForm<JobSearchFormData>({
    resolver: zodResolver(jobSearchSchema),
    defaultValues: {
      keywords: config?.keywords || [],
      locations: config?.locations || [],
      jobBoards: config?.jobBoards || ['Indeed', 'LinkedIn'],
      salaryMin: config?.salaryMin,
      salaryMax: config?.salaryMax,
      experienceLevel: config?.experienceLevel || 'mid',
      isActive: config?.isActive ?? true,
    },
  });

  // Update form when config loads
  if (config && !configLoading) {
    form.reset({
      keywords: config.keywords || [],
      locations: config.locations || [],
      jobBoards: config.jobBoards || ['Indeed', 'LinkedIn'],
      salaryMin: config.salaryMin,
      salaryMax: config.salaryMax,
      experienceLevel: config.experienceLevel || 'mid',
      isActive: config.isActive ?? true,
    });
  }

  const saveConfigMutation = useMutation({
    mutationFn: (data: JobSearchFormData) => 
      apiRequest("POST", "/api/job-search/config", data),
    onSuccess: () => {
      toast({
        title: "Configuration Saved",
        description: "Your job search preferences have been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/job-search/config'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to save configuration",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addKeyword = () => {
    if (keywordInput.trim()) {
      const currentKeywords = form.getValues("keywords");
      if (!currentKeywords.includes(keywordInput.trim())) {
        form.setValue("keywords", [...currentKeywords, keywordInput.trim()]);
        setKeywordInput("");
      }
    }
  };

  const removeKeyword = (keyword: string) => {
    const currentKeywords = form.getValues("keywords");
    form.setValue("keywords", currentKeywords.filter(k => k !== keyword));
  };

  const addLocation = () => {
    if (locationInput.trim()) {
      const currentLocations = form.getValues("locations");
      if (!currentLocations.includes(locationInput.trim())) {
        form.setValue("locations", [...currentLocations, locationInput.trim()]);
        setLocationInput("");
      }
    }
  };

  const removeLocation = (location: string) => {
    const currentLocations = form.getValues("locations");
    form.setValue("locations", currentLocations.filter(l => l !== location));
  };

  const onSubmit = (data: JobSearchFormData) => {
    saveConfigMutation.mutate(data);
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

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Topbar 
          title="Job Search"
          subtitle="Configure your search criteria and browse available positions"
          showManualScan={true}
        />
        
        <main className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Configuration Panel */}
            <div className="lg:col-span-1">
              <Card className="shadow-material">
                <CardHeader>
                  <h3 className="text-lg font-medium text-gray-900">Search Configuration</h3>
                </CardHeader>
                <CardContent>
                  {configLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : (
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Keywords */}
                        <div>
                          <Label htmlFor="keywords" className="text-sm font-medium text-gray-900">
                            Keywords
                          </Label>
                          <div className="mt-2 space-y-2">
                            <div className="flex space-x-2">
                              <Input
                                value={keywordInput}
                                onChange={(e) => setKeywordInput(e.target.value)}
                                placeholder="e.g., React, JavaScript, Node.js"
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                                data-testid="keyword-input"
                              />
                              <Button 
                                type="button" 
                                onClick={addKeyword}
                                size="sm"
                                data-testid="add-keyword-button"
                              >
                                Add
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {form.watch("keywords").map((keyword) => (
                                <Badge 
                                  key={keyword} 
                                  variant="secondary"
                                  className="px-3 py-1"
                                  data-testid={`keyword-${keyword}`}
                                >
                                  {keyword}
                                  <button
                                    type="button"
                                    onClick={() => removeKeyword(keyword)}
                                    className="ml-2 text-gray-500 hover:text-gray-700"
                                    data-testid={`remove-keyword-${keyword}`}
                                  >
                                    ×
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          </div>
                          {form.formState.errors.keywords && (
                            <p className="text-sm text-red-600 mt-1">
                              {form.formState.errors.keywords.message}
                            </p>
                          )}
                        </div>

                        {/* Locations */}
                        <div>
                          <Label htmlFor="locations" className="text-sm font-medium text-gray-900">
                            Locations (Optional)
                          </Label>
                          <div className="mt-2 space-y-2">
                            <div className="flex space-x-2">
                              <Input
                                value={locationInput}
                                onChange={(e) => setLocationInput(e.target.value)}
                                placeholder="e.g., New York, Remote, California"
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLocation())}
                                data-testid="location-input"
                              />
                              <Button 
                                type="button" 
                                onClick={addLocation}
                                size="sm"
                                data-testid="add-location-button"
                              >
                                Add
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {form.watch("locations").map((location) => (
                                <Badge 
                                  key={location} 
                                  variant="outline"
                                  className="px-3 py-1"
                                  data-testid={`location-${location}`}
                                >
                                  {location}
                                  <button
                                    type="button"
                                    onClick={() => removeLocation(location)}
                                    className="ml-2 text-gray-500 hover:text-gray-700"
                                    data-testid={`remove-location-${location}`}
                                  >
                                    ×
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Experience Level */}
                        <FormField
                          control={form.control}
                          name="experienceLevel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Experience Level</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="experience-level-select">
                                    <SelectValue placeholder="Select experience level" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="entry">Entry Level</SelectItem>
                                  <SelectItem value="mid">Mid Level</SelectItem>
                                  <SelectItem value="senior">Senior Level</SelectItem>
                                  <SelectItem value="lead">Lead/Principal</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Salary Range */}
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="salaryMin"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Min Salary</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="50000"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                    data-testid="salary-min-input"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="salaryMax"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Max Salary</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="150000"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                    data-testid="salary-max-input"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Active Toggle */}
                        <FormField
                          control={form.control}
                          name="isActive"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between">
                              <FormLabel>Enable Automatic Search</FormLabel>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="auto-search-toggle"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <Button 
                          type="submit" 
                          className="w-full bg-material-blue hover:bg-blue-700"
                          disabled={saveConfigMutation.isPending}
                          data-testid="save-config-button"
                        >
                          {saveConfigMutation.isPending ? "Saving..." : "Save Configuration"}
                        </Button>
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Jobs List */}
            <div className="lg:col-span-2">
              <Card className="shadow-material">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Available Jobs</h3>
                    <Badge variant="outline" data-testid="jobs-count">
                      {jobs?.length || 0} jobs found
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {jobsLoading ? (
                    <div className="space-y-4 p-6">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="p-4 border border-gray-200 rounded-lg">
                          <Skeleton className="h-5 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-1/2 mb-2" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <div className="flex justify-between items-center">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : jobs && jobs.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {jobs.map((job) => (
                        <div 
                          key={job.id} 
                          className="p-6 hover:bg-gray-50 transition-colors"
                          data-testid={`job-${job.id}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 
                                className="text-lg font-medium text-gray-900 mb-1"
                                data-testid={`job-title-${job.id}`}
                              >
                                {job.title}
                              </h4>
                              <p 
                                className="text-material-blue font-medium mb-2"
                                data-testid={`job-company-${job.id}`}
                              >
                                {job.company}
                              </p>
                              {job.location && (
                                <p className="text-sm text-material-gray mb-2 flex items-center">
                                  <span className="material-icon text-sm mr-1">location_on</span>
                                  {job.location}
                                </p>
                              )}
                              {job.salary && (
                                <p className="text-sm text-material-gray mb-2 flex items-center">
                                  <span className="material-icon text-sm mr-1">attach_money</span>
                                  {job.salary}
                                </p>
                              )}
                              <p 
                                className="text-sm text-gray-600 mb-3 line-clamp-2"
                                data-testid={`job-description-${job.id}`}
                              >
                                {job.description}
                              </p>
                              <div className="flex items-center space-x-4 text-xs text-material-gray">
                                <span className="flex items-center">
                                  <span className="material-icon text-sm mr-1">business</span>
                                  {job.jobBoard}
                                </span>
                                <span className="flex items-center">
                                  <span className="material-icon text-sm mr-1">schedule</span>
                                  {formatTimeAgo(job.discoveredAt)}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col space-y-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(job.url, '_blank')}
                                data-testid={`view-job-${job.id}`}
                              >
                                <span className="material-icon text-sm mr-2">open_in_new</span>
                                View Job
                              </Button>
                              <Button
                                size="sm"
                                className="bg-material-green hover:bg-green-700 text-white"
                                data-testid={`apply-job-${job.id}`}
                              >
                                <span className="material-icon text-sm mr-2">send</span>
                                Quick Apply
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span className="material-icon text-material-gray text-2xl">work_off</span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                      <p className="text-material-gray mb-4">
                        Configure your search criteria and run a manual scan to find relevant positions.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => toast({ title: "Manual scan", description: "Use the Manual Scan button in the top bar to search for jobs." })}
                      >
                        <span className="material-icon mr-2">info</span>
                        How to search
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
