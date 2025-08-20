import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || "default_key"
});

export interface ResumeOptimizationResult {
  optimizedContent: string;
  suggestions: string[];
  matchScore: number;
}

export interface CoverLetterGenerationResult {
  content: string;
  tone: string;
  keyPoints: string[];
}

export class OpenAIService {
  static async optimizeResume(
    resumeContent: string,
    jobDescription: string,
    jobTitle: string
  ): Promise<ResumeOptimizationResult> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a professional resume optimization expert. Analyze the provided resume and job description, then optimize the resume to better match the job requirements while maintaining authenticity. Provide a JSON response with: optimizedContent (the improved resume text), suggestions (array of improvement suggestions), and matchScore (percentage match from 0-100).`
          },
          {
            role: "user",
            content: `Job Title: ${jobTitle}\n\nJob Description:\n${jobDescription}\n\nCurrent Resume:\n${resumeContent}\n\nPlease optimize this resume for the job posting and return the response as JSON.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      });

      const result = JSON.parse(response.choices[0].message.content!);
      return {
        optimizedContent: result.optimizedContent || resumeContent,
        suggestions: result.suggestions || [],
        matchScore: Math.max(0, Math.min(100, result.matchScore || 0))
      };
    } catch (error) {
      console.error("Error optimizing resume:", error);
      throw new Error("Failed to optimize resume: " + (error as Error).message);
    }
  }

  static async generateCoverLetter(
    resumeContent: string,
    jobDescription: string,
    jobTitle: string,
    companyName: string,
    applicantName: string
  ): Promise<CoverLetterGenerationResult> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a professional cover letter writing expert. Create a compelling, personalized cover letter based on the applicant's resume and the job posting. The letter should be professional, engaging, and highlight relevant experience. Provide a JSON response with: content (the full cover letter), tone (professional/enthusiastic/formal), and keyPoints (array of main selling points highlighted).`
          },
          {
            role: "user",
            content: `Applicant Name: ${applicantName}\nCompany: ${companyName}\nJob Title: ${jobTitle}\n\nJob Description:\n${jobDescription}\n\nApplicant Resume:\n${resumeContent}\n\nPlease generate a tailored cover letter and return the response as JSON.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8
      });

      const result = JSON.parse(response.choices[0].message.content!);
      return {
        content: result.content || `Dear Hiring Manager,\n\nI am writing to express my interest in the ${jobTitle} position at ${companyName}...\n\nSincerely,\n${applicantName}`,
        tone: result.tone || "professional",
        keyPoints: result.keyPoints || []
      };
    } catch (error) {
      console.error("Error generating cover letter:", error);
      throw new Error("Failed to generate cover letter: " + (error as Error).message);
    }
  }

  static async generateText(prompt: string, options?: { responseFormat?: string }): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: options?.responseFormat === "json_object" ? { type: "json_object" } : undefined,
        temperature: 0.7
      });

      return response.choices[0].message.content || "";
    } catch (error) {
      console.error("Error generating text:", error);
      throw new Error("Failed to generate text: " + (error as Error).message);
    }
  }

  static async extractResumeSkills(resumeContent: string): Promise<string[]> {
    // Import LLMService dynamically to avoid circular dependencies
    const { LLMService } = await import('./llmService');
    return await LLMService.extractResumeSkills(resumeContent);
  }

  static async optimizeResumeForJob(resumeContent: string, job: any): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a professional resume optimization expert. Optimize the provided resume content to better match the job requirements. Focus on:
            1. Highlighting relevant skills and experience
            2. Using keywords from the job description
            3. Emphasizing quantifiable achievements
            4. Maintaining the original format and structure
            Return the optimized resume content.`
          },
          {
            role: "user",
            content: `Job Title: ${job.title}
Company: ${job.company}
Job Requirements: ${job.requirements}
Job Description: ${job.description}

Original Resume:
${resumeContent}

Please optimize this resume for the above job position.`
          }
        ],
        temperature: 0.7
      });

      return response.choices[0].message.content || resumeContent;
    } catch (error) {
      console.error("Error optimizing resume:", error);
      return resumeContent + "\n\n[AI Optimization unavailable - using original content]";
    }
  }

  static async getResumeOptimizationSuggestions(resumeContent: string): Promise<string[]> {
    const { LLMService } = await import('./llmService');
    return await LLMService.getResumeOptimizationSuggestions(resumeContent);
  }

  static async analyzeJobDescription(jobDescription: string): Promise<{
    requiredSkills: string[];
    preferredSkills: string[];
    experienceLevel: string;
    keyRequirements: string[];
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Analyze the job description and extract key information. Return a JSON object with: requiredSkills (array of must-have skills), preferredSkills (array of nice-to-have skills), experienceLevel (entry/mid/senior), and keyRequirements (array of main job requirements).`
          },
          {
            role: "user",
            content: `Job Description:\n${jobDescription}\n\nPlease analyze and return as JSON.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0].message.content!);
      return {
        requiredSkills: result.requiredSkills || [],
        preferredSkills: result.preferredSkills || [],
        experienceLevel: result.experienceLevel || "mid",
        keyRequirements: result.keyRequirements || []
      };
    } catch (error) {
      console.error("Error analyzing job description:", error);
      return {
        requiredSkills: [],
        preferredSkills: [],
        experienceLevel: "mid",
        keyRequirements: []
      };
    }
  }

  static async checkATSCompatibility(resumeContent: string): Promise<{
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    const { LLMService } = await import('./llmService');
    return await LLMService.checkATSCompatibility(resumeContent);
  }

  static async performKeywordAnalysis(resumeContent: string, jobDescription: string): Promise<{
    matchedKeywords: string[];
    missingKeywords: string[];
    matchScore: number;
    suggestions: string[];
  }> {
    const { LLMService } = await import('./llmService');
    return await LLMService.performKeywordAnalysis(resumeContent, jobDescription);
  }
}
