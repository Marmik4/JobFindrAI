import { storage } from "../storage";
import { OpenAIService } from "./openai";

interface LearningInsight {
  category: string;
  insight: string;
  actionable: string;
  confidence: number;
}

interface ApplicationPattern {
  successRate: number;
  commonSuccessFactors: string[];
  rejectionReasons: string[];
  recommendedImprovements: string[];
}

export class AdaptiveLearningService {
  
  async analyzeApplicationPatterns(userId: string): Promise<ApplicationPattern> {
    try {
      const applications = await storage.getApplications(userId);
      
      if (applications.length < 5) {
        return {
          successRate: 0,
          commonSuccessFactors: [],
          rejectionReasons: [],
          recommendedImprovements: ['Apply to more positions to gather learning data']
        };
      }

      const successful = applications.filter(app => 
        ['interview', 'offer', 'accepted'].includes(app.status)
      );
      const rejected = applications.filter(app => app.status === 'rejected');
      
      const successRate = (successful.length / applications.length) * 100;

      // Get jobs for successful applications
      const successfulJobIds = successful.map(app => app.jobId);
      const rejectedJobIds = rejected.map(app => app.jobId);
      
      const allJobs = await storage.getJobs();
      const successfulJobs = allJobs.filter(job => successfulJobIds.includes(job.id));
      const rejectedJobs = allJobs.filter(job => rejectedJobIds.includes(job.id));

      const prompt = `
        Analyze these job application patterns to identify success factors and improvement areas.

        SUCCESSFUL APPLICATIONS (${successful.length}):
        ${successfulJobs.map(job => `- ${job.title} at ${job.company} (${job.location})`).join('\n')}

        REJECTED APPLICATIONS (${rejected.length}):
        ${rejectedJobs.map(job => `- ${job.title} at ${job.company} (${job.location})`).join('\n')}

        SUCCESS RATE: ${successRate.toFixed(1)}%

        Please analyze patterns and provide JSON response:
        {
          "commonSuccessFactors": ["factor1", "factor2", ...],
          "rejectionReasons": ["reason1", "reason2", ...],
          "recommendedImprovements": ["improvement1", "improvement2", ...]
        }
      `;

      const response = await OpenAIService.generateText(prompt, {
        responseFormat: "json_object"
      });

      const analysis = JSON.parse(response);

      return {
        successRate,
        commonSuccessFactors: analysis.commonSuccessFactors || [],
        rejectionReasons: analysis.rejectionReasons || [],
        recommendedImprovements: analysis.recommendedImprovements || []
      };

    } catch (error) {
      console.error('Error analyzing application patterns:', error);
      
      // Fallback analysis
      const applications = await storage.getApplications(userId);
      const successRate = applications.length > 0 ? 
        (applications.filter(app => ['interview', 'offer'].includes(app.status)).length / applications.length) * 100 : 0;

      return {
        successRate,
        commonSuccessFactors: ['Strong technical skills', 'Relevant experience'],
        rejectionReasons: ['Skills mismatch', 'Experience level'],
        recommendedImprovements: ['Tailor applications more specifically', 'Improve resume keywords']
      };
    }
  }

