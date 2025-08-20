import { storage } from "../storage";
import { OpenAIService } from "./openai";
import { browserAutomationService } from "./browserAutomation";
import { aiJobMatcherService } from "./aiJobMatcher";
import { Job, Resume, InsertJobApplication, InsertCoverLetter } from "@shared/schema";

interface AutoApplicationResult {
  success: boolean;
  jobId: string;
  applicationId?: string;
  coverLetterId?: string;
  error?: string;
  matchScore: number;
}

export class IntelligentApplicationService {
  
  async shouldAutoApply(job: Job, userId: string): Promise<{shouldApply: boolean, reason: string, score: number}> {
    try {
      const resumes = await storage.getResumes(userId);
      if (!resumes.length) {
        return { shouldApply: false, reason: "No resume found", score: 0 };
      }

      const defaultResume = resumes.find(r => r.isDefault) || resumes[0];
      const matchScore = await aiJobMatcherService.analyzeJobMatch(job, defaultResume);

      // Auto-apply criteria
      const minScore = 75; // Only apply to jobs with 75%+ match
      const hasRequiredSkills = matchScore.skillsMatch.length >= 3;
      const salaryAcceptable = matchScore.salaryMatch;
      
      if (matchScore.score >= minScore && hasRequiredSkills && salaryAcceptable) {
        return { 
          shouldApply: true, 
          reason: `High match score (${matchScore.score}%) with ${matchScore.skillsMatch.length} matching skills`, 
          score: matchScore.score 
        };
      }

      return { 
        shouldApply: false, 
        reason: `Score too low (${matchScore.score}%) or missing key requirements`, 
        score: matchScore.score 
      };

    } catch (error) {
      console.error('Error evaluating auto-apply criteria:', error);
      return { shouldApply: false, reason: "Analysis failed", score: 0 };
    }
  }

  async generateOptimizedCoverLetter(job: Job, resume: Resume): Promise<string> {
    try {
      const prompt = `
        Generate a highly personalized cover letter for this job application.
        Make it compelling, specific, and tailored to the company and role.

        JOB DETAILS:
        Company: ${job.company}
        Position: ${job.title}
        Location: ${job.location}
        Description: ${job.description}
        Requirements: ${job.requirements}

        CANDIDATE DETAILS:
        Resume: ${resume.content}
        Skills: ${resume.skills?.join(', ')}
        Experience: ${JSON.stringify(resume.experience)}

        INSTRUCTIONS:
        - Keep it professional but engaging
        - Highlight 2-3 most relevant experiences
        - Show genuine interest in the company
        - Mention specific skills that match the requirements
        - Keep it under 300 words
        - Don't use placeholder text or generic phrases
        - Make it sound human and authentic
      `;

      const coverLetter = await OpenAIService.generateText(prompt);
      return coverLetter.trim();

    } catch (error) {
      console.error('Error generating cover letter:', error);
      
      // Fallback template
      return `Dear ${job.company} Hiring Team,

I am excited to apply for the ${job.title} position. With my background in software development and expertise in the technologies mentioned in your job posting, I believe I would be a strong addition to your team.

My experience includes working with various programming languages and frameworks, and I am passionate about creating innovative solutions. I am particularly drawn to ${job.company} because of your commitment to excellence and innovation.

I would welcome the opportunity to discuss how my skills and enthusiasm can contribute to your team's success.

Best regards,
[Your Name]`;
    }
  }

