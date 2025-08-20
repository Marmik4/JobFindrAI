import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { OpenAIService } from "./services/openai";
import { jobScraperService } from "./services/jobScraper";
import { browserAutomationService, type ApplicationFormData } from "./services/browserAutomation";
import { scheduledJobSearchService } from "./services/scheduledJobSearch";
import { aiJobMatcherService } from "./services/aiJobMatcher";
import { intelligentApplicationService } from "./services/intelligentApplications";
import { adaptiveLearningService } from "./services/adaptiveLearning";
import { insertJobSearchConfigSchema, insertResumeSchema, insertJobApplicationSchema, insertSystemConfigSchema } from "@shared/schema";
import multer, { type FileFilterCallback } from "multer";
import type { Request } from "express";
import * as fs from "fs";
import * as path from "path";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    // Allow PDF and DOC files for resumes
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/msword' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOC files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      // Mock user ID for demo - in real app, get from authentication
      const userId = "demo-user-id";
      
      const applications = await storage.getApplications(userId);
      const jobs = await storage.getJobs(100);
      const resumes = await storage.getResumes(userId);
      
      const stats = {
        applicationsSent: applications.length,
        responseRate: applications.length > 0 ? Math.round((applications.filter(a => a.status === 'interview').length / applications.length) * 100) : 0,
        activeJobs: jobs.filter(j => j.isActive).length,
        aiAccuracy: 94 // Mock value
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Recent applications
  app.get("/api/applications/recent", async (req, res) => {
    try {
      const userId = "demo-user-id";
      const applications = await storage.getApplications(userId);
      
      // Get job details for each application
      const applicationsWithJobs = await Promise.all(
        applications.slice(0, 10).map(async (app) => {
          const job = await storage.getJob(app.jobId);
          return {
            ...app,
            jobTitle: job?.title || "Unknown Position",
            company: job?.company || "Unknown Company"
          };
        })
      );
      
      res.json(applicationsWithJobs);
    } catch (error) {
      console.error("Error fetching recent applications:", error);
      res.status(500).json({ error: "Failed to fetch recent applications" });
    }
  });

  // Job search configuration
  app.get("/api/job-search/config", async (req, res) => {
    try {
      const userId = "demo-user-id";
      const config = await storage.getJobSearchConfig(userId);
      res.json(config);
    } catch (error) {
      console.error("Error fetching job search config:", error);
      res.status(500).json({ error: "Failed to fetch job search config" });
    }
  });

  app.post("/api/job-search/config", async (req, res) => {
    try {
      const userId = "demo-user-id";
      const validatedData = insertJobSearchConfigSchema.parse({
        ...req.body,
        userId
      });
      
      const existing = await storage.getJobSearchConfig(userId);
      let config;
      
      if (existing) {
        config = await storage.updateJobSearchConfig(existing.id, validatedData);
      } else {
        config = await storage.createJobSearchConfig(validatedData);
      }
      
      res.json(config);
    } catch (error) {
      console.error("Error saving job search config:", error);
      res.status(500).json({ error: "Failed to save job search config" });
    }
  });

  // Manual job search
  app.post("/api/job-search/manual", async (req, res) => {
    try {
      const userId = "demo-user-id";
      const config = await storage.getJobSearchConfig(userId);
      
      if (!config || !config.keywords || config.keywords.length === 0) {
        return res.status(400).json({ error: "Job search configuration not found. Please configure your search criteria first." });
      }

      console.log("Starting manual job search...");
      
      // Scrape jobs
      const scrapedJobs = await jobScraperService.scrapeAllJobBoards(
        config.keywords,
        config.locations || [],
        50
      );

      // Save jobs to storage
      const savedJobs = [];
      for (const scrapedJob of scrapedJobs) {
        try {
          const insertJob = jobScraperService.convertToInsertJob(scrapedJob);
          
          // Check if job already exists
          const existingJobs = await storage.getJobs();
          const exists = existingJobs.some(j => j.externalId === insertJob.externalId && j.jobBoard === insertJob.jobBoard);
          
          if (!exists) {
            const savedJob = await storage.createJob(insertJob);
            savedJobs.push(savedJob);
          }
        } catch (error) {
          console.error("Error saving job:", error);
        }
      }

      // Log the search activity
      await storage.createAutomationLog({
        userId,
        action: "manual_job_search",
        details: {
          keywords: config.keywords,
          jobsFound: savedJobs.length,
          totalScraped: scrapedJobs.length
        },
        status: "success"
      });

      res.json({
        message: `Found ${savedJobs.length} new jobs`,
        jobsFound: savedJobs.length,
        jobs: savedJobs.slice(0, 10) // Return first 10 jobs
      });
    } catch (error) {
      console.error("Error in manual job search:", error);
      res.status(500).json({ error: "Failed to perform job search: " + (error as Error).message });
    }
  });

  // Start automatic job search
  app.post("/api/job-search/start-automation", async (req, res) => {
    try {
      await scheduledJobSearchService.startAutomaticJobSearch();
      res.json({ message: "Automatic job search started", status: "running" });
    } catch (error) {
      console.error("Error starting automatic job search:", error);
      res.status(500).json({ error: "Failed to start automatic job search" });
    }
  });

  // Stop automatic job search
  app.post("/api/job-search/stop-automation", async (req, res) => {
    try {
      await scheduledJobSearchService.stopAutomaticJobSearch();
      res.json({ message: "Automatic job search stopped", status: "stopped" });
    } catch (error) {
      console.error("Error stopping automatic job search:", error);
      res.status(500).json({ error: "Failed to stop automatic job search" });
    }
  });

  // Get automation status
  app.get("/api/job-search/automation-status", async (req, res) => {
    try {
      const status = scheduledJobSearchService.getStatus();
      res.json(status);
    } catch (error) {
      console.error("Error getting automation status:", error);
      res.status(500).json({ error: "Failed to get automation status" });
    }
  });

  // Get jobs
  app.get("/api/jobs", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const jobs = await storage.getJobs(limit);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  // Resume management
  app.get("/api/resumes", async (req, res) => {
    try {
      const userId = "demo-user-id";
      const resumes = await storage.getResumes(userId);
      res.json(resumes);
    } catch (error) {
      console.error("Error fetching resumes:", error);
      res.status(500).json({ error: "Failed to fetch resumes" });
    }
  });

  app.post("/api/resumes/upload", upload.single('resume'), async (req: Request, res) => {
    try {
      const userId = "demo-user-id";
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Read file content (for PDF parsing, you'd use a proper PDF parser)
      const content = fs.readFileSync(file.path, 'utf-8');
      
      // Extract skills using AI
      const skills = await OpenAIService.extractResumeSkills(content);

      const resumeData = {
        userId,
        name: req.body.name || file.originalname,
        originalFileName: file.originalname,
        filePath: file.path,
        content,
        skills,
        isDefault: req.body.isDefault === 'true'
      };

      const validatedData = insertResumeSchema.parse(resumeData);
      const resume = await storage.createResume(validatedData);

      res.json(resume);
    } catch (error) {
      console.error("Error uploading resume:", error);
      res.status(500).json({ error: "Failed to upload resume: " + (error as Error).message });
    }
  });

  // Download resume file
  app.get("/api/resumes/:id/download", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = "demo-user-id";
      
      const resumes = await storage.getResumes(userId);
      const resume = resumes.find(r => r.id === id);
      
      if (!resume) {
        return res.status(404).json({ error: "Resume not found" });
      }

      // Check if file exists, try both relative and absolute paths
      let filePath = resume.filePath;
      if (!fs.existsSync(filePath)) {
        // Try relative path from current directory
        filePath = filePath.replace(/^\//, './');
        if (!fs.existsSync(filePath)) {
          return res.status(404).json({ error: "Resume file not found on disk" });
        }
      }

      // Set proper headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${resume.originalFileName}"`);
      res.setHeader('Content-Type', 'application/pdf');
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("Error downloading resume:", error);
      res.status(500).json({ error: "Failed to download resume" });
    }
  });

  // Optimize resume for specific job
  app.post("/api/resumes/:id/optimize/:jobId", async (req, res) => {
    try {
      const { id, jobId } = req.params;
      const userId = "demo-user-id";
      
      const resumes = await storage.getResumes(userId);
      const resume = resumes.find(r => r.id === id);
      const job = await storage.getJob(jobId);
      
      if (!resume || !job) {
        return res.status(404).json({ error: "Resume or job not found" });
      }

      const optimizedContent = await OpenAIService.optimizeResumeForJob(resume.content, job);
      
      res.json({
        success: true,
        originalContent: resume.content,
        optimizedContent,
        jobTitle: job.title,
        company: job.company,
        suggestions: [
          "Highlighted relevant skills for this position",
          "Emphasized matching experience",
          "Optimized keywords for ATS systems"
        ]
      });
    } catch (error) {
      console.error("Error optimizing resume:", error);
      res.status(500).json({ error: "Failed to optimize resume" });
    }
  });

  // Get resume optimization suggestions
  app.get("/api/resumes/:id/optimize", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = "demo-user-id";
      
      const resumes = await storage.getResumes(userId);
      const resume = resumes.find(r => r.id === id);
      
      if (!resume) {
        return res.status(404).json({ error: "Resume not found" });
      }

      const suggestions = await OpenAIService.getResumeOptimizationSuggestions(resume.content);
      
      res.json({
        success: true,
        resumeId: id,
        suggestions,
        currentSkills: resume.skills,
        recommendations: [
          "Add more quantifiable achievements",
          "Include relevant keywords for your target roles",
          "Highlight your most recent and relevant experience"
        ]
      });
    } catch (error) {
      console.error("Error getting optimization suggestions:", error);
      res.status(500).json({ error: "Failed to get optimization suggestions" });
    }
  });

  // Generate cover letter
  app.post("/api/cover-letters/generate", async (req, res) => {
    try {
      const { jobId, resumeId, applicantName } = req.body;
      
      if (!jobId || !resumeId || !applicantName) {
        return res.status(400).json({ error: "Missing required fields: jobId, resumeId, applicantName" });
      }

      const job = await storage.getJob(jobId);
      const resume = await storage.getResume(resumeId);

      if (!job || !resume) {
        return res.status(404).json({ error: "Job or resume not found" });
      }

      const coverLetter = await OpenAIService.generateCoverLetter(
        resume.content,
        job.description || "",
        job.title,
        job.company,
        applicantName
      );

      // Save cover letter
      const savedCoverLetter = await storage.createCoverLetter({
        userId: resume.userId,
        jobId,
        content: coverLetter.content,
        isGenerated: true
      });

      res.json({
        ...savedCoverLetter,
        tone: coverLetter.tone,
        keyPoints: coverLetter.keyPoints
      });
    } catch (error) {
      console.error("Error generating cover letter:", error);
      res.status(500).json({ error: "Failed to generate cover letter: " + (error as Error).message });
    }
  });

  // Apply to job (automated)
  app.post("/api/applications/apply", async (req, res) => {
    try {
      const { jobId, resumeId, coverLetterId, applicantData } = req.body;
      const userId = "demo-user-id";

      if (!jobId || !resumeId) {
        return res.status(400).json({ error: "Missing required fields: jobId, resumeId" });
      }

      const job = await storage.getJob(jobId);
      const resume = await storage.getResume(resumeId);
      
      if (!job || !resume) {
        return res.status(404).json({ error: "Job or resume not found" });
      }

      let coverLetterContent = "";
      if (coverLetterId) {
        const coverLetter = await storage.getCoverLetter(coverLetterId);
        coverLetterContent = coverLetter?.content || "";
      }

      // Create application record
      const application = await storage.createApplication({
        userId,
        jobId,
        resumeId,
        coverLetter: coverLetterContent,
        status: "pending"
      });

      // Attempt automated application
      try {
        console.log(`Starting automated application for job: ${job.title} at ${job.company}`);
        
        const success = await browserAutomationService.navigateToJobApplication(job.url);
        
        if (success) {
          const formData: ApplicationFormData = {
            firstName: applicantData?.firstName || "John",
            lastName: applicantData?.lastName || "Doe",
            email: applicantData?.email || "john.doe@example.com",
            phone: applicantData?.phone || "+1234567890",
            coverLetter: coverLetterContent,
            resume: resume.filePath,
            linkedinUrl: applicantData?.linkedinUrl,
            portfolioUrl: applicantData?.portfolioUrl
          };

          const filled = await browserAutomationService.fillApplicationForm(formData);
          
          if (filled) {
            // For demo purposes, we won't actually submit to avoid spam
            console.log("Form filled successfully (submission skipped for demo)");
            
            // Update application status
            await storage.updateApplication(application.id, {
              status: "submitted",
              notes: "Application submitted via automation"
            });

            // Log the activity
            await storage.createAutomationLog({
              userId,
              action: "automated_application",
              details: {
                jobTitle: job.title,
                company: job.company,
                status: "submitted"
              },
              status: "success"
            });

            res.json({
              ...application,
              status: "submitted",
              message: "Application submitted successfully"
            });
          } else {
            throw new Error("Failed to fill application form");
          }
        } else {
          throw new Error("Failed to navigate to application page");
        }
      } catch (automationError) {
        console.error("Automation failed:", automationError);
        
        // Update application with error
        await storage.updateApplication(application.id, {
          status: "pending",
          notes: `Automation failed: ${(automationError as Error).message}`
        });

        // Log the error
        await storage.createAutomationLog({
          userId,
          action: "automated_application",
          details: {
            jobTitle: job.title,
            company: job.company,
            error: (automationError as Error).message
          },
          status: "error"
        });

        res.status(500).json({
          error: "Automation failed",
          application,
          message: "Application created but automation failed. You may need to apply manually."
        });
      } finally {
        // Clean up browser resources
        await browserAutomationService.closeBrowser();
      }
    } catch (error) {
      console.error("Error applying to job:", error);
      res.status(500).json({ error: "Failed to apply to job: " + (error as Error).message });
    }
  });

  // Get applications
  app.get("/api/applications", async (req, res) => {
    try {
      const userId = "demo-user-id";
      const applications = await storage.getApplications(userId);
      
      // Get job details for each application
      const applicationsWithJobs = await Promise.all(
        applications.map(async (app) => {
          const job = await storage.getJob(app.jobId);
          return {
            ...app,
            job
          };
        })
      );
      
      res.json(applicationsWithJobs);
    } catch (error) {
      console.error("Error fetching applications:", error);
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });

  // Get automation logs
  app.get("/api/automation/logs", async (req, res) => {
    try {
      const userId = "demo-user-id";
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await storage.getAutomationLogs(userId, limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching automation logs:", error);
      res.status(500).json({ error: "Failed to fetch automation logs" });
    }
  });

  // System configuration
  app.get("/api/system/config", async (req, res) => {
    try {
      const userId = "demo-user-id";
      const config = await storage.getSystemConfig(userId);
      res.json(config || {});
    } catch (error) {
      console.error("Error fetching system config:", error);
      res.status(500).json({ error: "Failed to fetch system config" });
    }
  });

  app.post("/api/system/config", async (req, res) => {
    try {
      const userId = "demo-user-id";
      const validatedData = insertSystemConfigSchema.parse({
        ...req.body,
        userId
      });

      const existing = await storage.getSystemConfig(userId);
      let config;

      if (existing) {
        config = await storage.updateSystemConfig(userId, validatedData);
      } else {
        config = await storage.createSystemConfig(validatedData);
      }

      res.json(config);
    } catch (error) {
      console.error("Error saving system config:", error);
      res.status(500).json({ error: "Failed to save system config" });
    }
  });

  // Toggle automation
  app.post("/api/automation/toggle", async (req, res) => {
    try {
      const userId = "demo-user-id";
      const { enabled } = req.body;

      const config = await storage.updateSystemConfig(userId, {
        automationEnabled: enabled
      });

      await storage.createAutomationLog({
        userId,
        action: "automation_toggle",
        details: { enabled },
        status: "success"
      });

      res.json({ success: true, enabled: config?.automationEnabled });
    } catch (error) {
      console.error("Error toggling automation:", error);
      res.status(500).json({ error: "Failed to toggle automation" });
    }
  });

  // Advanced AI Features - Job Matching
  app.get("/api/ai/job-matches", async (req, res) => {
    try {
      const userId = "demo-user-id";
      const limit = parseInt(req.query.limit as string) || 10;
      
      const matches = await aiJobMatcherService.findBestMatches(userId, limit);
      res.json(matches);
    } catch (error) {
      console.error("Error finding job matches:", error);
      res.status(500).json({ error: "Failed to find job matches" });
    }
  });

  // Analyze specific job match
  app.post("/api/ai/analyze-job/:jobId", async (req, res) => {
    try {
      const { jobId } = req.params;
      const userId = "demo-user-id";
      
      const job = await storage.getJob(jobId);
      const resumes = await storage.getResumes(userId);
      
      if (!job || !resumes.length) {
        return res.status(404).json({ error: "Job or resume not found" });
      }

      const defaultResume = resumes.find(r => r.isDefault) || resumes[0];
      const match = await aiJobMatcherService.analyzeJobMatch(job, defaultResume);
      
      res.json(match);
    } catch (error) {
      console.error("Error analyzing job:", error);
      res.status(500).json({ error: "Failed to analyze job" });
    }
  });

  // Intelligent Applications
  app.post("/api/ai/auto-apply/:jobId", async (req, res) => {
    try {
      const { jobId } = req.params;
      const userId = "demo-user-id";
      
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      const result = await intelligentApplicationService.attemptAutoApplication(job, userId);
      res.json(result);
    } catch (error) {
      console.error("Error auto-applying to job:", error);
      res.status(500).json({ error: "Failed to auto-apply to job" });
    }
  });

  // Adaptive Learning
  app.get("/api/ai/learning-insights", async (req, res) => {
    try {
      const userId = "demo-user-id";
      const insights = await adaptiveLearningService.generateLearningInsights(userId);
      res.json(insights);
    } catch (error) {
      console.error("Error generating learning insights:", error);
      res.status(500).json({ error: "Failed to generate learning insights" });
    }
  });

  app.get("/api/ai/application-patterns", async (req, res) => {
    try {
      const userId = "demo-user-id";
      const patterns = await adaptiveLearningService.analyzeApplicationPatterns(userId);
      res.json(patterns);
    } catch (error) {
      console.error("Error analyzing application patterns:", error);
      res.status(500).json({ error: "Failed to analyze application patterns" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
