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

  static async extractResumeSkills(resumeContent: string): Promise<string[]> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Extract all technical skills, programming languages, frameworks, tools, and relevant professional skills from the provided resume. Return a JSON object with a "skills" array containing all identified skills.`
          },
          {
            role: "user",
            content: `Resume Content:\n${resumeContent}\n\nPlease extract all skills and return as JSON.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0].message.content!);
      return result.skills || [];
    } catch (error) {
      console.error("Error extracting skills:", error);
      return [];
    }
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
}
