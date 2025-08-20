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
      // Return fallback skills based on common patterns in content
      const fallbackSkills: string[] = [];
      const skillPatterns = [
        /python/i, /javascript/i, /react/i, /node\.?js/i, /java/i, /c\+\+/i,
        /aws/i, /docker/i, /kubernetes/i, /sql/i, /mongodb/i, /postgresql/i
      ];
      
      skillPatterns.forEach(pattern => {
        if (pattern.test(resumeContent)) {
          const match = resumeContent.match(pattern);
          if (match) fallbackSkills.push(match[0]);
        }
      });
      
      return fallbackSkills.length > 0 ? fallbackSkills : ["Programming", "Software Development"];
    }
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
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Analyze the provided resume and provide specific, actionable suggestions for improvement. Return a JSON object with a "suggestions" array containing 5-7 concrete improvement suggestions.`
          },
          {
            role: "user",
            content: `Resume Content:\n${resumeContent}\n\nPlease provide optimization suggestions as JSON.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.5
      });

      const result = JSON.parse(response.choices[0].message.content!);
      return result.suggestions || [];
    } catch (error) {
      console.error("Error getting suggestions:", error);
      return [
        "Add more quantifiable achievements with numbers and percentages",
        "Include relevant technical skills for your target industry",
        "Highlight leadership and collaboration experience",
        "Use action verbs to start bullet points",
        "Customize resume content for each job application"
      ];
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

  static async checkATSCompatibility(resumeContent: string): Promise<{
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Analyze the resume for ATS (Applicant Tracking System) compatibility. Return a JSON object with:
            - score: number from 0-100 indicating ATS compatibility
            - issues: array of identified ATS problems
            - recommendations: array of specific suggestions to improve ATS compatibility`
          },
          {
            role: "user",
            content: `Resume Content:\n${resumeContent}\n\nPlease analyze ATS compatibility and return as JSON.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0].message.content!);
      return {
        score: result.score || 75,
        issues: result.issues || [],
        recommendations: result.recommendations || []
      };
    } catch (error) {
      console.error("Error checking ATS compatibility:", error);
      return {
        score: 75,
        issues: ["Unable to analyze ATS compatibility at this time"],
        recommendations: [
          "Use standard section headings (Experience, Education, Skills)",
          "Avoid images, graphics, and complex formatting",
          "Use common fonts like Arial or Calibri",
          "Include relevant keywords from job descriptions",
          "Save as .pdf or .docx format"
        ]
      };
    }
  }

  static async performKeywordAnalysis(resumeContent: string, jobDescription: string): Promise<{
    matchedKeywords: string[];
    missingKeywords: string[];
    matchScore: number;
    suggestions: string[];
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Compare the resume against the job description for keyword matching. Return a JSON object with:
            - matchedKeywords: array of keywords found in both
            - missingKeywords: array of important keywords missing from resume
            - matchScore: percentage match score (0-100)
            - suggestions: array of specific recommendations to improve keyword matching`
          },
          {
            role: "user",
            content: `Job Description:\n${jobDescription}\n\nResume Content:\n${resumeContent}\n\nPlease analyze keyword matching and return as JSON.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0].message.content!);
      return {
        matchedKeywords: result.matchedKeywords || [],
        missingKeywords: result.missingKeywords || [],
        matchScore: result.matchScore || 0,
        suggestions: result.suggestions || []
      };
    } catch (error) {
      console.error("Error performing keyword analysis:", error);
      return {
        matchedKeywords: ["Programming", "Software Development"],
        missingKeywords: ["Unable to analyze keywords at this time"],
        matchScore: 50,
        suggestions: [
          "Include specific technical skills mentioned in the job description",
          "Use industry-standard terminology",
          "Match the job title keywords in your resume",
          "Include relevant certifications and tools"
        ]
      };
    }
  }
}