  async attemptAutoApplication(job: Job, userId: string): Promise<AutoApplicationResult> {
    console.log(`🤖 Attempting auto-application for: ${job.title} at ${job.company}`);
    
    try {
      // Step 1: Check if we should auto-apply
      const evaluation = await this.shouldAutoApply(job, userId);
      if (!evaluation.shouldApply) {
        return {
          success: false,
          jobId: job.id,
          error: evaluation.reason,
          matchScore: evaluation.score
        };
      }

      console.log(`✅ Auto-apply approved: ${evaluation.reason}`);

      // Step 2: Get user's resume
      const resumes = await storage.getResumes(userId);
      const defaultResume = resumes.find(r => r.isDefault) || resumes[0];

      // Step 3: Generate optimized cover letter
      const coverLetterContent = await this.generateOptimizedCoverLetter(job, defaultResume);
      
      const coverLetter = await storage.createCoverLetter({
        userId,
        jobId: job.id,
        content: coverLetterContent,
        isGenerated: true
      });

      console.log(`📝 Generated cover letter for ${job.company}`);

      // Step 4: Create application record
      const application = await storage.createApplication({
        userId,
        jobId: job.id,
        resumeId: defaultResume.id,
        coverLetter: coverLetterContent,
        status: "pending",
        notes: `Auto-applied via AI system. Match score: ${evaluation.score}%`
      });

      // Step 5: Attempt browser automation (if job has application URL)
      let browserResult: any = null;
      if (job.url && job.url.includes('apply')) {
        try {
          browserResult = await browserAutomationService.submitApplication({
            jobUrl: job.url,
            resumeFile: defaultResume.filePath || '',
            coverLetter: coverLetterContent,
            personalInfo: {
              name: defaultResume.name || 'John Doe',
              email: 'john.doe@email.com', // This should come from user config
              phone: '(555) 123-4567'
            }
          });

          if (browserResult && browserResult.success) {
            await storage.updateApplication(application.id, {
              status: "submitted",
              notes: application.notes + ' | Browser automation successful'
            });
            console.log(`🎯 Successfully auto-applied to ${job.company}`);
          }
        } catch (browserError) {
          console.error(`Browser automation failed for ${job.company}:`, browserError);
          // Keep application as pending even if browser automation fails
        }
      }

      // Log the automation activity
      await storage.createAutomationLog({
        userId,
        action: "auto_application",
        details: {
          jobTitle: job.title,
          company: job.company,
          matchScore: evaluation.score,
          browserAutomation: browserResult?.success || false,
          reason: evaluation.reason
        },
        status: "success"
      });

      return {
        success: true,
        jobId: job.id,
        applicationId: application.id,
        matchScore: evaluation.score
      };

    } catch (error) {
      console.error(`❌ Auto-application failed for ${job.company}:`, error);
      
      // Log the failure
      await storage.createAutomationLog({
        userId,
        action: "auto_application",
        details: {
          jobTitle: job.title,
          company: job.company,
          error: (error as Error).message
        },
        status: "failed"
      });

      return {
        success: false,
        jobId: job.id,
        error: (error as Error).message,
        matchScore: 0
      };
    }
  }

  async processJobBatchForAutoApplications(userId: string, jobs: Job[]): Promise<AutoApplicationResult[]> {
    console.log(`🔄 Processing ${jobs.length} jobs for potential auto-applications`);
    
    const results: AutoApplicationResult[] = [];
    const maxAutoApplications = 5; // Limit to prevent spam
    let applicationsAttempted = 0;

    for (const job of jobs) {
      if (applicationsAttempted >= maxAutoApplications) {
        console.log(`⏸️ Reached daily auto-application limit (${maxAutoApplications})`);
        break;
      }

      // Check if we've already applied to this job
      const existingApplications = await storage.getApplications(userId);
      const alreadyApplied = existingApplications.some(app => app.jobId === job.id);

      if (alreadyApplied) {
        console.log(`⏭️ Already applied to ${job.title} at ${job.company}`);
        continue;
      }

      const result = await this.attemptAutoApplication(job, userId);
      results.push(result);

      if (result.success) {
        applicationsAttempted++;
        // Add delay between applications to be respectful
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`🎯 Auto-application batch completed: ${applicationsAttempted} applications submitted`);
    return results;
  }
}

export const intelligentApplicationService = new IntelligentApplicationService();