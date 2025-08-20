import { 
  type User, type InsertUser,
  type JobSearchConfig, type InsertJobSearchConfig,
  type Resume, type InsertResume,
  type Job, type InsertJob,
  type JobApplication, type InsertJobApplication,
  type CoverLetter, type InsertCoverLetter,
  type AutomationLog, type InsertAutomationLog,
  type SystemConfig, type InsertSystemConfig
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Job Search Config methods
  getJobSearchConfig(userId: string): Promise<JobSearchConfig | undefined>;
  createJobSearchConfig(config: InsertJobSearchConfig): Promise<JobSearchConfig>;
  updateJobSearchConfig(id: string, config: Partial<JobSearchConfig>): Promise<JobSearchConfig | undefined>;

  // Resume methods
  getResumes(userId: string): Promise<Resume[]>;
  getResume(id: string): Promise<Resume | undefined>;
  createResume(resume: InsertResume): Promise<Resume>;
  updateResume(id: string, resume: Partial<Resume>): Promise<Resume | undefined>;
  deleteResume(id: string): Promise<boolean>;

  // Job methods
  getJobs(limit?: number): Promise<Job[]>;
  getJob(id: string): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: string, job: Partial<Job>): Promise<Job | undefined>;
  searchJobs(keywords: string[], locations?: string[]): Promise<Job[]>;

  // Job Application methods
  getApplications(userId: string): Promise<JobApplication[]>;
  getApplication(id: string): Promise<JobApplication | undefined>;
  createApplication(application: InsertJobApplication): Promise<JobApplication>;
  updateApplication(id: string, application: Partial<JobApplication>): Promise<JobApplication | undefined>;
  getApplicationStats(userId: string): Promise<{ total: number; pending: number; submitted: number; interview: number; rejected: number; offer: number; }>;

  // Cover Letter methods
  getCoverLetters(userId: string): Promise<CoverLetter[]>;
  getCoverLetter(id: string): Promise<CoverLetter | undefined>;
  createCoverLetter(coverLetter: InsertCoverLetter): Promise<CoverLetter>;

  // Automation Log methods
  getAutomationLogs(userId: string, limit?: number): Promise<AutomationLog[]>;
  createAutomationLog(log: InsertAutomationLog): Promise<AutomationLog>;

  // System Config methods
  getSystemConfig(userId: string): Promise<SystemConfig | undefined>;
  createSystemConfig(config: InsertSystemConfig): Promise<SystemConfig>;
  updateSystemConfig(userId: string, config: Partial<SystemConfig>): Promise<SystemConfig | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private jobSearchConfigs: Map<string, JobSearchConfig>;
  private resumes: Map<string, Resume>;
  private jobs: Map<string, Job>;
  private jobApplications: Map<string, JobApplication>;
  private coverLetters: Map<string, CoverLetter>;
  private automationLogs: Map<string, AutomationLog>;
  private systemConfigs: Map<string, SystemConfig>;

  constructor() {
    this.users = new Map();
    this.jobSearchConfigs = new Map();
    this.resumes = new Map();
    this.jobs = new Map();
    this.jobApplications = new Map();
    this.coverLetters = new Map();
    this.automationLogs = new Map();
    this.systemConfigs = new Map();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Job Search Config methods
  async getJobSearchConfig(userId: string): Promise<JobSearchConfig | undefined> {
    return Array.from(this.jobSearchConfigs.values()).find(config => config.userId === userId);
  }

  async createJobSearchConfig(config: InsertJobSearchConfig): Promise<JobSearchConfig> {
    const id = randomUUID();
    const jobSearchConfig: JobSearchConfig = { 
      ...config, 
      id, 
      createdAt: new Date(),
      isActive: config.isActive ?? true,
      salaryMin: config.salaryMin ?? null,
      salaryMax: config.salaryMax ?? null,
      experienceLevel: config.experienceLevel ?? null
    };
    this.jobSearchConfigs.set(id, jobSearchConfig);
    return jobSearchConfig;
  }

  async updateJobSearchConfig(id: string, config: Partial<JobSearchConfig>): Promise<JobSearchConfig | undefined> {
    const existing = this.jobSearchConfigs.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...config };
    this.jobSearchConfigs.set(id, updated);
    return updated;
  }

  // Resume methods
  async getResumes(userId: string): Promise<Resume[]> {
    return Array.from(this.resumes.values()).filter(resume => resume.userId === userId);
  }

  async getResume(id: string): Promise<Resume | undefined> {
    return this.resumes.get(id);
  }

  async createResume(resume: InsertResume): Promise<Resume> {
    const id = randomUUID();
    const newResume: Resume = { 
      ...resume, 
      id, 
      createdAt: new Date(),
      skills: resume.skills ?? null,
      experience: resume.experience ?? null,
      isDefault: resume.isDefault ?? null
    };
    this.resumes.set(id, newResume);
    return newResume;
  }

  async updateResume(id: string, resume: Partial<Resume>): Promise<Resume | undefined> {
    const existing = this.resumes.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...resume };
    this.resumes.set(id, updated);
    return updated;
  }

  async deleteResume(id: string): Promise<boolean> {
    return this.resumes.delete(id);
  }

  // Job methods
  async getJobs(limit = 100): Promise<Job[]> {
    const jobs = Array.from(this.jobs.values())
      .filter(job => job.isActive)
      .sort((a, b) => b.discoveredAt!.getTime() - a.discoveredAt!.getTime())
      .slice(0, limit);
    return jobs;
  }

  async getJob(id: string): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async createJob(job: InsertJob): Promise<Job> {
    const id = randomUUID();
    const newJob: Job = { 
      ...job, 
      id, 
      discoveredAt: new Date(),
      description: job.description ?? null,
      location: job.location ?? null,
      requirements: job.requirements ?? null,
      salary: job.salary ?? null,
      isActive: job.isActive ?? true
    };
    this.jobs.set(id, newJob);
    return newJob;
  }

  async updateJob(id: string, job: Partial<Job>): Promise<Job | undefined> {
    const existing = this.jobs.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...job };
    this.jobs.set(id, updated);
    return updated;
  }

  async searchJobs(keywords: string[], locations?: string[]): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(job => {
      if (!job.isActive) return false;
      
      const matchesKeywords = keywords.some(keyword => 
        job.title.toLowerCase().includes(keyword.toLowerCase()) ||
        job.description?.toLowerCase().includes(keyword.toLowerCase())
      );

      const matchesLocation = !locations || locations.length === 0 || 
        locations.some(location => 
          job.location?.toLowerCase().includes(location.toLowerCase())
        );

      return matchesKeywords && matchesLocation;
    });
  }

  // Job Application methods
  async getApplications(userId: string): Promise<JobApplication[]> {
    return Array.from(this.jobApplications.values())
      .filter(app => app.userId === userId)
      .sort((a, b) => b.appliedAt!.getTime() - a.appliedAt!.getTime());
  }

  async getApplication(id: string): Promise<JobApplication | undefined> {
    return this.jobApplications.get(id);
  }

  async createApplication(application: InsertJobApplication): Promise<JobApplication> {
    const id = randomUUID();
    const now = new Date();
    const newApplication: JobApplication = { 
      ...application, 
      id, 
      appliedAt: now,
      lastUpdated: now,
      status: application.status ?? 'pending',
      coverLetter: application.coverLetter ?? null,
      notes: application.notes ?? null
    };
    this.jobApplications.set(id, newApplication);
    return newApplication;
  }

  async updateApplication(id: string, application: Partial<JobApplication>): Promise<JobApplication | undefined> {
    const existing = this.jobApplications.get(id);
    if (!existing) return undefined;
    
    const updated = { 
      ...existing, 
      ...application, 
      lastUpdated: new Date() 
    };
    this.jobApplications.set(id, updated);
    return updated;
  }

  async getApplicationStats(userId: string): Promise<{ total: number; pending: number; submitted: number; interview: number; rejected: number; offer: number; }> {
    const applications = await this.getApplications(userId);
    
    return {
      total: applications.length,
      pending: applications.filter(app => app.status === 'pending').length,
      submitted: applications.filter(app => app.status === 'submitted').length,
      interview: applications.filter(app => app.status === 'interview').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
      offer: applications.filter(app => app.status === 'offer').length,
    };
  }

  // Cover Letter methods
  async getCoverLetters(userId: string): Promise<CoverLetter[]> {
    return Array.from(this.coverLetters.values()).filter(letter => letter.userId === userId);
  }

  async getCoverLetter(id: string): Promise<CoverLetter | undefined> {
    return this.coverLetters.get(id);
  }

  async createCoverLetter(coverLetter: InsertCoverLetter): Promise<CoverLetter> {
    const id = randomUUID();
    const newCoverLetter: CoverLetter = { 
      ...coverLetter, 
      id, 
      generatedAt: new Date(),
      isGenerated: coverLetter.isGenerated ?? true
    };
    this.coverLetters.set(id, newCoverLetter);
    return newCoverLetter;
  }

  // Automation Log methods
  async getAutomationLogs(userId: string, limit = 50): Promise<AutomationLog[]> {
    return Array.from(this.automationLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime())
      .slice(0, limit);
  }

  async createAutomationLog(log: InsertAutomationLog): Promise<AutomationLog> {
    const id = randomUUID();
    const newLog: AutomationLog = { 
      ...log, 
      id, 
      timestamp: new Date(),
      details: log.details ?? {}
    };
    this.automationLogs.set(id, newLog);
    return newLog;
  }

  // System Config methods
  async getSystemConfig(userId: string): Promise<SystemConfig | undefined> {
    return Array.from(this.systemConfigs.values()).find(config => config.userId === userId);
  }

  async createSystemConfig(config: InsertSystemConfig): Promise<SystemConfig> {
    const id = randomUUID();
    const systemConfig: SystemConfig = { 
      ...config, 
      id,
      openaiApiKey: config.openaiApiKey ?? null,
      automationEnabled: config.automationEnabled ?? false,
      dailyApplicationLimit: config.dailyApplicationLimit ?? 10,
      scrapeInterval: config.scrapeInterval ?? 60
    };
    this.systemConfigs.set(id, systemConfig);
    return systemConfig;
  }

  async updateSystemConfig(userId: string, config: Partial<SystemConfig>): Promise<SystemConfig | undefined> {
    const existing = Array.from(this.systemConfigs.values()).find(c => c.userId === userId);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...config };
    this.systemConfigs.set(existing.id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
