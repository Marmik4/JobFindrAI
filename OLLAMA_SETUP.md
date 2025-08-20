# Quick Ollama Setup for JobBot AI

Follow these steps to get free local AI running in under 5 minutes:

## Step 1: Install Ollama

### macOS (easiest):
```bash
brew install ollama
```

### Linux:
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Windows:
1. Download from: https://ollama.ai/download
2. Run the installer
3. Open Command Prompt or PowerShell

## Step 2: Start Ollama Service

Open terminal/command prompt and run:
```bash
ollama serve
```

Keep this terminal window open. You should see:
```
Ollama is running on http://localhost:11434
```

## Step 3: Install a Model

**Open a NEW terminal window** (keep the first one running) and choose one model:

### For Basic Use (Recommended):
```bash
ollama pull llama2
```
- Size: 3.8GB
- Good balance of speed and quality
- Works well for resume analysis

### For Best Quality:
```bash
ollama pull mistral
```
- Size: 4.1GB  
- Higher quality responses
- Better for detailed analysis

### For Fastest Speed:
```bash
ollama pull tinyllama
```
- Size: 636MB
- Fastest responses
- Basic but functional

### For Technical Resumes:
```bash
ollama pull codellama
```
- Size: 3.8GB
- Specialized for code/technical content
- Great for developer resumes

## Step 4: Test Your Setup

In the same terminal where you installed the model:
```bash
ollama run llama2 "Hello, are you working?"
```

You should get a response from the AI. If you do, you're all set!

## Step 5: Use with JobBot

1. Go back to JobBot AI
2. Upload a resume - it will automatically use Ollama for skill extraction
3. Try the "ATS Check" or "Optimize" buttons
4. All AI features now work locally and privately!

## Verification

Visit `/llm-setup` in JobBot to see the status. You should see:
- ✅ Ollama (Local): Available
- Active Provider: ollama

## Common Issues & Solutions

### "Connection refused" error:
- Make sure `ollama serve` is running in a terminal
- Check that you see "Ollama is running on http://localhost:11434"

### "Model not found" error:
- Run `ollama list` to see installed models
- Install a model with `ollama pull llama2`

### Slow responses:
- Try `tinyllama` for faster responses: `ollama pull tinyllama`
- Close other applications to free up memory

### Can't install:
- Windows: Make sure you have admin privileges
- macOS: Install Homebrew first: `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
- Linux: You might need `sudo` permissions

## Model Comparison

| Model | Size | Speed | Quality | Best For |
|-------|------|-------|---------|----------|
| tinyllama | 636MB | ⚡⚡⚡ | ⭐⭐ | Quick testing |
| llama2 | 3.8GB | ⚡⚡ | ⭐⭐⭐ | General use |
| mistral | 4.1GB | ⚡ | ⭐⭐⭐⭐ | Best quality |
| codellama | 3.8GB | ⚡⚡ | ⭐⭐⭐ | Tech resumes |

## What Happens Next

Once Ollama is running:
- JobBot automatically detects it
- All AI features work offline
- Your resume data stays on your computer
- No API costs or rate limits
- Works without internet (after model download)

## Need Help?

1. Check Ollama is running: `curl http://localhost:11434/api/tags`
2. List your models: `ollama list`
3. Restart Ollama: Stop with Ctrl+C, then run `ollama serve` again
4. Check JobBot's LLM Setup page for real-time status

You now have free, private AI for resume optimization!