  async generateLearningInsights(userId: string): Promise<LearningInsight[]> {
    try {
      const applications = await storage.getApplications(userId);
      const automationLogs = await storage.getAutomationLogs(userId, 50);
      const resumes = await storage.getResumes(userId);

      const prompt = `
        Generate actionable insights to improve this user's job search success based on their data:

        APPLICATIONS: ${applications.length} total
        - Pending: ${applications.filter(a => a.status === 'pending').length}
        - Interviews: ${applications.filter(a => a.status === 'interview').length}
        - Rejected: ${applications.filter(a => a.status === 'rejected').length}
        - Offers: ${applications.filter(a => a.status === 'offer').length}

        AUTOMATION ACTIVITY: ${automationLogs.length} recent actions
        - Successful: ${automationLogs.filter(l => l.status === 'success').length}
        - Failed: ${automationLogs.filter(l => l.status === 'failed').length}

        RESUMES: ${resumes.length} versions available

        Provide 3-5 specific, actionable insights in JSON format:
        {
          "insights": [
            {
              "category": "category_name",
              "insight": "specific observation",
              "actionable": "concrete next step",
              "confidence": 0.85
            }
          ]
        }
      `;

      const response = await OpenAIService.generateText(prompt, {
        responseFormat: "json_object"
      });

      const result = JSON.parse(response);
      return result.insights || [];

    } catch (error) {
      console.error('Error generating learning insights:', error);
      
      // Fallback insights
      return [
        {
          category: "Application Strategy",
          insight: "Continue applying consistently to build data for better insights",
          actionable: "Maintain regular application schedule and track results",
          confidence: 0.7
        }
      ];
    }
  }

  async optimizeSearchKeywords(userId: string): Promise<string[]> {
    try {
      const applications = await storage.getApplications(userId);
      const successfulApplications = applications.filter(app => 
        ['interview', 'offer', 'accepted'].includes(app.status)
      );

      if (successfulApplications.length === 0) {
        return ['software engineer', 'developer', 'programmer'];
      }

      const jobs = await storage.getJobs();
      const successfulJobs = jobs.filter(job => 
        successfulApplications.some(app => app.jobId === job.id)
      );

      const jobTitles = successfulJobs.map(job => job.title).join(', ');
      const jobDescriptions = successfulJobs.map(job => job.description).join(' ');

      const prompt = `
        Based on these successful job matches, suggest optimized search keywords:

        SUCCESSFUL JOB TITLES: ${jobTitles}
        
        JOB DESCRIPTIONS: ${jobDescriptions.substring(0, 1000)}...

        Return a JSON array of 5-10 optimized keywords that would find similar successful matches:
        {
          "keywords": ["keyword1", "keyword2", ...]
        }
      `;

      const response = await OpenAIService.generateText(prompt, {
        responseFormat: "json_object"
      });

      const result = JSON.parse(response);
      return result.keywords || ['software engineer', 'developer'];

    } catch (error) {
      console.error('Error optimizing search keywords:', error);
      return ['software engineer', 'full stack developer', 'backend developer', 'frontend developer'];
    }
  }

  async adaptAutomationStrategy(userId: string): Promise<{
    recommendedFrequency: string;
    suggestedFilters: any;
    automationSettings: any;
  }> {
    try {
      const patterns = await this.analyzeApplicationPatterns(userId);
      const insights = await this.generateLearningInsights(userId);

      // Determine optimal automation frequency based on success rate
      let recommendedFrequency = "6 hours"; // Default
      if (patterns.successRate > 20) {
        recommendedFrequency = "4 hours"; // Increase frequency if doing well
      } else if (patterns.successRate < 5 && patterns.successRate > 0) {
        recommendedFrequency = "12 hours"; // Decrease if low success rate
      }

      // Suggest filter adjustments based on patterns
      const suggestedFilters = {
        minMatchScore: patterns.successRate > 15 ? 70 : 80, // Lower threshold if doing well
        focusAreas: patterns.commonSuccessFactors,
        avoidKeywords: patterns.rejectionReasons
      };

      const automationSettings = {
        enableAutoApply: patterns.successRate > 10,
        maxDailyApplications: patterns.successRate > 20 ? 8 : 5,
        requireHumanReview: patterns.successRate < 10
      };

      return {
        recommendedFrequency,
        suggestedFilters,
        automationSettings
      };

    } catch (error) {
      console.error('Error adapting automation strategy:', error);
      
      return {
        recommendedFrequency: "6 hours",
        suggestedFilters: { minMatchScore: 75 },
        automationSettings: { enableAutoApply: false, maxDailyApplications: 3 }
      };
    }
  }
}

export const adaptiveLearningService = new AdaptiveLearningService();