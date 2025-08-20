import puppeteer, { Browser, Page } from "puppeteer";

export interface ApplicationFormData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  resume?: string; // file path or content
  coverLetter?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  workExperience?: string;
  education?: string;
}

export interface FormField {
  selector: string;
  value: string;
  type: 'input' | 'select' | 'textarea' | 'file' | 'checkbox';
}

export class BrowserAutomationService {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async initBrowser(): Promise<void> {
    try {
      this.browser = await puppeteer.launch({
        headless: process.env.NODE_ENV === 'production',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
      this.page = await this.browser.newPage();
      
      // Set a realistic viewport and user agent
      await this.page.setViewport({ width: 1366, height: 768 });
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      console.log('Browser automation initialized');
    } catch (error) {
      console.error('Error initializing browser:', error);
      throw error;
    }
  }

  async closeBrowser(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      console.log('Browser closed');
    } catch (error) {
      console.error('Error closing browser:', error);
    }
  }

  async navigateToJobApplication(url: string): Promise<boolean> {
    if (!this.page) {
      await this.initBrowser();
    }

    try {
      console.log(`Navigating to: ${url}`);
      await this.page!.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
      
      // Wait for the page to fully load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return true;
    } catch (error) {
      console.error('Error navigating to job application:', error);
      return false;
    }
  }

  async detectFormFields(): Promise<FormField[]> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      const fields = await this.page.evaluate(() => {
        const formFields: FormField[] = [];
        
        // Common selectors for job application forms
        const inputSelectors = [
          'input[type="text"]',
          'input[type="email"]',
          'input[type="tel"]',
          'input[name*="name"]',
          'input[name*="email"]',
          'input[name*="phone"]',
          'input[id*="name"]',
          'input[id*="email"]',
          'input[id*="phone"]'
        ];

        const textareaSelectors = [
          'textarea',
          'textarea[name*="cover"]',
          'textarea[name*="message"]',
          'textarea[id*="cover"]'
        ];

        const fileSelectors = [
          'input[type="file"]',
          'input[name*="resume"]',
          'input[name*="cv"]',
          'input[id*="resume"]',
          'input[id*="cv"]'
        ];

        // Detect input fields
        inputSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach((element) => {
            const input = element as HTMLInputElement;
            if (input.offsetParent !== null) { // Only visible elements
              formFields.push({
                selector,
                value: '',
                type: 'input'
              });
            }
          });
        });

        // Detect textareas
        textareaSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(() => {
            formFields.push({
              selector,
              value: '',
              type: 'textarea'
            });
          });
        });

        // Detect file inputs
        fileSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(() => {
            formFields.push({
              selector,
              value: '',
              type: 'file'
            });
          });
        });

        return formFields;
      });

      console.log(`Detected ${fields.length} form fields`);
      return fields;
    } catch (error) {
      console.error('Error detecting form fields:', error);
      return [];
    }
  }

  async fillApplicationForm(formData: ApplicationFormData): Promise<boolean> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      console.log('Filling application form...');

      // Fill common fields based on typical patterns
      const fieldMappings = [
        { selectors: ['input[name*="firstName"]', 'input[id*="firstName"]', 'input[name*="first_name"]'], value: formData.firstName },
        { selectors: ['input[name*="lastName"]', 'input[id*="lastName"]', 'input[name*="last_name"]'], value: formData.lastName },
        { selectors: ['input[name*="email"]', 'input[id*="email"]', 'input[type="email"]'], value: formData.email },
        { selectors: ['input[name*="phone"]', 'input[id*="phone"]', 'input[type="tel"]'], value: formData.phone },
        { selectors: ['input[name*="linkedin"]', 'input[id*="linkedin"]'], value: formData.linkedinUrl },
        { selectors: ['input[name*="portfolio"]', 'input[id*="portfolio"]', 'input[name*="website"]'], value: formData.portfolioUrl },
        { selectors: ['textarea[name*="cover"]', 'textarea[id*="cover"]', 'textarea[name*="message"]'], value: formData.coverLetter },
      ];

      for (const mapping of fieldMappings) {
        if (!mapping.value) continue;

        for (const selector of mapping.selectors) {
          try {
            const element = await this.page.$(selector);
            if (element) {
              await element.click();
              await element.evaluate(el => (el as HTMLInputElement).value = '');
              await element.type(mapping.value, { delay: 50 });
              console.log(`Filled field: ${selector}`);
              break; // Move to next mapping after successfully filling
            }
          } catch (error) {
            // Continue to next selector if this one fails
          }
        }
      }

      // Handle file upload (resume)
      if (formData.resume) {
        try {
          const fileInput = await this.page.$('input[type="file"]');
          if (fileInput) {
            await fileInput.uploadFile(formData.resume);
            console.log('Resume uploaded');
          }
        } catch (error) {
          console.error('Error uploading resume:', error);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Form filling completed');
      return true;

    } catch (error) {
      console.error('Error filling application form:', error);
      return false;
    }
  }

  async submitApplication(): Promise<boolean> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      console.log('Attempting to submit application...');

      // Common submit button selectors
      const submitSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button[name*="submit"]',
        'button[id*="submit"]',
        'button:contains("Submit")',
        'button:contains("Apply")',
        'a[href*="apply"]'
      ];

      for (const selector of submitSelectors) {
        try {
          const submitButton = await this.page.$(selector);
          if (submitButton) {
            // Check if button is visible and clickable
            const isVisible = await submitButton.evaluate(el => {
              const element = el as HTMLElement;
              return element.offsetParent !== null && !element.hasAttribute('disabled');
            });

            if (isVisible) {
              await submitButton.click();
              console.log(`Clicked submit button: ${selector}`);
              
              // Wait for navigation or success message
              try {
                await this.page.waitForNavigation({ timeout: 10000 });
              } catch {
                // No navigation happened, that's okay
              }

              await new Promise(resolve => setTimeout(resolve, 3000));
              return true;
            }
          }
        } catch (error) {
          // Continue to next selector
        }
      }

      console.warn('No submit button found or clicked');
      return false;

    } catch (error) {
      console.error('Error submitting application:', error);
      return false;
    }
  }

  async takeScreenshot(filename?: string): Promise<string | null> {
    if (!this.page) {
      return null;
    }

    try {
      const screenshotPath = filename || `screenshot-${Date.now()}.png`;
      await this.page.screenshot({ 
        path: screenshotPath as `${string}.png`, 
        fullPage: true,
        type: 'png'
      });
      console.log(`Screenshot saved: ${screenshotPath}`);
      return screenshotPath;
    } catch (error) {
      console.error('Error taking screenshot:', error);
      return null;
    }
  }

  async getCurrentUrl(): Promise<string | null> {
    if (!this.page) {
      return null;
    }
    return this.page.url();
  }

  async getPageContent(): Promise<string | null> {
    if (!this.page) {
      return null;
    }
    return await this.page.content();
  }

  // Check if application was successful by looking for success indicators
  async checkApplicationSuccess(): Promise<boolean> {
    if (!this.page) {
      return false;
    }

    try {
      // Look for common success indicators
      const successSelectors = [
        'text=thank you',
        'text=application submitted',
        'text=successfully submitted',
        'text=received your application',
        '.success',
        '.confirmation',
        '[class*="success"]'
      ];

      for (const selector of successSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element) {
            console.log(`Success indicator found: ${selector}`);
            return true;
          }
        } catch {
          // Continue checking
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking application success:', error);
      return false;
    }
  }
}

export const browserAutomationService = new BrowserAutomationService();
