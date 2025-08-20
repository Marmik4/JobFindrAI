import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const jobSearchConfigs = pgTable("job_search_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  keywords: text("keywords").array().notNull(),
  locations: text("locations").array().notNull(),
  jobBoards: text("job_boards").array().notNull(),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  experienceLevel: text("experience_level"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const resumes = pgTable("resumes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  originalFileName: text("original_file_name").notNull(),
  filePath: text("file_path").notNull(),
  content: text("content").notNull(),
  skills: text("skills").array(),
  experience: jsonb("experience"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  company: text("company").notNull(),
  location: text("location"),
  description: text("description"),
  requirements: text("requirements"),
  salary: text("salary"),
  jobBoard: text("job_board").notNull(),
  externalId: text("external_id").notNull(),
  url: text("url").notNull(),
  isActive: boolean("is_active").default(true),
  discoveredAt: timestamp("discovered_at").defaultNow(),
});

export const jobApplications = pgTable("job_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  jobId: varchar("job_id").notNull(),
  resumeId: varchar("resume_id").notNull(),
  coverLetter: text("cover_letter"),
  status: text("status").notNull().default("pending"), // pending, submitted, interview, rejected, offer
  appliedAt: timestamp("applied_at").defaultNow(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  notes: text("notes"),
});

export const coverLetters = pgTable("cover_letters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  jobId: varchar("job_id").notNull(),
  content: text("content").notNull(),
  isGenerated: boolean("is_generated").default(true),
  generatedAt: timestamp("generated_at").defaultNow(),
});

export const automationLogs = pgTable("automation_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  action: text("action").notNull(),
  details: jsonb("details"),
  status: text("status").notNull(), // success, error, warning
  timestamp: timestamp("timestamp").defaultNow(),
});

export const systemConfig = pgTable("system_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  openaiApiKey: text("openai_api_key"),
  automationEnabled: boolean("automation_enabled").default(false),
  dailyApplicationLimit: integer("daily_application_limit").default(50),
  scrapeInterval: integer("scrape_interval").default(60), // minutes
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertJobSearchConfigSchema = createInsertSchema(jobSearchConfigs).omit({
  id: true,
  createdAt: true,
});

export const insertResumeSchema = createInsertSchema(resumes).omit({
  id: true,
  createdAt: true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  discoveredAt: true,
});

export const insertJobApplicationSchema = createInsertSchema(jobApplications).omit({
  id: true,
  appliedAt: true,
  lastUpdated: true,
});

export const insertCoverLetterSchema = createInsertSchema(coverLetters).omit({
  id: true,
  generatedAt: true,
});

export const insertAutomationLogSchema = createInsertSchema(automationLogs).omit({
  id: true,
  timestamp: true,
});

export const insertSystemConfigSchema = createInsertSchema(systemConfig).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type JobSearchConfig = typeof jobSearchConfigs.$inferSelect;
export type InsertJobSearchConfig = z.infer<typeof insertJobSearchConfigSchema>;

export type Resume = typeof resumes.$inferSelect;
export type InsertResume = z.infer<typeof insertResumeSchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type JobApplication = typeof jobApplications.$inferSelect;
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;

export type CoverLetter = typeof coverLetters.$inferSelect;
export type InsertCoverLetter = z.infer<typeof insertCoverLetterSchema>;

export type AutomationLog = typeof automationLogs.$inferSelect;
export type InsertAutomationLog = z.infer<typeof insertAutomationLogSchema>;

export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;
