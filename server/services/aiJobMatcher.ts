import { OpenAIService } from "./openai";
import { storage } from "../storage";
import { Job, Resume } from "@shared/schema";

interface JobMatchScore {
  jobId: string;
  score: number; // 0-100
  matchReasons: string[];
  skillsMatch: string[];
  missingSkills: string[];
  salaryMatch: boolean;
  locationMatch: boolean;
  recommendations: string[];
}

export class AIJobMatcherService {
  
  async analyzeJobMatch(job: Job, resume: Resume): Promise<JobMatchScore> {
    try {
      const prompt = `
        Analyze how well this resume matches this job posting. Provide a detailed scoring and analysis.

        JOB POSTING:
        Title: ${job.title}
        Company: ${job.company}
        Location: ${job.location}
        Description: ${job.description}
        Requirements: ${job.requirements}
        Salary: ${job.salary}

        RESUME:
        Name: ${resume.name}
        Content: ${resume.content}
        Skills: ${resume.skills?.join(', ')}
        Experience: ${JSON.stringify(resume.experience)}

        Please provide a JSON response with:
        {
          "score": number (0-100),
          "matchReasons": ["reason1", "reason2", ...],
          "skillsMatch": ["skill1", "skill2", ...],
          "missingSkills": ["skill1", "skill2", ...],
          "salaryMatch": boolean,
          "locationMatch": boolean,
          "recommendations": ["rec1", "rec2", ...]
        }
      `;

      const response = await OpenAIService.generateText(prompt, {
        responseFormat: "json_object"
      });

      const analysis = JSON.parse(response);

      return {
        jobId: job.id,
        score: Math.max(0, Math.min(100, analysis.score)),
        matchReasons: analysis.matchReasons || [],
        skillsMatch: analysis.skillsMatch || [],
        missingSkills: analysis.missingSkills || [],
        salaryMatch: analysis.salaryMatch ?? false,
        locationMatch: analysis.locationMatch ?? true,
        recommendations: analysis.recommendations || []
      };

    } catch (error) {
      console.error('Error analyzing job match:', error);
      
      // Fallback basic matching
      return this.basicJobMatch(job, resume);
    }
  }

  private basicJobMatch(job: Job, resume: Resume): JobMatchScore {
    const jobSkills = this.extractSkillsFromText(job.description + ' ' + (job.requirements || ''));
    const resumeSkills = resume.skills || [];
    
    const matchingSkills = resumeSkills.filter(skill => 
      jobSkills.some(jobSkill => 
        skill.toLowerCase().includes(jobSkill.toLowerCase()) ||
        jobSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );

    const score = Math.min(100, (matchingSkills.length / Math.max(jobSkills.length, 1)) * 100);

    return {
      jobId: job.id,
      score,
      matchReasons: [`Found ${matchingSkills.length} matching skills`],
      skillsMatch: matchingSkills,
      missingSkills: jobSkills.filter(skill => !matchingSkills.includes(skill)),
      salaryMatch: true, // Default to true for basic matching
      locationMatch: true,
      recommendations: ['Consider highlighting relevant experience', 'Update skills section']
    };
  }

  private extractSkillsFromText(text: string): string[] {
    const commonSkills = [
      'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'Java', 'C++', 'HTML', 'CSS',
      'AWS', 'Docker', 'Kubernetes', 'Git', 'SQL', 'PostgreSQL', 'MongoDB', 'Redis',
      'Django', 'Flask', 'Express', 'Vue.js', 'Angular', 'GraphQL', 'REST API',
      'Machine Learning', 'AI', 'Data Science', 'TensorFlow', 'PyTorch', 'Pandas'
    ];

    return commonSkills.filter(skill => 
      text.toLowerCase().includes(skill.toLowerCase())
    );
  }

  async findBestMatches(userId: string, limit: number = 10): Promise<JobMatchScore[]> {
    const jobs = await storage.getJobs(50); // Get recent jobs
    const resumes = await storage.getResumes(userId);
    
    if (!resumes.length) {
      return [];
    }

    const defaultResume = resumes.find(r => r.isDefault) || resumes[0];
    const matches: JobMatchScore[] = [];

    for (const job of jobs) {
      if (job.isActive) {
        const match = await this.analyzeJobMatch(job, defaultResume);
        matches.push(match);
      }
    }

    // Sort by score and return top matches
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async autoScoreNewJobs(userId: string, newJobs: Job[]): Promise<JobMatchScore[]> {
    const resumes = await storage.getResumes(userId);
    
    if (!resumes.length) {
      return [];
    }

    const defaultResume = resumes.find(r => r.isDefault) || resumes[0];
    const scores: JobMatchScore[] = [];

    for (const job of newJobs) {
      const score = await this.analyzeJobMatch(job, defaultResume);
      scores.push(score);
    }

    return scores.sort((a, b) => b.score - a.score);
  }
}

export const aiJobMatcherService = new AIJobMatcherService();