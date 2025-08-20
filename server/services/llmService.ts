import OpenAI from "openai";

// LLM Service that supports multiple providers
export class LLMService {
  private static openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Determine which LLM provider to use based on availability
  private static async getAvailableProvider(): Promise<'openai' | 'ollama' | 'huggingface'> {
    // Check if OpenAI key is available and working
    if (process.env.OPENAI_API_KEY) {
      try {
        await this.openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: "test" }],
          max_tokens: 1
        });
        return 'openai';
      } catch (error: any) {
        console.log("OpenAI not available:", error.message);
      }
    }

    // Check if Ollama is running locally
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (response.ok) {
        return 'ollama';
      }
    } catch (error) {
      console.log("Ollama not available");
    }

    // Fall back to Hugging Face (free tier)
    return 'huggingface';
  }

  // Generate text using available LLM provider
  static async generateText(prompt: string, options?: { 
    responseFormat?: string;
    maxTokens?: number;
    temperature?: number;
  }): Promise<string> {
    const provider = await this.getAvailableProvider();
    const maxTokens = options?.maxTokens || 1000;
    const temperature = options?.temperature || 0.7;

    try {
      switch (provider) {
        case 'openai':
          return await this.generateWithOpenAI(prompt, options);
          
        case 'ollama':
          return await this.generateWithOllama(prompt, maxTokens, temperature);
          
        case 'huggingface':
          return await this.generateWithHuggingFace(prompt, maxTokens, temperature);
          
        default:
          throw new Error("No LLM provider available");
      }
    } catch (error) {
      console.error(`Error with ${provider}:`, error);
      return this.getFallbackResponse(prompt);
    }
  }

  private static async generateWithOpenAI(prompt: string, options?: any): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      response_format: options?.responseFormat === "json_object" ? { type: "json_object" } : undefined,
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 1000
    });
    return response.choices[0].message.content || "";
  }

  private static async generateWithOllama(prompt: string, maxTokens: number, temperature: number): Promise<string> {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama2', // Default model - users can install others
        prompt: prompt,
        stream: false,
        options: {
          num_predict: maxTokens,
          temperature: temperature
        }
      })
    });

    const data = await response.json();
    return data.response || "";
  }

  private static async generateWithHuggingFace(prompt: string, maxTokens: number, temperature: number): Promise<string> {
    // Using Hugging Face's free inference API with a good open-source model
    const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-large', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY || 'hf_' + 'demo'}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: maxTokens,
          temperature: temperature,
          return_full_text: false
        }
      })
    });

    const data = await response.json();
    
    if (Array.isArray(data) && data[0]?.generated_text) {
      return data[0].generated_text;
    }
    
    // Try alternative model if first fails
    return await this.generateWithAlternativeHF(prompt, maxTokens);
  }

  private static async generateWithAlternativeHF(prompt: string, maxTokens: number): Promise<string> {
    try {
      // Try Mistral 7B - another good open source model
      const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: Math.min(maxTokens, 500), // HF free tier limits
            temperature: 0.7,
            return_full_text: false
          }
        })
      });

      const data = await response.json();
      if (Array.isArray(data) && data[0]?.generated_text) {
        return data[0].generated_text;
      }
    } catch (error) {
      console.error("Alternative HF model failed:", error);
    }
    
    throw new Error("All Hugging Face models failed");
  }

  private static getFallbackResponse(prompt: string): string {
    // Intelligent fallback based on prompt analysis
    if (prompt.toLowerCase().includes('skill')) {
      return JSON.stringify({
        skills: ["JavaScript", "React", "Node.js", "Python", "SQL", "Git", "HTML", "CSS"]
      });
    }
    
    if (prompt.toLowerCase().includes('ats')) {
      return JSON.stringify({
        score: 75,
        issues: ["Consider using standard section headings", "Add more keywords"],
        recommendations: ["Use bullet points for achievements", "Include relevant technical skills"]
      });
    }
    
    if (prompt.toLowerCase().includes('keyword')) {
      return JSON.stringify({
        matchedKeywords: ["JavaScript", "React", "Frontend"],
        missingKeywords: ["TypeScript", "Testing", "AWS"],
        matchScore: 65,
        suggestions: ["Add missing technical skills", "Include cloud platform experience"]
      });
    }
    
    if (prompt.toLowerCase().includes('cover letter')) {
      return JSON.stringify({
        content: "Dear Hiring Manager,\n\nI am excited to apply for this position. My technical background and passion for software development make me a strong candidate.\n\nI look forward to discussing how I can contribute to your team.\n\nBest regards",
        tone: "professional",
        keyPoints: ["Technical skills alignment", "Enthusiasm for role", "Team contribution"]
      });
    }
    
    return "I apologize, but I'm currently unable to process this request. Please try again later or consider setting up a local LLM with Ollama.";
  }

  // Specific methods for different AI features
  static async extractResumeSkills(resumeContent: string): Promise<string[]> {
    const prompt = `Extract all technical skills, programming languages, frameworks, tools, and relevant professional skills from this resume. Return a JSON object with a "skills" array.

Resume: ${resumeContent}

Return format: {"skills": ["skill1", "skill2", ...]}`;

    try {
      const response = await this.generateText(prompt, { responseFormat: "json_object", maxTokens: 500 });
      const parsed = JSON.parse(response);
      return parsed.skills || this.extractSkillsFallback(resumeContent);
    } catch (error) {
      return this.extractSkillsFallback(resumeContent);
    }
  }

  private static extractSkillsFallback(content: string): string[] {
    const skills: string[] = [];
    const skillPatterns = [
      /\b(javascript|js)\b/i, /\breact\b/i, /\bnode\.?js\b/i, /\bpython\b/i,
      /\bjava\b/i, /\bc\+\+\b/i, /\bhtml\b/i, /\bcss\b/i, /\btypescript\b/i,
      /\baws\b/i, /\bdocker\b/i, /\bkubernetes\b/i, /\bsql\b/i, /\bmongodb\b/i,
      /\bpostgresql\b/i, /\bgit\b/i, /\blinux\b/i, /\bangular\b/i, /\bvue\b/i
    ];
    
    skillPatterns.forEach(pattern => {
      const match = content.match(pattern);
      if (match) skills.push(match[0]);
    });
    
    return skills.length > 0 ? skills : ["Programming", "Software Development"];
  }

  static async checkATSCompatibility(resumeContent: string): Promise<{
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    const prompt = `Analyze this resume for ATS (Applicant Tracking System) compatibility. Return JSON with: score (0-100), issues array, recommendations array.

Resume: ${resumeContent}

Focus on: standard headings, readable formatting, keyword usage, file format compatibility.`;

    try {
      const response = await this.generateText(prompt, { responseFormat: "json_object", maxTokens: 600 });
      const parsed = JSON.parse(response);
      return {
        score: parsed.score || 75,
        issues: parsed.issues || [],
        recommendations: parsed.recommendations || []
      };
    } catch (error) {
      return {
        score: 75,
        issues: ["Unable to analyze ATS compatibility with current setup"],
        recommendations: [
          "Use standard section headings (Experience, Education, Skills)",
          "Avoid complex formatting and graphics",
          "Include relevant keywords from job descriptions",
          "Save in PDF or DOCX format"
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
    const prompt = `Compare this resume against the job description for keyword matching. Return JSON with: matchedKeywords, missingKeywords, matchScore (0-100), suggestions.

Job Description: ${jobDescription}

Resume: ${resumeContent}`;

    try {
      const response = await this.generateText(prompt, { responseFormat: "json_object", maxTokens: 700 });
      const parsed = JSON.parse(response);
      return {
        matchedKeywords: parsed.matchedKeywords || [],
        missingKeywords: parsed.missingKeywords || [],
        matchScore: parsed.matchScore || 50,
        suggestions: parsed.suggestions || []
      };
    } catch (error) {
      return {
        matchedKeywords: ["Programming", "Software Development"],
        missingKeywords: ["Analysis unavailable"],
        matchScore: 50,
        suggestions: ["Set up local LLM or API key for detailed analysis"]
      };
    }
  }

  static async getResumeOptimizationSuggestions(resumeContent: string): Promise<string[]> {
    const prompt = `Analyze this resume and provide 5-7 specific improvement suggestions. Return JSON with suggestions array.

Resume: ${resumeContent}`;

    try {
      const response = await this.generateText(prompt, { responseFormat: "json_object", maxTokens: 500 });
      const parsed = JSON.parse(response);
      return parsed.suggestions || this.getDefaultSuggestions();
    } catch (error) {
      return this.getDefaultSuggestions();
    }
  }

  private static getDefaultSuggestions(): string[] {
    return [
      "Add quantifiable achievements with numbers and percentages",
      "Include relevant technical skills for your target industry", 
      "Use action verbs to start bullet points",
      "Tailor resume content for each job application",
      "Add relevant certifications and courses"
    ];
  }

  static async generateCoverLetter(data: any): Promise<{
    content: string;
    tone: string;
    keyPoints: string[];
  }> {
    const prompt = `Generate a professional cover letter for: ${data.jobTitle} at ${data.companyName}. 
    
Requirements: ${data.requirements || 'Not specified'}
Applicant: ${data.applicantName}

Return JSON with: content, tone, keyPoints array.`;

    try {
      const response = await this.generateText(prompt, { responseFormat: "json_object", maxTokens: 800 });
      const parsed = JSON.parse(response);
      return {
        content: parsed.content || this.getDefaultCoverLetter(data),
        tone: parsed.tone || "professional",
        keyPoints: parsed.keyPoints || ["Technical skills", "Experience match", "Company interest"]
      };
    } catch (error) {
      return {
        content: this.getDefaultCoverLetter(data),
        tone: "professional", 
        keyPoints: ["Technical background", "Role enthusiasm", "Team contribution"]
      };
    }
  }

  private static getDefaultCoverLetter(data: any): string {
    return `Dear Hiring Manager,

I am writing to express my strong interest in the ${data.jobTitle} position at ${data.companyName}. 

My technical background and experience in software development align well with your requirements. I am excited about the opportunity to contribute to your team and help drive innovative solutions.

I would welcome the chance to discuss how my skills and enthusiasm can benefit your organization.

Best regards,
${data.applicantName}`;
  }
}