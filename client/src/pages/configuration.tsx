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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const systemConfigSchema = z.object({
  openaiApiKey: z.string().optional(),
  automationEnabled: z.boolean().default(false),
  dailyApplicationLimit: z.number().min(1).max(200).default(50),
  scrapeInterval: z.number().min(15).max(1440).default(60),
});

const personalInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  linkedinUrl: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  portfolioUrl: z.string().url("Invalid portfolio URL").optional().or(z.literal("")),
  address: z.string().optional(),
  summary: z.string().optional(),
});

const applicationPreferencesSchema = z.object({
  preferredJobTypes: z.array(z.string()),
  salaryExpectation: z.string().optional(),
  workLocation: z.string().default("remote"),
  availabilityDate: z.string().optional(),
  coverLetterTemplate: z.string().optional(),
});

type SystemConfigFormData = z.infer<typeof systemConfigSchema>;
type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;
type ApplicationPreferencesFormData = z.infer<typeof applicationPreferencesSchema>;

interface SystemConfig {
  openaiApiKey?: string;
  automationEnabled: boolean;
  dailyApplicationLimit: number;
  scrapeInterval: number;
}

interface UserProfile {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  address?: string;
  summary?: string;
}

interface ApplicationPreferences {
  preferredJobTypes?: string[];
  salaryExpectation?: string;
  workLocation?: string;
  availabilityDate?: string;
  coverLetterTemplate?: string;
}

