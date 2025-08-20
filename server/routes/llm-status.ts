import type { Express } from "express";

export function registerLLMStatusRoutes(app: Express) {
  // Check LLM provider status
  app.get("/api/llm/status", async (req, res) => {
    const status = {
      openai: false,
      ollama: false,
      huggingface: false,
      activeProvider: 'none' as string,
      recommendations: [] as string[]
    };

    // Check OpenAI
    if (process.env.OPENAI_API_KEY) {
      try {
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        
        await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: "test" }],
          max_tokens: 1
        });
        
        status.openai = true;
        status.activeProvider = 'openai';
      } catch (error: any) {
        console.log("OpenAI check failed:", error.message);
        if (error.message?.includes('quota')) {
          status.recommendations.push("OpenAI quota exceeded - consider Ollama or Hugging Face");
        } else if (error.message?.includes('api_key')) {
          status.recommendations.push("Invalid OpenAI API key - check your configuration");
        }
      }
    } else {
      status.recommendations.push("No OpenAI API key found - add OPENAI_API_KEY to use GPT models");
    }

    // Check Ollama
    try {
      const response = await fetch('http://localhost:11434/api/tags', {
        signal: AbortSignal.timeout(3000) // 3 second timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        status.ollama = true;
        
        if (!status.openai) {
          status.activeProvider = 'ollama';
        }
        
        if (data.models && data.models.length > 0) {
          status.recommendations.push(`Ollama running with ${data.models.length} models available`);
        } else {
          status.recommendations.push("Ollama running but no models installed - run 'ollama pull llama2'");
        }
      }
    } catch (error) {
      status.recommendations.push("Ollama not running - install and run 'ollama serve' for free local AI");
    }

    // Check Hugging Face
    if (process.env.HUGGINGFACE_API_KEY) {
      try {
        const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-large', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputs: "test",
            parameters: { max_new_tokens: 1 }
          }),
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        if (response.status === 200 || response.status === 503) { // 503 = model loading
          status.huggingface = true;
          
          if (!status.openai && !status.ollama) {
            status.activeProvider = 'huggingface';
          }
        }
      } catch (error) {
        console.log("Hugging Face check failed:", error);
      }
    } else {
      if (!status.openai && !status.ollama) {
        status.recommendations.push("Add HUGGINGFACE_API_KEY for free AI with monthly limits");
      }
    }

    // Set final active provider
    if (!status.openai && !status.ollama && !status.huggingface) {
      status.activeProvider = 'fallback';
      status.recommendations.push("No AI providers available - using basic fallback responses");
      status.recommendations.push("See LLM_SETUP.md for setup instructions");
    }

    // Success message if we have a working provider
    if (status.activeProvider !== 'none' && status.activeProvider !== 'fallback') {
      status.recommendations.unshift(`✅ AI features working with ${status.activeProvider}`);
    }

    res.json(status);
  });

  // Get setup instructions
  app.get("/api/llm/setup-guide", async (req, res) => {
    const setupSteps = {
      ollama: {
        title: "Setup Ollama (Free Local AI)",
        steps: [
          "Install Ollama from https://ollama.ai/download",
          "Run 'ollama serve' in terminal",
          "Install a model: 'ollama pull llama2'",
          "Restart JobBot AI - it will auto-detect Ollama"
        ],
        difficulty: "Medium",
        cost: "Free",
        privacy: "Complete (runs locally)"
      },
      huggingface: {
        title: "Setup Hugging Face (Free API)",
        steps: [
          "Sign up at https://huggingface.co",
          "Go to Settings > Access Tokens",
          "Create a new token",
          "Add HUGGINGFACE_API_KEY to your environment"
        ],
        difficulty: "Easy",
        cost: "Free (30k tokens/month)",
        privacy: "Data sent to Hugging Face"
      },
      openai: {
        title: "Setup OpenAI (Best Quality)",
        steps: [
          "Sign up at https://platform.openai.com",
          "Add payment method (required)",
          "Generate API key",
          "Add OPENAI_API_KEY to your environment"
        ],
        difficulty: "Easy",
        cost: "Pay per use (~$0.01 per resume)",
        privacy: "Data sent to OpenAI"
      }
    };

    res.json(setupSteps);
  });
}