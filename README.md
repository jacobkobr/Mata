# Mata

A modern desktop chat application built with Electron and Next.js, designed to work with local AI models through Ollama. Mata provides a sleek, native-feeling interface for interacting with various AI models while keeping all data and processing local.

Preview (clone repo and run locally for full features):
[Mata](https://mataai.netlify.app/)


## Demo Video

https://github.com/user-attachments/assets/e5be3700-8902-42ae-8549-d7109b8a179a

## Prerequisites

- Node.js 18+ and npm
- Ollama installed and running locally
- Windows, macOS, or Linux operating system

## Quick Start Guide

### 1. Install Ollama

First, install Ollama on your system:

**macOS/Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows:**
Download and install from [ollama.com/download](https://ollama.com/download)

### 2. Start Ollama Service

```bash
ollama serve
```

Keep this terminal window open. Ollama must be running for Mata to work.

### 3. Pull Your First Model

In a new terminal, pull a model to get started:

```bash
# Recommended starter model (7B, good balance of speed and quality)
ollama pull deepseek-r1:7b

# Or try a smaller, faster model
ollama pull deepseek-r1:1.5b

# For vision/image analysis
ollama pull llama3.2-vision:11b
```

### 4. Clone and Setup Mata

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

1. The app will launch automatically
2. Click on the model selector in the welcome screen
3. Select your installed model (e.g., DeepSeek 7B)
4. Start chatting with your local AI!

## Available Commands

```bash
# Development mode (with hot reload)
npm run electron-dev

# Build desktop application for your platform
npm run electron-build

# Build for specific platforms
npm run electron-build -- --win    # Windows
npm run electron-build -- --mac    # macOS
npm run electron-build -- --linux  # Linux

# Web development mode only
npm run dev

# Build for web deployment
npm run build
```

## Installing Additional Models

You can install models directly from within Mata:

1. Open Settings (gear icon in top right)
2. The current models will show their installation status
3. Click "Install" on any model to download it
4. Or use the command line:

```bash
# View all available models
ollama list

# Pull additional models
ollama pull llama2:7b
ollama pull codellama:7b
ollama pull mistral:latest
ollama pull gemma:7b

# Browse all available models at:
# https://ollama.com/library
```

## Features

- **Local AI Processing**: All data stays on your machine
- **Multiple Model Support**: Easy switching between different AI models
- **Vision Capabilities**: Analyze images with vision models
- **File Upload**: Upload text files and documents for analysis
- **Chat History**: Persistent chat storage and search
- **Hardware Monitoring**: Track CPU, GPU, and memory usage
- **Compact Mode**: Toggle compact window mode (Ctrl+Shift+M)
- **Dark/Light Theme**: System-aware theming
- **Model Knowledge**: Add custom context for personalized responses

## Technologies Used

### Core Framework
- **Next.js 14** - App Router for efficient page routing and server components
- **Electron** - Enables native desktop capabilities with custom window management and IPC communication

### State Management & Data
- **Zustand** - Lightweight state management with persistent storage capabilities, used for app settings and model configurations
- **SQLite (better-sqlite3)** - Embedded database for efficient local chat history storage with full text search support

### UI/UX
- **Radix UI** - Headless UI components providing accessible primitives for complex interactions
- **Tailwind CSS** - Utility-first CSS framework with custom theming and dark mode support
- **shadcn/ui** - Component system built on Radix UI with consistent styling and behavior

### AI Integration
- **Ollama Integration** - Custom service layer for managing local AI models with:
  - Real-time model installation tracking
  - Streaming responses
  - Multi-model support
  - Vision model capabilities

### IPC Communication
- **Custom IPC Bridge** - Secure communication channel between Electron main and renderer processes:
  - Type-safe message passing
  - Window state management
  - File system access

## Development

- Run in development mode: `npm run electron-dev`
- Build desktop app: `npm run electron-build`
- Build for specific platform:
  - Windows: `npm run electron-build -- --win`
  - macOS: `npm run electron-build -- --mac`
  - Linux: `npm run electron-build -- --linux`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details 
