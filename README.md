# Mata

A modern desktop chat application built with Electron and Next.js, designed to work with local AI models through Ollama. Mata provides a sleek, native-feeling interface for interacting with various AI models while keeping all data and processing local.

Preview (clone repo and run locally for full features):
[Mata](https://mataai.netlify.app/)

## Features

- 🖥️ Native Desktop App – Custom title bar, window controls, and system integration
- 🎨 Modern UI – Tailwind CSS & shadcn/ui with system-aware dark/light mode
- 💬 Enhanced Chat Interface – Markdown, LaTeX support, syntax highlighting, and role-based styling
- 🤖 Multiple AI Models – Seamless model switching & management via Ollama
- 📁 File Upload Support – Drag-and-drop for text and images with validation & preview
- ⚡ Optimized Performance – Lazy loading, memory-efficient storage, and background task handling
- 💾 Local Chat History – Secure storage with file-based persistence (JSON/SQLite)
- ⌨️ Keyboard Shortcuts – Configurable multi-key combinations for productivity
- 🔄 Popout Window Mode – Resizable, draggable chat window for multitasking
- 🔒 Privacy-Focused – All processing stays on your machine—no cloud dependencies
- 📊 Hardware Monitoring – Real-time CPU, GPU, and memory tracking for optimal resource usage

## Demo Video

https://github.com/user-attachments/assets/e5be3700-8902-42ae-8549-d7109b8a179a

## Prerequisites

- Node.js 18+ and npm
- Ollama installed and running locally
- Windows, macOS, or Linux operating system

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/jacobkobr/mata.git
   cd mata
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run electron-dev
   ```

4. Build the desktop application:
   ```bash
   npm run electron-build
   ```

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
