export type ModelSize = '0.5b' | '1.5b' | '2b' | '3b' | '4b' | '7b' | '8b' | '11b' | '12b' | '13b' | '14b' | '32b'

export interface AIModel {
  id: string
  name: string
  provider: 'ollama'
  family: string
  size: ModelSize
  description: string
  capabilities: string[]
  isExperimental?: boolean
}

export const MODEL_FAMILIES = {
  DEEPSEEK: 'DeepSeek',
  LLAMA: 'Llama',
  MISTRAL: 'Mistral',
  QWEN: 'Qwen',
  GEMMA: 'Gemma',
  PHI: 'Phi',
  CODE_LLAMA: 'CodeLlama',
} as const

export const AI_MODELS: AIModel[] = [
  {
    id: 'llama2-7b',
    name: 'Llama 2 7B',
    provider: 'ollama',
    family: MODEL_FAMILIES.LLAMA,
    size: '7b',
    description: 'Meta\'s Llama 2 base model, good for general-purpose tasks and conversations.',
    capabilities: ['Text Generation', 'Reasoning', 'Task Solving'],
  },
  {
    id: 'llama2-13b',
    name: 'Llama 2 13B',
    provider: 'ollama',
    family: MODEL_FAMILIES.LLAMA,
    size: '13b',
    description: 'Larger Llama 2 model with improved reasoning and generation capabilities.',
    capabilities: ['Advanced Reasoning', 'Text Generation', 'Complex Tasks'],
  },
  {
    id: 'codellama-7b',
    name: 'CodeLlama 7B',
    provider: 'ollama',
    family: MODEL_FAMILIES.CODE_LLAMA,
    size: '7b',
    description: 'Specialized model for code generation and understanding.',
    capabilities: ['Code Generation', 'Code Analysis', 'Technical Q&A'],
  },
  {
    id: 'codellama-13b',
    name: 'CodeLlama 13B',
    provider: 'ollama',
    family: MODEL_FAMILIES.CODE_LLAMA,
    size: '13b',
    description: 'Larger CodeLlama model with enhanced programming capabilities.',
    capabilities: ['Advanced Code Generation', 'Code Analysis', 'Technical Q&A', 'Multiple Languages'],
  },
  {
    id: 'llama-vision',
    name: 'Llama Vision 11B',
    provider: 'ollama',
    family: MODEL_FAMILIES.LLAMA,
    size: '11b',
    description: 'Llama 3.2-Vision model optimized for visual recognition, image reasoning, and captioning.',
    capabilities: ['Image Analysis', 'Visual Reasoning', 'Image Captioning', 'Visual Q&A'],
  },
  {
    id: 'deepseek-7b',
    name: 'DeepSeek 7B',
    provider: 'ollama',
    family: MODEL_FAMILIES.DEEPSEEK,
    size: '7b',
    description: 'DeepSeek\'s first-generation reasoning model with strong performance, based on Llama architecture.',
    capabilities: ['Reasoning', 'Code Generation', 'Text Generation'],
  },
  {
    id: 'deepseek-1.5b',
    name: 'DeepSeek 1.5B',
    provider: 'ollama',
    family: MODEL_FAMILIES.DEEPSEEK,
    size: '1.5b',
    description: 'Lightweight version of DeepSeek, good for basic tasks with lower resource requirements.',
    capabilities: ['Text Generation', 'Basic Reasoning'],
  },
  {
    id: 'deepseek-8b',
    name: 'DeepSeek 8B',
    provider: 'ollama',
    family: MODEL_FAMILIES.DEEPSEEK,
    size: '8b',
    description: 'Balanced model offering good performance and reasonable resource usage.',
    capabilities: ['Reasoning', 'Code Generation', 'Text Generation'],
  },
  {
    id: 'deepseek-14b',
    name: 'DeepSeek 14B',
    provider: 'ollama',
    family: MODEL_FAMILIES.DEEPSEEK,
    size: '14b',
    description: 'Larger model with improved reasoning and generation capabilities.',
    capabilities: ['Advanced Reasoning', 'Code Generation', 'Text Generation'],
  },
  {
    id: 'deepseek-32b',
    name: 'DeepSeek 32B',
    provider: 'ollama',
    family: MODEL_FAMILIES.DEEPSEEK,
    size: '32b',
    description: 'High-performance model for complex tasks, requires significant resources.',
    capabilities: ['Complex Reasoning', 'Advanced Code Generation', 'High-Quality Text'],
  },
  {
    id: 'mistral-7b',
    name: 'Mistral 7B',
    provider: 'ollama',
    family: MODEL_FAMILIES.MISTRAL,
    size: '7b',
    description: 'Efficient and powerful 7B model from Mistral AI, great all-around performance.',
    capabilities: ['Text Generation', 'Code Generation', 'Task Solving'],
  },
  {
    id: 'phi-2',
    name: 'Phi-2',
    provider: 'ollama',
    family: MODEL_FAMILIES.PHI,
    size: '2b',
    description: 'Compact but powerful model from Microsoft, excellent for its size.',
    capabilities: ['Text Generation', 'Basic Reasoning', 'Efficient Processing'],
  },
  {
    id: 'gemma-2b',
    name: 'Gemma 2B',
    provider: 'ollama',
    family: MODEL_FAMILIES.GEMMA,
    size: '2b',
    description: 'Lightweight model from Google DeepMind, good for basic tasks.',
    capabilities: ['Text Generation', 'Basic Reasoning'],
  },
  {
    id: 'gemma-7b',
    name: 'Gemma 7B',
    provider: 'ollama',
    family: MODEL_FAMILIES.GEMMA,
    size: '7b',
    description: 'Full-size Gemma model with strong general performance.',
    capabilities: ['Text Generation', 'Code Generation', 'Task Solving'],
  },
  {
    id: 'qwen-1.5b',
    name: 'Qwen 1.5B',
    provider: 'ollama',
    family: MODEL_FAMILIES.QWEN,
    size: '1.5b',
    description: 'Efficient model from Alibaba Cloud, good for basic tasks.',
    capabilities: ['Text Generation', 'Basic Reasoning'],
  },
  {
    id: 'qwen-7b',
    name: 'Qwen 7B',
    provider: 'ollama',
    family: MODEL_FAMILIES.QWEN,
    size: '7b',
    description: 'Well-rounded model with good performance across various tasks.',
    capabilities: ['Text Generation', 'Code Generation', 'Task Solving'],
  },
  {
    id: 'qwen-14b',
    name: 'Qwen 14B',
    provider: 'ollama',
    family: MODEL_FAMILIES.QWEN,
    size: '14b',
    description: 'Larger model with improved capabilities, good balance of performance and resources.',
    capabilities: ['Advanced Reasoning', 'Code Generation', 'Text Generation'],
  },
  {
    id: 'mistral-nemo',
    name: 'Mistral Nemo 12B',
    provider: 'ollama',
    family: MODEL_FAMILIES.MISTRAL,
    size: '12b',
    description: 'Mistral\'s Nemo model optimized for coding and technical tasks.',
    capabilities: ['Code Generation', 'Technical Q&A', 'Advanced Reasoning'],
  },
] as const

export const DEFAULT_MODEL = 'deepseek-7b'

export const API_ENDPOINTS = {
  ollama: 'http://localhost:11434',
  deepseek: 'http://localhost:8080/api',
} as const

export const KEYBOARD_SHORTCUTS = {
  toggleWindow: 'ctrl+shift+m',
  newChat: 'ctrl+e',
  focusInput: '/',
  toggleTheme: 'ctrl+shift+l',
} as const

export const LOCAL_STORAGE_KEYS = {
  chatHistory: 'mata:chatHistory',
  settings: 'mata:settings',
  theme: 'mata:theme',
} as const

export const MODEL_PULL_NAMES: Record<string, string> = {
  'mistral-nemo': 'mistral-nemo:latest',
} 