import * as cheerio from "cheerio";
import { InsertJob } from "@shared/schema";

export interface ScrapedJob {
  title: string;
  company: string;
  location?: string;
  description: string;
  requirements?: string;
  salary?: string;
  url: string;
  externalId: string;
  jobBoard: string;
}

export class JobScraperService {
  private readonly HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive'
  };

  async scrapeIndeedJobs(keywords: string[], locations: string[] = [], limit: number = 20): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    
    try {
      for (const keyword of keywords) {
        const location = locations.length > 0 ? locations[0] : '';
        const searchUrl = `https://www.indeed.com/jobs?q=${encodeURIComponent(keyword)}&l=${encodeURIComponent(location)}&limit=${limit}`;
        
        console.log(`Scraping Indeed for: ${keyword} in ${location || 'any location'}`);
        
        const response = await fetch(searchUrl, {
          headers: this.HEADERS,
        });

        if (!response.ok) {
          console.error(`Indeed scraping failed: ${response.status}`);
          continue;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        $('.jobsearch-SerpJobCard, [data-jk]').each((index, element) => {
          if (jobs.length >= limit) return false;

          try {
            const $job = $(element);
            const title = $job.find('.jobTitle a span, h2 a span').first().text().trim();
            const company = $job.find('.companyName, [data-testid="company-name"]').text().trim();
            const location = $job.find('.companyLocation, [data-testid="job-location"]').text().trim();
            const summary = $job.find('.job-snippet, [data-testid="job-snippet"]').text().trim();
            const jobKey = $job.attr('data-jk') || $job.find('a[data-jk]').attr('data-jk') || `indeed-${Date.now()}-${index}`;
            const jobUrl = `https://www.indeed.com/job/${jobKey}`;

            if (title && company) {
              jobs.push({
                title,
                company,
                location: location || undefined,
                description: summary,
                url: jobUrl,
                externalId: jobKey,
                jobBoard: 'Indeed'
              });
            }
          } catch (error) {
            console.error('Error parsing Indeed job:', error);
          }
        });

        // Add delay between requests to be respectful
        await this.delay(2000);
      }
    } catch (error) {
      console.error('Error scraping Indeed:', error);
    }

    return jobs;
  }

  async scrapeLinkedInJobs(keywords: string[], locations: string[] = [], limit: number = 20): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    
    try {
      for (const keyword of keywords) {
        const location = locations.length > 0 ? locations[0] : '';
        const searchUrl = `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}&f_TPR=r86400&f_JT=F&sortBy=DD`;
        
        console.log(`Scraping LinkedIn for: ${keyword} in ${location || 'any location'}`);
        
        try {
          const response = await fetch(searchUrl, {
            headers: {
              ...this.HEADERS,
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Cache-Control': 'no-cache'
            },
          });

          if (!response.ok) {
            console.error(`LinkedIn scraping failed: ${response.status}`);
            continue;
          }

          const html = await response.text();
          const $ = cheerio.load(html);

          // LinkedIn public job search results
          $('.base-card').each((index, element) => {
            if (jobs.length >= limit) return false;

            try {
              const $job = $(element);
              const title = $job.find('.base-search-card__title').text().trim();
              const company = $job.find('.base-search-card__subtitle').text().trim();
              const location = $job.find('.job-search-card__location').text().trim();
              const summary = $job.find('.job-search-card__snippet').text().trim();
              const jobUrl = $job.find('.base-card__full-link').attr('href') || searchUrl;
              const jobId = jobUrl.split('/').pop() || `linkedin-${Date.now()}-${index}`;

              if (title && company) {
                jobs.push({
                  title,
                  company,
                  location: location || undefined,
                  description: summary || `${keyword} position at ${company}`,
                  url: jobUrl,
                  externalId: jobId,
                  jobBoard: 'LinkedIn'
                });
              }
            } catch (error) {
              console.error('Error parsing LinkedIn job:', error);
            }
          });

          // Add delay between requests
          await this.delay(3000);
          
        } catch (error) {
          console.error(`Error scraping LinkedIn for ${keyword}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in LinkedIn scraping:', error);
    }

    return jobs;
  }

  async scrapeRemoteOkJobs(keywords: string[], limit: number = 20): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    
    try {
      const searchUrl = `https://remoteok.io/remote-dev-jobs`;
      
      console.log('Scraping RemoteOK for development jobs');
      
      const response = await fetch(searchUrl, {
        headers: this.HEADERS,
      });

      if (!response.ok) {
        console.error(`RemoteOK scraping failed: ${response.status}`);
        return jobs;
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      $('.job').each((index, element) => {
        if (jobs.length >= limit) return false;

        try {
          const $job = $(element);
          const title = $job.find('.position').text().trim();
          const company = $job.find('.company').text().trim();
          const tags = $job.find('.tags .tag').map((i, el) => $(el).text().trim()).get();
          const jobId = $job.attr('data-id') || `remoteok-${Date.now()}-${index}`;
          const jobUrl = `https://remoteok.io/remote-jobs/${jobId}`;

          // Check if job matches any keywords
          const matchesKeyword = keywords.some(keyword => 
            title.toLowerCase().includes(keyword.toLowerCase()) ||
            tags.some(tag => tag.toLowerCase().includes(keyword.toLowerCase()))
          );

          if (title && company && matchesKeyword) {
            jobs.push({
              title,
              company,
              location: 'Remote',
              description: tags.join(', '),
              url: jobUrl,
              externalId: jobId,
              jobBoard: 'RemoteOK'
            });
          }
        } catch (error) {
          console.error('Error parsing RemoteOK job:', error);
        }
      });
    } catch (error) {
      console.error('Error scraping RemoteOK:', error);
    }

    return jobs;
  }

  async scrapeStackOverflowJobs(keywords: string[], limit: number = 20): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    
    try {
      const searchUrl = 'https://stackoverflow.com/jobs/remote-developer-jobs';
      
      console.log('Scraping Stack Overflow Jobs');
      
      const response = await fetch(searchUrl, {
        headers: this.HEADERS,
      });

      if (!response.ok) {
        console.error(`Stack Overflow scraping failed: ${response.status}`);
        return jobs;
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      $('.listResults .result').each((index, element) => {
        if (jobs.length >= limit) return false;

        try {
          const $job = $(element);
          const title = $job.find('.job-link').text().trim();
          const company = $job.find('.fc-black-700').text().trim();
          const tags = $job.find('.post-tag').map((i, el) => $(el).text().trim()).get();
          const jobUrl = 'https://stackoverflow.com' + $job.find('.job-link').attr('href');
          const jobId = `stackoverflow-${Date.now()}-${index}`;

          // Check if job matches keywords
          const matchesKeyword = keywords.some(keyword => 
            title.toLowerCase().includes(keyword.toLowerCase()) ||
            tags.some(tag => tag.toLowerCase().includes(keyword.toLowerCase()))
          );

          if (title && company && matchesKeyword) {
            jobs.push({
              title,
              company,
              location: 'Remote',
              description: `Technologies: ${tags.join(', ')}`,
              url: jobUrl,
              externalId: jobId,
              jobBoard: 'Stack Overflow'
            });
          }
        } catch (error) {
          console.error('Error parsing Stack Overflow job:', error);
        }
      });
    } catch (error) {
      console.error('Error scraping Stack Overflow:', error);
    }

    return jobs;
  }

  async scrapeAllJobBoards(keywords: string[], locations: string[] = [], limit: number = 50): Promise<ScrapedJob[]> {
    const allJobs: ScrapedJob[] = [];
    
    console.log(`Starting comprehensive job search for: ${keywords.join(', ')}`);
    
    try {
      // Scrape from multiple job boards in parallel
      const [indeedJobs, remoteOkJobs, linkedinJobs, stackoverflowJobs] = await Promise.allSettled([
        this.scrapeIndeedJobs(keywords, locations, Math.floor(limit * 0.4)),
        this.scrapeRemoteOkJobs(keywords, Math.floor(limit * 0.3)),
        this.scrapeLinkedInJobs(keywords, locations, Math.floor(limit * 0.2)),
        this.scrapeStackOverflowJobs(keywords, Math.floor(limit * 0.1))
      ]);

      // Collect all successful results
      if (indeedJobs.status === 'fulfilled') {
        console.log(`✓ Indeed: ${indeedJobs.value.length} jobs`);
        allJobs.push(...indeedJobs.value);
      } else {
        console.log(`✗ Indeed scraping failed:`, indeedJobs.reason);
      }
      
      if (remoteOkJobs.status === 'fulfilled') {
        console.log(`✓ RemoteOK: ${remoteOkJobs.value.length} jobs`);
        allJobs.push(...remoteOkJobs.value);
      } else {
        console.log(`✗ RemoteOK scraping failed:`, remoteOkJobs.reason);
      }
      
      if (linkedinJobs.status === 'fulfilled') {
        console.log(`✓ LinkedIn: ${linkedinJobs.value.length} jobs`);
        allJobs.push(...linkedinJobs.value);
      } else {
        console.log(`✗ LinkedIn scraping failed:`, linkedinJobs.reason);
      }
      
      if (stackoverflowJobs.status === 'fulfilled') {
        console.log(`✓ Stack Overflow: ${stackoverflowJobs.value.length} jobs`);
        allJobs.push(...stackoverflowJobs.value);
      } else {
        console.log(`✗ Stack Overflow scraping failed:`, stackoverflowJobs.reason);
      }

    } catch (error) {
      console.error('Critical error in job board scraping:', error);
    }

    // Remove duplicates based on title + company
    const uniqueJobs = allJobs.filter((job, index, self) => 
      index === self.findIndex(j => 
        j.title.toLowerCase() === job.title.toLowerCase() && 
        j.company.toLowerCase() === job.company.toLowerCase()
      )
    );

    console.log(`Job scraping completed: ${uniqueJobs.length} unique jobs found`);
    return uniqueJobs.slice(0, limit);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Convert scraped job to database format
  convertToInsertJob(scrapedJob: ScrapedJob): InsertJob {
    return {
      title: scrapedJob.title,
      company: scrapedJob.company,
      location: scrapedJob.location,
      description: scrapedJob.description,
      requirements: scrapedJob.requirements,
      salary: scrapedJob.salary,
      jobBoard: scrapedJob.jobBoard,
      externalId: scrapedJob.externalId,
      url: scrapedJob.url,
      isActive: true
    };
  }
}

export const jobScraperService = new JobScraperService();
