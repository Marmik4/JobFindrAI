import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Resume {
  id: string;
  name: string;
  originalFileName: string;
  filePath: string;
  content: string;
  skills: string[];
  isDefault: boolean;
  createdAt: string;
}

export default function ResumeManager() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resumeName, setResumeName] = useState("");
  const [isDefaultResume, setIsDefaultResume] = useState(false);
  const [viewingResume, setViewingResume] = useState<Resume | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: resumes, isLoading } = useQuery<Resume[]>({
    queryKey: ['/api/resumes'],
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error("No file selected");
      
      const formData = new FormData();
      formData.append('resume', selectedFile);
      formData.append('name', resumeName || selectedFile.name);
      formData.append('isDefault', isDefaultResume.toString());

      const response = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Resume Uploaded",
        description: "Your resume has been successfully uploaded and processed.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/resumes'] });
      setSelectedFile(null);
      setResumeName("");
      setIsDefaultResume(false);
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (resumeId: string) => 
      apiRequest(`/api/resumes/${resumeId}`, 'DELETE'),
    onSuccess: () => {
      toast({
        title: "Resume Deleted",
        description: "Resume has been removed from your account.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/resumes'] });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!resumeName) {
        setResumeName(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a resume file to upload.",
        variant: "destructive",
      });
      return;
    }
    uploadMutation.mutate();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const downloadResume = (resume: Resume) => {
    // Create download link
    const downloadUrl = `/api/resumes/${resume.id}/download`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = resume.originalFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download Started",
      description: `Downloading ${resume.originalFileName}`,
    });
  };

  const optimizeResume = useMutation({
    mutationFn: (resumeId: string) => 
      fetch(`/api/resumes/${resumeId}/optimize`, { 
        credentials: 'include' 
      }).then(res => res.json()),
    onSuccess: (data) => {
      toast({
        title: "Resume Analysis Complete",
        description: `Found ${data.suggestions?.length || 0} optimization suggestions`,
      });
    },
    onError: () => {
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze resume for optimization.",
        variant: "destructive",
      });
    },
  });



  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Topbar 
          title="Resume Manager"
          subtitle="Upload and manage your resumes with AI optimization"
        />
        
        <main className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload Panel */}
            <div className="lg:col-span-1">
              <Card className="shadow-material">
                <CardHeader>
                  <h3 className="text-lg font-medium text-gray-900">Upload Resume</h3>
                  <p className="text-sm text-material-gray">
                    Upload PDF or DOC files. AI will automatically extract skills and optimize content.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="resume-file" className="text-sm font-medium text-gray-900">
                      Select File
                    </Label>
                    <Input
                      id="resume-file"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileSelect}
                      className="mt-2"
                      data-testid="resume-file-input"
                    />
                    {selectedFile && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className="material-icon text-material-blue">description</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                            <p className="text-xs text-material-gray">{formatFileSize(selectedFile.size)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="resume-name" className="text-sm font-medium text-gray-900">
                      Resume Name
                    </Label>
                    <Input
                      id="resume-name"
                      value={resumeName}
                      onChange={(e) => setResumeName(e.target.value)}
                      placeholder="e.g., Frontend Developer Resume"
                      className="mt-2"
                      data-testid="resume-name-input"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="default-resume" className="text-sm font-medium text-gray-900">
                      Set as Default
                    </Label>
                    <Switch
                      id="default-resume"
                      checked={isDefaultResume}
                      onCheckedChange={setIsDefaultResume}
                      data-testid="default-resume-toggle"
                    />
                  </div>

                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploadMutation.isPending}
                    className="w-full bg-material-blue hover:bg-blue-700"
                    data-testid="upload-resume-button"
                  >
                    {uploadMutation.isPending ? (
                      <>
                        <span className="material-icon mr-2 animate-spin">sync</span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <span className="material-icon mr-2">upload_file</span>
                        Upload Resume
                      </>
                    )}
                  </Button>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-material-blue mb-2">
                      <span className="material-icon text-sm mr-1">auto_awesome</span>
                      AI Features
                    </h4>
                    <ul className="text-xs text-material-gray space-y-1">
                      <li>• Automatic skill extraction</li>
                      <li>• Job-specific optimization</li>
                      <li>• ATS compatibility check</li>
                      <li>• Keyword matching analysis</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resumes List */}
            <div className="lg:col-span-2">
              <Card className="shadow-material">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Your Resumes</h3>
                    <Badge variant="outline" data-testid="resumes-count">
                      {resumes?.length || 0} resumes
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="space-y-4 p-6">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <Skeleton className="h-5 w-3/4 mb-2" />
                              <Skeleton className="h-4 w-1/2 mb-2" />
                              <div className="flex space-x-2">
                                <Skeleton className="h-6 w-16" />
                                <Skeleton className="h-6 w-20" />
                                <Skeleton className="h-6 w-18" />
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Skeleton className="h-8 w-20" />
                              <Skeleton className="h-8 w-20" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : resumes && resumes.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {resumes.map((resume) => (
                        <div 
                          key={resume.id} 
                          className="p-6 hover:bg-gray-50 transition-colors"
                          data-testid={`resume-${resume.id}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 
                                  className="text-lg font-medium text-gray-900"
                                  data-testid={`resume-name-${resume.id}`}
                                >
                                  {resume.name}
                                </h4>
                                {resume.isDefault && (
                                  <Badge className="bg-material-green text-white">Default</Badge>
                                )}
                              </div>
                              
                              <p className="text-sm text-material-gray mb-3">
                                {resume.originalFileName} • Uploaded {formatDate(resume.createdAt)}
                              </p>

                              {resume.skills && resume.skills.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {resume.skills.slice(0, 6).map((skill) => (
                                    <Badge 
                                      key={skill} 
                                      variant="secondary" 
                                      className="text-xs px-2 py-1"
                                      data-testid={`skill-${skill}`}
                                    >
                                      {skill}
                                    </Badge>
                                  ))}
                                  {resume.skills.length > 6 && (
                                    <Badge variant="outline" className="text-xs px-2 py-1">
                                      +{resume.skills.length - 6} more
                                    </Badge>
                                  )}
                                </div>
                              )}

                              <div className="text-xs text-material-gray">
                                <span className="material-icon text-sm mr-1">description</span>
                                {resume.content.length} characters
                              </div>
                            </div>

                            <div className="flex flex-col space-y-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setViewingResume(resume)}
                                data-testid={`view-resume-${resume.id}`}
                              >
                                <span className="material-icon text-sm mr-2">visibility</span>
                                View
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadResume(resume)}
                                data-testid={`download-resume-${resume.id}`}
                              >
                                <span className="material-icon text-sm mr-2">download</span>
                                Download
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                className="text-material-blue border-material-blue hover:bg-blue-50"
                                onClick={() => optimizeResume.mutate(resume.id)}
                                disabled={optimizeResume.isPending}
                                data-testid={`optimize-resume-${resume.id}`}
                              >
                                <span className="material-icon text-sm mr-2">
                                  {optimizeResume.isPending ? "sync" : "auto_awesome"}
                                </span>
                                {optimizeResume.isPending ? "Analyzing..." : "Optimize"}
                              </Button>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                    data-testid={`delete-resume-${resume.id}`}
                                  >
                                    <span className="material-icon text-sm mr-2">delete</span>
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Resume</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{resume.name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteMutation.mutate(resume.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span className="material-icon text-material-gray text-2xl">description</span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No resumes uploaded</h3>
                      <p className="text-material-gray mb-4">
                        Upload your first resume to get started with AI-powered job applications.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('resume-file')?.click()}
                      >
                        <span className="material-icon mr-2">upload_file</span>
                        Upload Resume
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Resume View Dialog */}
      <Dialog open={!!viewingResume} onOpenChange={() => setViewingResume(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="resume-dialog-description">
          <DialogHeader>
            <DialogTitle>
              {viewingResume?.name || "Resume"}
            </DialogTitle>
            <div id="resume-dialog-description" className="sr-only">
              View resume details, content preview, and download options
            </div>
          </DialogHeader>
          <div className="space-y-4">
            {viewingResume && (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="font-medium">File Name:</Label>
                    <p className="text-material-gray">{viewingResume.originalFileName}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Uploaded:</Label>
                    <p className="text-material-gray">{formatDate(viewingResume.createdAt)}</p>
                  </div>
                </div>
                
                {viewingResume.skills && viewingResume.skills.length > 0 && (
                  <div>
                    <Label className="font-medium">Skills:</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {viewingResume.skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label className="font-medium">Content Preview:</Label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
                    {viewingResume.content && viewingResume.content.length > 50 ? (
                      <div className="text-sm text-gray-900">
                        <p className="mb-2 font-medium">Resume Summary:</p>
                        <div className="whitespace-pre-wrap">
                          {viewingResume.content.substring(0, 500)}
                          {viewingResume.content.length > 500 && "..."}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <span className="material-icon text-4xl text-gray-400 mb-2 block">description</span>
                        <p className="text-gray-600">PDF content available for download</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Use the download button to view the full resume
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => downloadResume(viewingResume)}
                  >
                    <span className="material-icon mr-2 text-sm">download</span>
                    Download
                  </Button>
                  <Button
                    onClick={() => {
                      optimizeResume.mutate(viewingResume.id);
                      setViewingResume(null);
                    }}
                    disabled={optimizeResume.isPending}
                    className="bg-material-blue hover:bg-blue-700"
                  >
                    <span className="material-icon mr-2 text-sm">auto_awesome</span>
                    Optimize
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
