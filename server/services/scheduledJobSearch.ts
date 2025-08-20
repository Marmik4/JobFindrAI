import { storage } from "../storage";
import { jobScraperService } from "./jobScraper";

class ScheduledJobSearchService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  async startAutomaticJobSearch() {
    if (this.isRunning) {
      console.log("Automatic job search is already running");
      return;
    }

    this.isRunning = true;
    console.log("Starting automatic job search service...");

    // Run immediately
    await this.performJobSearch();

    // Schedule to run every 6 hours
    this.intervalId = setInterval(async () => {
      await this.performJobSearch();
    }, 6 * 60 * 60 * 1000); // 6 hours in milliseconds

    console.log("Automatic job search scheduled to run every 6 hours");
  }

  async stopAutomaticJobSearch() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log("Automatic job search stopped");
  }

  private async performJobSearch() {
    try {
      console.log("🔍 Starting automated job search...");
      
      const userId = "demo-user-id";
      const config = await storage.getJobSearchConfig(userId);
      
      if (!config || !config.keywords || config.keywords.length === 0) {
        console.log("❌ No job search configuration found. Skipping automated search.");
        return;
      }

      if (!config.isActive) {
        console.log("⏸️ Job search is disabled. Skipping automated search.");
        return;
      }

      console.log(`🎯 Searching for: ${config.keywords.join(', ')} in ${config.locations?.join(', ') || 'all locations'}`);
      
      // Scrape jobs from all configured job boards
      const scrapedJobs = await jobScraperService.scrapeAllJobBoards(
        config.keywords,
        config.locations || [],
        100 // Increased limit for automated searches
      );

      console.log(`📊 Found ${scrapedJobs.length} jobs from web scraping`);

      // Save only new jobs
      const savedJobs = [];
      const existingJobs = await storage.getJobs();
      
      for (const scrapedJob of scrapedJobs) {
        try {
          const insertJob = jobScraperService.convertToInsertJob(scrapedJob);
          
          // Check if job already exists
          const exists = existingJobs.some(j => 
            j.externalId === insertJob.externalId && 
            j.jobBoard === insertJob.jobBoard
          );
          
          if (!exists) {
            // Filter by salary if specified
            if (this.matchesSalaryFilter(scrapedJob, config)) {
              const savedJob = await storage.createJob(insertJob);
              savedJobs.push(savedJob);
            }
          }
        } catch (error) {
          console.error("Error saving scraped job:", error);
        }
      }

      // Log the search activity
      await storage.createAutomationLog({
        userId,
        action: "automated_job_search",
        details: {
          keywords: config.keywords,
          locations: config.locations,
          jobsFound: savedJobs.length,
          totalScraped: scrapedJobs.length,
          timestamp: new Date().toISOString()
        },
        status: "success"
      });

      console.log(`✅ Automated job search completed: ${savedJobs.length} new jobs saved`);
      
      // If we found new jobs, we could trigger other automations here
      if (savedJobs.length > 0) {
        await this.processNewJobs(savedJobs);
      }

    } catch (error) {
      console.error("❌ Error in automated job search:", error);
      
      // Log the error
      await storage.createAutomationLog({
        userId: "demo-user-id",
        action: "automated_job_search",
        details: {
          error: (error as Error).message,
          timestamp: new Date().toISOString()
        },
        status: "failed"
      });
    }
  }

  private matchesSalaryFilter(job: any, config: any): boolean {
    // If no salary requirements set, accept all jobs
    if (!config.salaryMin && !config.salaryMax) {
      return true;
    }

    // Extract salary from job description or salary field
    const salaryText = (job.salary || job.description || '').toLowerCase();
    
    // Simple salary extraction (this could be enhanced with AI)
    const salaryMatch = salaryText.match(/\$?([\d,]+)k?/g);
    if (!salaryMatch) {
      return true; // If no salary info found, include the job
    }

    // Convert salary text to number for comparison
    const extractedSalary = parseInt(salaryMatch[0].replace(/[\$,k]/g, ''));
    if (isNaN(extractedSalary)) {
      return true;
    }

    // Apply filters
    if (config.salaryMin && extractedSalary < config.salaryMin) {
      return false;
    }
    if (config.salaryMax && extractedSalary > config.salaryMax) {
      return false;
    }

    return true;
  }

  private async processNewJobs(newJobs: any[]) {
    console.log(`🤖 Processing ${newJobs.length} new jobs for potential automation...`);
    
    // Here we could add logic to:
    // 1. Automatically generate cover letters for high-match jobs
    // 2. Pre-score jobs based on resume compatibility
    // 3. Send notifications about great opportunities
    // 4. Auto-apply to jobs that match certain criteria
    
    for (const job of newJobs.slice(0, 5)) { // Process first 5 jobs
      try {
        // Example: Auto-generate a cover letter for each new job
        console.log(`📝 Auto-generating cover letter for: ${job.title} at ${job.company}`);
        
        // This would trigger the AI service to create a tailored cover letter
        // await this.autoGenerateCoverLetter(job);
      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error);
      }
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      nextRunTime: this.intervalId ? new Date(Date.now() + 6 * 60 * 60 * 1000) : null
    };
  }
}

export const scheduledJobSearchService = new ScheduledJobSearchService();