# LLM Setup Guide for JobBot AI

JobBot AI supports multiple LLM providers, including free and open-source alternatives to OpenAI. Here are your options:

## Option 1: OpenAI (Paid)
**Best performance but requires paid API key**

1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add it to your environment: `OPENAI_API_KEY=your_key_here`
3. All AI features will work with GPT-4o (best quality)

## Option 2: Ollama (Free Local LLM)
**Completely free, runs on your computer**

### Installation:
1. **Install Ollama:**
   ```bash
   # macOS
   brew install ollama
   
   # Linux
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Windows
   # Download from https://ollama.ai/download
   ```

2. **Start Ollama service:**
   ```bash
   ollama serve
   ```

3. **Install a model (choose one):**
   ```bash
   # Lightweight model (1.7GB) - fastest
   ollama pull tinyllama
   
   # Balanced model (3.8GB) - recommended
   ollama pull llama2
   
   # High-quality model (7GB) - best results
   ollama pull mistral
   
   # Code-focused model (4.1GB) - great for tech resumes
   ollama pull codellama
   ```

4. **Test your setup:**
   ```bash
   ollama run llama2 "Hello, how are you?"
   ```

### Ollama Model Recommendations:
- **For basic resume analysis:** `tinyllama` (fastest)
- **For general use:** `llama2` (balanced)
- **For best quality:** `mistral` (slower but better)
- **For technical resumes:** `codellama` (specialized)

## Option 3: Hugging Face (Free API)
**Free tier with limitations**

1. Sign up at [Hugging Face](https://huggingface.co/)
2. Get your API token from [Settings > Access Tokens](https://huggingface.co/settings/tokens)
3. Add it to environment: `HUGGINGFACE_API_KEY=your_token_here`
4. Free tier includes 30,000 tokens/month

## How JobBot Chooses Your LLM

The system automatically detects and uses the best available option:

1. **First:** Tries OpenAI (if API key is valid)
2. **Second:** Tries Ollama (if running locally on port 11434)
3. **Third:** Falls back to Hugging Face (free but limited)
4. **Last:** Uses intelligent fallback responses

## Setting Up Environment Variables

### In Replit:
1. Go to your Replit project
2. Click the "Secrets" tab (🔒 icon)
3. Add your keys:
   - `OPENAI_API_KEY` = `sk-your-openai-key`
   - `HUGGINGFACE_API_KEY` = `hf_your-huggingface-token`

### In Local Development:
Create a `.env` file:
```bash
OPENAI_API_KEY=sk-your-openai-key
HUGGINGFACE_API_KEY=hf_your-huggingface-token
```

## Performance Comparison

| Provider | Cost | Speed | Quality | Setup Difficulty |
|----------|------|-------|---------|------------------|
| OpenAI | $$$ | Fast | Excellent | Easy |
| Ollama (local) | Free | Medium | Good | Medium |
| Hugging Face | Free* | Slow | Fair | Easy |

*Free tier has monthly limits

## Troubleshooting

### Ollama Issues:
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Restart Ollama
ollama serve

# List installed models
ollama list

# Update a model
ollama pull llama2
```

### Common Errors:
- **"No LLM provider available"** → Follow setup for at least one option above
- **"Connection refused"** → Make sure Ollama is running (`ollama serve`)
- **"Rate limit exceeded"** → Wait or switch to different provider
- **"Model not found"** → Install model with `ollama pull model_name`

## Recommended Setup for Different Users

### **Casual Users (No coding experience):**
- Use Hugging Face free tier
- Simple signup, add API key to Secrets

### **Privacy-Conscious Users:**
- Use Ollama locally
- All processing happens on your computer
- No data sent to external services

### **Professional Users:**
- Start with OpenAI for best results
- Fall back to Ollama for privacy-sensitive resumes
- Use multiple providers for different use cases

### **Developers:**
- Set up all three providers
- Customize model selection in `llmService.ts`
- Add new providers or models as needed

## Advanced Configuration

You can modify `server/services/llmService.ts` to:
- Change default models
- Add new LLM providers
- Customize fallback behavior
- Adjust token limits and timeouts

## Getting Help

If you need assistance:
1. Check the console logs for specific error messages
2. Verify your API keys are correctly set
3. Test each provider independently
4. Review this guide for troubleshooting steps

The system is designed to work even if some providers fail, so you'll always get some level of AI functionality.