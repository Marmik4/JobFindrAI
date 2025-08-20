import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
}

interface Resume {
  id: string;
  name: string;
}

interface CoverLetter {
  id: string;
  jobId: string;
  content: string;
  isGenerated: boolean;
  generatedAt: string;
  job?: Job;
}

export default function CoverLetters() {
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [selectedResume, setSelectedResume] = useState<string>("");
  const [applicantName, setApplicantName] = useState("John Doe");
  const [editingLetter, setEditingLetter] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobs, isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ['/api/jobs'],
  });

  const { data: resumes, isLoading: resumesLoading } = useQuery<Resume[]>({
    queryKey: ['/api/resumes'],
  });

  const { data: coverLetters, isLoading: lettersLoading } = useQuery<CoverLetter[]>({
    queryKey: ['/api/cover-letters'],
  });

  const generateMutation = useMutation({
    mutationFn: (data: { jobId: string; resumeId: string; applicantName: string }) =>
      apiRequest("POST", "/api/cover-letters/generate", data),
    onSuccess: async (response) => {
      const data = await response.json();
      setEditingLetter(data.content);
      toast({
        title: "Cover Letter Generated",
        description: "AI has created a personalized cover letter for this position.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cover-letters'] });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!selectedJob || !selectedResume || !applicantName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a job, resume, and enter your name.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    generateMutation.mutate({
      jobId: selectedJob,
      resumeId: selectedResume,
      applicantName: applicantName.trim(),
    });
    setIsGenerating(false);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getJobTitle = (jobId: string): string => {
    const job = jobs?.find(j => j.id === jobId);
    return job ? `${job.title} at ${job.company}` : 'Unknown Position';
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Topbar 
          title="Cover Letters"
          subtitle="Generate AI-powered cover letters tailored to specific positions"
        />
        
        <main className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Generator Panel */}
            <div className="lg:col-span-1">
              <Card className="shadow-material">
                <CardHeader>
                  <h3 className="text-lg font-medium text-gray-900">Generate Cover Letter</h3>
                  <p className="text-sm text-material-gray">
                    AI will create a personalized cover letter matching your resume to the job requirements.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="applicant-name" className="text-sm font-medium text-gray-900">
                      Your Name
                    </Label>
                    <Input
                      id="applicant-name"
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      placeholder="Enter your full name"
                      className="mt-2"
                      data-testid="applicant-name-input"
                    />
                  </div>

                  <div>
                    <Label htmlFor="job-select" className="text-sm font-medium text-gray-900">
                      Select Job
                    </Label>
                    <Select value={selectedJob} onValueChange={setSelectedJob}>
                      <SelectTrigger className="mt-2" data-testid="job-select">
                        <SelectValue placeholder="Choose a job position" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobsLoading ? (
                          <SelectItem value="" disabled>Loading jobs...</SelectItem>
                        ) : jobs && jobs.length > 0 ? (
                          jobs.map((job) => (
                            <SelectItem key={job.id} value={job.id}>
                              {job.title} - {job.company}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>No jobs available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="resume-select" className="text-sm font-medium text-gray-900">
                      Select Resume
                    </Label>
                    <Select value={selectedResume} onValueChange={setSelectedResume}>
                      <SelectTrigger className="mt-2" data-testid="resume-select">
                        <SelectValue placeholder="Choose your resume" />
                      </SelectTrigger>
                      <SelectContent>
                        {resumesLoading ? (
                          <SelectItem value="" disabled>Loading resumes...</SelectItem>
                        ) : resumes && resumes.length > 0 ? (
                          resumes.map((resume) => (
                            <SelectItem key={resume.id} value={resume.id}>
                              {resume.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>No resumes available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={generateMutation.isPending || isGenerating}
                    className="w-full bg-material-green hover:bg-green-700"
                    data-testid="generate-cover-letter-button"
                  >
                    {generateMutation.isPending || isGenerating ? (
                      <>
                        <span className="material-icon mr-2 animate-spin">sync</span>
                        Generating...
                      </>
                    ) : (
                      <>
                        <span className="material-icon mr-2">auto_awesome</span>
                        Generate Cover Letter
                      </>
                    )}
                  </Button>

                  {editingLetter && (
                    <div className="mt-6">
                      <Label htmlFor="generated-letter" className="text-sm font-medium text-gray-900">
                        Generated Cover Letter
                      </Label>
                      <Textarea
                        id="generated-letter"
                        value={editingLetter}
                        onChange={(e) => setEditingLetter(e.target.value)}
                        rows={12}
                        className="mt-2 text-sm"
                        placeholder="Your generated cover letter will appear here..."
                        data-testid="generated-cover-letter"
                      />
                      <div className="flex space-x-2 mt-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <span className="material-icon text-sm mr-1">copy</span>
                          Copy
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <span className="material-icon text-sm mr-1">download</span>
                          Download
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 p-4 bg-green-50 rounded-lg">
                    <h4 className="text-sm font-medium text-material-green mb-2">
                      <span className="material-icon text-sm mr-1">tips_and_updates</span>
                      AI Writing Tips
                    </h4>
                    <ul className="text-xs text-material-gray space-y-1">
                      <li>• Highlights relevant experience</li>
                      <li>• Matches job requirements</li>
                      <li>• Professional tone and structure</li>
                      <li>• Company-specific customization</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cover Letters List */}
            <div className="lg:col-span-2">
              <Card className="shadow-material">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Your Cover Letters</h3>
                    <Badge variant="outline" data-testid="cover-letters-count">
                      {coverLetters?.length || 0} letters
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {lettersLoading ? (
                    <div className="space-y-4 p-6">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <Skeleton className="h-5 w-3/4 mb-2" />
                              <Skeleton className="h-4 w-1/2 mb-2" />
                              <Skeleton className="h-16 w-full" />
                            </div>
                            <div className="flex space-x-2 ml-4">
                              <Skeleton className="h-8 w-20" />
                              <Skeleton className="h-8 w-20" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : coverLetters && coverLetters.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {coverLetters.map((letter) => (
                        <div 
                          key={letter.id} 
                          className="p-6 hover:bg-gray-50 transition-colors"
                          data-testid={`cover-letter-${letter.id}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 
                                  className="text-lg font-medium text-gray-900"
                                  data-testid={`letter-job-title-${letter.id}`}
                                >
                                  {getJobTitle(letter.jobId)}
                                </h4>
                                {letter.isGenerated && (
                                  <Badge className="bg-material-green text-white">
                                    <span className="material-icon text-xs mr-1">auto_awesome</span>
                                    AI Generated
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-sm text-material-gray mb-3">
                                Created {formatDate(letter.generatedAt)}
                              </p>

                              <div className="bg-gray-50 rounded-lg p-4 mb-3">
                                <p 
                                  className="text-sm text-gray-700 line-clamp-4"
                                  data-testid={`letter-preview-${letter.id}`}
                                >
                                  {letter.content.substring(0, 200)}...
                                </p>
                              </div>

                              <div className="text-xs text-material-gray">
                                <span className="material-icon text-sm mr-1">text_fields</span>
                                {letter.content.split(' ').length} words
                              </div>
                            </div>

                            <div className="flex flex-col space-y-2 ml-4">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    data-testid={`view-letter-${letter.id}`}
                                  >
                                    <span className="material-icon text-sm mr-2">visibility</span>
                                    View
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>{getJobTitle(letter.jobId)}</DialogTitle>
                                  </DialogHeader>
                                  <div className="mt-4">
                                    <Textarea
                                      value={letter.content}
                                      readOnly
                                      rows={20}
                                      className="text-sm"
                                    />
                                  </div>
                                </DialogContent>
                              </Dialog>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                data-testid={`edit-letter-${letter.id}`}
                              >
                                <span className="material-icon text-sm mr-2">edit</span>
                                Edit
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                data-testid={`copy-letter-${letter.id}`}
                              >
                                <span className="material-icon text-sm mr-2">copy</span>
                                Copy
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                data-testid={`download-letter-${letter.id}`}
                              >
                                <span className="material-icon text-sm mr-2">download</span>
                                Download
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span className="material-icon text-material-gray text-2xl">mail</span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No cover letters yet</h3>
                      <p className="text-material-gray mb-4">
                        Generate your first AI-powered cover letter to get started.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (jobs && jobs.length > 0) {
                            setSelectedJob(jobs[0].id);
                          }
                          if (resumes && resumes.length > 0) {
                            setSelectedResume(resumes[0].id);
                          }
                        }}
                        disabled={!jobs?.length || !resumes?.length}
                      >
                        <span className="material-icon mr-2">auto_awesome</span>
                        Generate Cover Letter
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
