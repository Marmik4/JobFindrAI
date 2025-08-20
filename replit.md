# replit.md

## Overview

JobBot AI is a comprehensive job application automation platform that streamlines the job search process through AI-powered tools. The application combines web scraping, browser automation, and AI services to automatically find, apply to, and track job applications. Users can upload resumes, generate custom cover letters, configure job search parameters, and monitor application progress through an intuitive dashboard interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### August 20, 2025
- ✅ Completed comprehensive advanced AI job automation system
- ✅ Implemented intelligent job matching with skill compatibility scoring
- ✅ Built automated application system with AI-powered cover letter generation
- ✅ Added adaptive learning system for success pattern analysis
- ✅ Created mobile-responsive AI Insights dashboard
- ✅ Fixed accessibility warnings with proper dialog titles and descriptions
- ✅ Thoroughly tested all button functionality and API endpoints
- ✅ Confirmed robust fallback mechanisms when OpenAI quota exceeded
- ✅ Verified cross-device compatibility and responsive design

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Framework**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom Material Design-inspired color scheme
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation schemas

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **File Handling**: Multer middleware for resume uploads with file type validation
- **Session Management**: Express sessions with PostgreSQL session store
- **API Design**: RESTful endpoints with consistent error handling and logging middleware

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **Schema Management**: Drizzle migrations with structured schema definitions
- **File Storage**: Local file system for resume uploads with organized directory structure
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple

### Authentication and Authorization
- **Authentication**: Username/password based authentication with hashed passwords
- **Session Management**: Server-side sessions with secure cookie configuration
- **User Context**: Mock user ID system for demo purposes (ready for proper auth integration)

### Core Business Logic
- **Job Scraping**: Automated job discovery from multiple job boards (Indeed, LinkedIn, etc.)
- **AI Integration**: OpenAI GPT-4 for resume optimization and cover letter generation
- **Browser Automation**: Puppeteer for automated job application submission
- **Application Tracking**: Status management for job applications with analytics

### Service Layer Architecture
- **Storage Service**: Abstract interface for data operations with in-memory fallback
- **OpenAI Service**: AI-powered resume optimization and cover letter generation
- **Job Scraper Service**: Multi-platform job discovery with cheerio HTML parsing
- **Browser Automation Service**: Puppeteer-based form filling and submission automation

## External Dependencies

### Third-Party Services
- **OpenAI API**: GPT-4 integration for content generation and optimization
- **Neon Database**: Serverless PostgreSQL hosting platform
- **Job Boards**: Indeed, LinkedIn, and other job posting platforms for scraping

### Development Tools
- **Replit Integration**: Vite plugin for development environment integration
- **Build Tools**: ESBuild for server bundling, Vite for client bundling
- **Type Safety**: TypeScript with strict configuration across frontend and backend

### Browser Dependencies
- **Puppeteer**: Headless Chrome automation for job application submission
- **Cheerio**: Server-side jQuery-like HTML parsing for web scraping
- **File Processing**: Support for PDF and DOC resume formats

### UI Dependencies
- **Radix UI**: Comprehensive set of accessible UI components
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide Icons**: Modern icon library with Material Icons fallback
- **Form Validation**: Zod schemas for runtime type checking and validation