export default function Configuration() {
  const [activeTab, setActiveTab] = useState("system");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: systemConfig, isLoading: systemLoading } = useQuery<SystemConfig>({
    queryKey: ['/api/system/config'],
  });

  // Mock user profile and preferences - in real app, these would come from API
  const userProfile: UserProfile = {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    linkedinUrl: "https://linkedin.com/in/johndoe",
    portfolioUrl: "https://johndoe.dev",
    address: "123 Main St, San Francisco, CA 94105",
    summary: "Experienced software developer with expertise in React and Node.js",
  };

  const applicationPreferences: ApplicationPreferences = {
    preferredJobTypes: ["Frontend Developer", "Full Stack Developer"],
    salaryExpectation: "$120,000 - $150,000",
    workLocation: "remote",
    availabilityDate: "2024-01-15",
    coverLetterTemplate: "I am writing to express my interest in the [POSITION] role at [COMPANY]...",
  };

  // Forms
  const systemForm = useForm<SystemConfigFormData>({
    resolver: zodResolver(systemConfigSchema),
    defaultValues: {
      openaiApiKey: systemConfig?.openaiApiKey || "",
      automationEnabled: systemConfig?.automationEnabled || false,
      dailyApplicationLimit: systemConfig?.dailyApplicationLimit || 50,
      scrapeInterval: systemConfig?.scrapeInterval || 60,
    },
  });

  const profileForm = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: userProfile.firstName || "",
      lastName: userProfile.lastName || "",
      email: userProfile.email || "",
      phone: userProfile.phone || "",
      linkedinUrl: userProfile.linkedinUrl || "",
      portfolioUrl: userProfile.portfolioUrl || "",
      address: userProfile.address || "",
      summary: userProfile.summary || "",
    },
  });

  const preferencesForm = useForm<ApplicationPreferencesFormData>({
    resolver: zodResolver(applicationPreferencesSchema),
    defaultValues: {
      preferredJobTypes: applicationPreferences.preferredJobTypes || [],
      salaryExpectation: applicationPreferences.salaryExpectation || "",
      workLocation: applicationPreferences.workLocation || "remote",
      availabilityDate: applicationPreferences.availabilityDate || "",
      coverLetterTemplate: applicationPreferences.coverLetterTemplate || "",
    },
  });

  // Update forms when data loads
  if (systemConfig && !systemLoading) {
    systemForm.reset({
      openaiApiKey: systemConfig.openaiApiKey || "",
      automationEnabled: systemConfig.automationEnabled,
      dailyApplicationLimit: systemConfig.dailyApplicationLimit,
      scrapeInterval: systemConfig.scrapeInterval,
    });
  }

  // Mutations
  const saveSystemConfigMutation = useMutation({
    mutationFn: (data: SystemConfigFormData) => 
      apiRequest("POST", "/api/system/config", data),
    onSuccess: () => {
      toast({
        title: "System Configuration Saved",
        description: "Your system settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/system/config'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to save system configuration",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveProfileMutation = useMutation({
    mutationFn: (data: PersonalInfoFormData) => 
      apiRequest("POST", "/api/user/profile", data),
    onSuccess: () => {
      toast({
        title: "Profile Saved",
        description: "Your personal information has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to save profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const savePreferencesMutation = useMutation({
    mutationFn: (data: ApplicationPreferencesFormData) => 
      apiRequest("POST", "/api/user/preferences", data),
    onSuccess: () => {
      toast({
        title: "Preferences Saved",
        description: "Your application preferences have been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to save preferences",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handlers
  const onSystemConfigSubmit = (data: SystemConfigFormData) => {
    saveSystemConfigMutation.mutate(data);
  };

  const onProfileSubmit = (data: PersonalInfoFormData) => {
    saveProfileMutation.mutate(data);
  };

  const onPreferencesSubmit = (data: ApplicationPreferencesFormData) => {
    savePreferencesMutation.mutate(data);
  };

  const testApiKey = async () => {
    const apiKey = systemForm.getValues("openaiApiKey");
    if (!apiKey) {
      toast({
        title: "No API Key",
        description: "Please enter an OpenAI API key to test.",
        variant: "destructive",
      });
      return;
    }

    try {
      // In a real implementation, this would test the API key
      toast({
        title: "API Key Test",
        description: "Testing API key... (This would test the actual key in production)",
      });
    } catch (error) {
      toast({
        title: "API Key Test Failed",
        description: "The provided API key is invalid or has insufficient permissions.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Topbar 
          title="Configuration"
          subtitle="Manage your system settings, profile, and preferences"
        />
        
        <main className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="system" data-testid="system-tab">
                <span className="material-icon mr-2 text-sm">settings</span>
                System
              </TabsTrigger>
              <TabsTrigger value="profile" data-testid="profile-tab">
                <span className="material-icon mr-2 text-sm">person</span>
                Profile
              </TabsTrigger>
              <TabsTrigger value="preferences" data-testid="preferences-tab">
                <span className="material-icon mr-2 text-sm">tune</span>
                Preferences
              </TabsTrigger>
              <TabsTrigger value="security" data-testid="security-tab">
                <span className="material-icon mr-2 text-sm">security</span>
                Security
              </TabsTrigger>
            </TabsList>

            {/* System Configuration Tab */}
            <TabsContent value="system">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card className="shadow-material">
                    <CardHeader>
                      <h3 className="text-lg font-medium text-gray-900">System Settings</h3>
                      <p className="text-sm text-material-gray">
                        Configure API keys and automation parameters
                      </p>
                    </CardHeader>
                    <CardContent>
                      <Form {...systemForm}>
                        <form onSubmit={systemForm.handleSubmit(onSystemConfigSubmit)} className="space-y-6">
                          {/* API Keys Section */}
                          <div>
                            <h4 className="text-md font-medium text-gray-900 mb-4">API Keys</h4>
                            <div className="space-y-4">
                              <FormField
                                control={systemForm.control}
                                name="openaiApiKey"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center space-x-2">
                                      <span>OpenAI API Key</span>
                                      <Badge variant="outline" className="text-xs">Required for AI features</Badge>
                                    </FormLabel>
                                    <div className="flex space-x-2">
                                      <FormControl>
                                        <Input
                                          type="password"
                                          placeholder="sk-..."
                                          {...field}
                                          data-testid="openai-api-key-input"
                                        />
                                      </FormControl>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        onClick={testApiKey}
                                        data-testid="test-api-key-button"
                                      >
                                        Test
                                      </Button>
                                    </div>
                                    <div className="text-xs text-material-gray">
                                      Used for resume optimization and cover letter generation
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>

                          <Separator />

                          {/* Automation Settings */}
                          <div>
                            <h4 className="text-md font-medium text-gray-900 mb-4">Automation Settings</h4>
                            <div className="space-y-4">
                              <FormField
                                control={systemForm.control}
                                name="automationEnabled"
                                render={({ field }) => (
                                  <FormItem className="flex items-center justify-between">
                                    <FormLabel>Enable Automation</FormLabel>
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        data-testid="automation-enabled-toggle"
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={systemForm.control}
                                name="dailyApplicationLimit"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Daily Application Limit</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min="1"
                                        max="200"
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                        data-testid="daily-limit-input"
                                      />
                                    </FormControl>
                                    <div className="text-xs text-material-gray">
                                      Maximum number of applications to send per day
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={systemForm.control}
                                name="scrapeInterval"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Job Search Interval (minutes)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min="15"
                                        max="1440"
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                        data-testid="scrape-interval-input"
                                      />
                                    </FormControl>
                                    <div className="text-xs text-material-gray">
                                      How often to search for new job postings
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>

                          <Button 
                            type="submit" 
                            disabled={saveSystemConfigMutation.isPending}
                            className="w-full bg-material-blue hover:bg-blue-700"
                            data-testid="save-system-config-button"
                          >
                            {saveSystemConfigMutation.isPending ? "Saving..." : "Save System Configuration"}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <Card className="shadow-material">
                    <CardHeader>
                      <h3 className="text-lg font-medium text-gray-900">System Status</h3>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-900">OpenAI API</span>
                        <Badge 
                          variant="outline" 
                          className={systemConfig?.openaiApiKey ? "text-green-800 border-green-300" : "text-red-800 border-red-300"}
                        >
                          {systemConfig?.openaiApiKey ? "Connected" : "Not Connected"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-900">Automation</span>
                        <Badge 
                          variant="outline" 
                          className={systemConfig?.automationEnabled ? "text-green-800 border-green-300" : "text-gray-800 border-gray-300"}
                        >
                          {systemConfig?.automationEnabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-900">Daily Limit</span>
                        <span className="text-sm text-material-gray">
                          {systemConfig?.dailyApplicationLimit || 50} applications
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-900">Search Interval</span>
                        <span className="text-sm text-material-gray">
                          {systemConfig?.scrapeInterval || 60} minutes
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card className="shadow-material max-w-2xl">
                <CardHeader>
                  <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
                  <p className="text-sm text-material-gray">
                    This information will be used to automatically fill job applications
                  </p>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={profileForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="first-name-input" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="last-name-input" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" {...field} data-testid="email-input" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="phone-input" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={profileForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="address-input" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={profileForm.control}
                          name="linkedinUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>LinkedIn URL (Optional)</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="linkedin-input" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="portfolioUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Portfolio URL (Optional)</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="portfolio-input" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={profileForm.control}
                        name="summary"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Professional Summary</FormLabel>
                            <FormControl>
                              <Textarea 
                                rows={4} 
                                {...field} 
                                data-testid="summary-input"
                              />
                            </FormControl>
                            <div className="text-xs text-material-gray">
                              A brief overview of your experience and skills
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        disabled={saveProfileMutation.isPending}
                        className="w-full bg-material-blue hover:bg-blue-700"
                        data-testid="save-profile-button"
                      >
                        {saveProfileMutation.isPending ? "Saving..." : "Save Profile"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences">
              <Card className="shadow-material max-w-2xl">
                <CardHeader>
                  <h3 className="text-lg font-medium text-gray-900">Application Preferences</h3>
                  <p className="text-sm text-material-gray">
                    Set your job search preferences and default application settings
                  </p>
                </CardHeader>
                <CardContent>
                  <Form {...preferencesForm}>
                    <form onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)} className="space-y-6">
                      <FormField
                        control={preferencesForm.control}
                        name="salaryExpectation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Salary Expectation</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., $120,000 - $150,000"
                                {...field} 
                                data-testid="salary-expectation-input"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={preferencesForm.control}
                        name="workLocation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferred Work Location</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="work-location-select">
                                  <SelectValue placeholder="Select work location preference" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="remote">Remote</SelectItem>
                                <SelectItem value="hybrid">Hybrid</SelectItem>
                                <SelectItem value="onsite">On-site</SelectItem>
                                <SelectItem value="flexible">Flexible</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={preferencesForm.control}
                        name="availabilityDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Availability Date</FormLabel>
                            <FormControl>
                              <Input 
                                type="date"
                                {...field} 
                                data-testid="availability-date-input"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={preferencesForm.control}
                        name="coverLetterTemplate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default Cover Letter Template</FormLabel>
                            <FormControl>
                              <Textarea 
                                rows={6}
                                placeholder="Use [POSITION] and [COMPANY] as placeholders..."
                                {...field} 
                                data-testid="cover-letter-template-input"
                              />
                            </FormControl>
                            <div className="text-xs text-material-gray">
                              Use [POSITION] and [COMPANY] as placeholders for dynamic content
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        disabled={savePreferencesMutation.isPending}
                        className="w-full bg-material-blue hover:bg-blue-700"
                        data-testid="save-preferences-button"
                      >
                        {savePreferencesMutation.isPending ? "Saving..." : "Save Preferences"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-material">
                  <CardHeader>
                    <h3 className="text-lg font-medium text-gray-900">Account Security</h3>
                    <p className="text-sm text-material-gray">
                      Manage your account security settings
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Change Password</div>
                        <div className="text-xs text-material-gray">Update your account password</div>
                      </div>
                      <Button variant="outline" size="sm" data-testid="change-password-button">
                        Change
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Two-Factor Authentication</div>
                        <div className="text-xs text-material-gray">Add an extra layer of security</div>
                      </div>
                      <Button variant="outline" size="sm" data-testid="setup-2fa-button">
                        Setup
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-gray-900">API Access</div>
                        <div className="text-xs text-material-gray">Manage API keys and access tokens</div>
                      </div>
                      <Button variant="outline" size="sm" data-testid="manage-api-access-button">
                        Manage
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-material">
                  <CardHeader>
                    <h3 className="text-lg font-medium text-gray-900">Data & Privacy</h3>
                    <p className="text-sm text-material-gray">
                      Control your data and privacy settings
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Export Data</div>
                        <div className="text-xs text-material-gray">Download your application data</div>
                      </div>
                      <Button variant="outline" size="sm" data-testid="export-data-button">
                        Export
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Delete Account</div>
                        <div className="text-xs text-material-gray">Permanently delete your account</div>
                      </div>
                      <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" data-testid="delete-account-button">
                        Delete
                      </Button>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="material-icon text-material-blue text-sm">info</span>
                        <span className="text-sm font-medium text-material-blue">Privacy Notice</span>
                      </div>
                      <p className="text-xs text-gray-700">
                        Your data is encrypted and stored securely. We never share your personal information with third parties without your consent.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
