# Mata AI - Complete Setup Guide

Welcome to Mata AI! This guide will help you get everything set up and running in minutes.

## What is Mata?

Mata is a modern desktop chat application that lets you run AI models locally on your computer. All your data stays private and secure - nothing is sent to the cloud.

## Prerequisites

Before you start, make sure you have:
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Ollama** - Required for running AI models locally
- At least **8GB of RAM** (16GB recommended for larger models)
- **Windows, macOS, or Linux**

## Step-by-Step Installation

### 1. Install Ollama

Ollama is what powers the AI models in Mata.

**macOS/Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows:**
1. Download from [ollama.com/download](https://ollama.com/download)
2. Run the installer
3. Follow the on-screen instructions

### 2. Start Ollama Service

Open a terminal and run:
```bash
ollama serve
```

**Important:** Keep this terminal window open while using Mata!

### 3. Install Your First AI Model

Open a **new** terminal window and run:

```bash
# For a good balance of speed and quality (recommended):
ollama pull deepseek-r1:7b

# Or for a faster, smaller model:
ollama pull deepseek-r1:1.5b

# For image analysis:
ollama pull llama3.2-vision:11b
```

This will download the model. It may take a few minutes depending on your internet connection.

### 4. Install Mata

```bash
# Clone the repository
git clone https://github.com/jacobkobr/mata.git
cd mata

# Install dependencies
npm install

# Start the application
npm run electron-dev
```

### 5. Start Chatting!

1. Mata will launch automatically
2. In the welcome screen, click on the model selector
3. Choose your installed model (e.g., "DeepSeek 7B")
4. Start asking questions!

## Features Overview

### 💬 Chat with AI Models
- Fast, local AI responses
- Multiple model support
- Switch between models easily

### 📁 File & Image Upload
- Upload text files for analysis
- Analyze images with vision models
- Drag and drop support

### 🔍 Chat History
- All conversations saved locally
- Full-text search across chats
- Organize by date

### ⚡ Compact Mode
- Toggle with `Ctrl+Shift+M` (Windows/Linux) or `Cmd+Shift+M` (Mac)
- Always-on-top mini window
- Quick access without switching windows

### 🎨 Themes
- Dark and light modes
- System theme aware
- Easy toggle

### 🖥️ Hardware Monitoring
- Track CPU and GPU usage
- Monitor memory consumption
- Optimize performance

## Installing More Models

### From Within Mata
1. Click the Settings icon (⚙️) in the top right
2. Browse available models
3. Click "Install" on any model
4. Wait for download to complete

### From Command Line
```bash
# View all installed models
ollama list

# Install specific models
ollama pull llama2:7b           # General conversation
ollama pull codellama:7b        # Code generation
ollama pull mistral:latest      # Alternative model
ollama pull gemma:7b            # Google's model

# Browse all available models
# Visit: https://ollama.com/library
```

## Model Recommendations by Use Case

### General Conversation
- **DeepSeek R1 7B** - Best balance of quality and speed
- **Llama 2 7B** - Reliable and fast
- **Mistral 7B** - Great for creative tasks

### Code & Programming
- **CodeLlama 7B** - Optimized for code
- **DeepSeek R1 8B** - Excellent for debugging

### Image Analysis
- **Llama Vision 11B** - Analyze images, screenshots, diagrams

### Quick & Light
- **DeepSeek R1 1.5B** - Fastest, good for simple tasks
- **Phi-2** - Compact but capable

## Keyboard Shortcuts

- `Ctrl+Shift+M` (Windows/Linux) or `Cmd+Shift+M` (Mac) - Toggle compact mode
- `Ctrl+N` or `Cmd+N` - New chat
- `/` - Focus input
- `Ctrl+Shift+L` or `Cmd+Shift+L` - Toggle theme
- `Enter` - Send message
- `Shift+Enter` - New line in message

## Troubleshooting

### "Could not connect to Ollama"
**Solution:** Make sure Ollama is running. Open a terminal and run `ollama serve`

### "No models installed"
**Solution:** Install at least one model:
```bash
ollama pull deepseek-r1:7b
```
Then restart Mata.

### Model is slow
**Solutions:**
- Use a smaller model (1.5B or 2B)
- Close other applications to free up RAM
- Check the Hardware Monitor in Settings
- Consider upgrading your RAM

### Application won't start
**Solutions:**
1. Make sure Node.js 18+ is installed: `node --version`
2. Reinstall dependencies: `npm install`
3. Clear cache: `rm -rf node_modules out .next` then `npm install`

### Build fails
**Solution:**
```bash
npm run build
```
If errors persist, check the console output for specific issues.

## Building Desktop Application

To create a standalone desktop app:

```bash
# Build for your current platform
npm run electron-build

# Or build for specific platforms
npm run electron-build -- --win    # Windows
npm run electron-build -- --mac    # macOS
npm run electron-build -- --linux  # Linux
```

The built application will be in the `dist` folder.

## Advanced Configuration

### Adding Custom Model Knowledge

1. Open Settings (⚙️ icon)
2. Scroll to "Context Management"
3. Add information about yourself or your preferences
4. The AI will remember this in all conversations

Example:
```
I'm a Python developer working on web applications.
I prefer FastAPI over Flask.
I use PostgreSQL for databases.
```

### Performance Optimization

In Settings > Performance:
- **GPU Acceleration** - Enable if you have a compatible GPU
- **Memory Management** - Auto-optimize for long conversations
- **Context Window** - Adjust how much conversation history to remember

## Getting Help

- **Documentation:** Check the README.md
- **Issues:** Report bugs on GitHub
- **Community:** Join discussions on GitHub

## Next Steps

1. ✅ Install Ollama
2. ✅ Pull a model
3. ✅ Install and run Mata
4. 🎯 Try uploading a file for analysis
5. 🎯 Explore different models
6. 🎯 Set up your custom model knowledge
7. 🎯 Try compact mode for quick access

Enjoy using Mata AI! 🚀
