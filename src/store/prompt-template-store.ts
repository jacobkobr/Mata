import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { PromptTemplate } from '@/lib/prompt-templates'

interface PromptTemplateState {
  templates: PromptTemplate[]
  addTemplate: (trigger: string, description: string, body: string) => void
  updateTemplate: (id: string, fields: Partial<Omit<PromptTemplate, 'id' | 'createdAt'>>) => void
  removeTemplate: (id: string) => void
}

const DEFAULT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'default-explain',
    trigger: 'explain',
    description: 'Explain a piece of code in detail',
    body: 'Explain the following code in detail — what it does, why it might be written this way, and anything non-obvious about it:\n\n{{code}}',
    createdAt: Date.now(),
  },
  {
    id: 'default-fix',
    trigger: 'fix',
    description: 'Find and fix a bug',
    body: 'This code has a bug. Find it, explain what\'s wrong, and show a corrected version:\n\n{{code}}',
    createdAt: Date.now(),
  },
  {
    id: 'default-summarize',
    trigger: 'summarize',
    description: 'Summarize a block of text',
    body: 'Summarize the following in a few concise bullet points:\n\n{{text}}',
    createdAt: Date.now(),
  },
]

export const usePromptTemplateStore = create<PromptTemplateState>()(
  persist(
    (set) => ({
      templates: DEFAULT_TEMPLATES,
      addTemplate: (trigger, description, body) => set((state) => ({
        templates: [
          ...state.templates,
          {
            id: uuidv4(),
            trigger: trigger.trim().toLowerCase().replace(/\s+/g, '-'),
            description: description.trim(),
            body,
            createdAt: Date.now(),
          },
        ],
      })),
      updateTemplate: (id, fields) => set((state) => ({
        templates: state.templates.map(t => t.id === id ? {
          ...t,
          ...fields,
          trigger: fields.trigger ? fields.trigger.trim().toLowerCase().replace(/\s+/g, '-') : t.trigger,
        } : t),
      })),
      removeTemplate: (id) => set((state) => ({
        templates: state.templates.filter(t => t.id !== id),
      })),
    }),
    {
      name: 'mata:prompt-templates',
    }
  )
)
