import { v4 as uuidv4 } from 'uuid'

export interface Document {
  id: string
  content: string
  metadata: {
    source: string
    type: string
    title?: string
    pageNumber?: number
    createdAt: number
    chunkIndex?: number
  }
  embedding?: number[]
}

export interface ProcessingOptions {
  chunkSize?: number
  chunkOverlap?: number
  includeMetadata?: boolean
}

const DEFAULT_OPTIONS: ProcessingOptions = {
  chunkSize: 1000,
  chunkOverlap: 200,
  includeMetadata: true,
}

export class DocumentProcessor {
  private static instance: DocumentProcessor

  private constructor() {}

  static getInstance(): DocumentProcessor {
    if (!DocumentProcessor.instance) {
      DocumentProcessor.instance = new DocumentProcessor()
    }
    return DocumentProcessor.instance
  }

  async processText(
    text: string,
    metadata: Partial<Document['metadata']>,
    options: ProcessingOptions = {}
  ): Promise<Document[]> {
    const opts = { ...DEFAULT_OPTIONS, ...options }
    const chunks = this.splitIntoChunks(text, opts.chunkSize!, opts.chunkOverlap!)
    
    return chunks.map((chunk, index) => ({
      id: uuidv4(),
      content: chunk,
      metadata: {
        source: metadata.source || 'unknown',
        type: metadata.type || 'text',
        title: metadata.title,
        pageNumber: metadata.pageNumber,
        createdAt: Date.now(),
        chunkIndex: index,
      },
    }))
  }

  async processMarkdown(
    markdown: string,
    metadata: Partial<Document['metadata']>,
    options: ProcessingOptions = {}
  ): Promise<Document[]> {
    // Remove code blocks and special markdown syntax
    const cleanText = markdown
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`.*?`/g, '')          // Remove inline code
      .replace(/\[.*?\]\(.*?\)/g, '') // Remove links
      .replace(/[#*_~]/g, '')         // Remove formatting characters
      
    return this.processText(cleanText, { ...metadata, type: 'markdown' }, options)
  }

  async processSourceCode(
    code: string,
    metadata: Partial<Document['metadata']>,
    options: ProcessingOptions = {}
  ): Promise<Document[]> {
    // Split by function/class definitions and logical blocks
    const chunks = code
      .split(/\n\s*\n/)
      .filter(chunk => chunk.trim().length > 0)
      .map(chunk => chunk.trim())

    return chunks.map((chunk, index) => ({
      id: uuidv4(),
      content: chunk,
      metadata: {
        source: metadata.source || 'unknown',
        type: 'code',
        title: metadata.title,
        createdAt: Date.now(),
        chunkIndex: index,
      },
    }))
  }

  private splitIntoChunks(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = []
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
    let currentChunk = ''

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > chunkSize) {
        chunks.push(currentChunk.trim())
        currentChunk = sentence
        
        // Add overlap from previous chunk
        if (overlap > 0 && chunks.length > 0) {
          const prevChunk = chunks[chunks.length - 1]
          const overlapText = prevChunk.slice(-overlap)
          currentChunk = overlapText + ' ' + currentChunk
        }
      } else {
        currentChunk += ' ' + sentence
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim())
    }

    return chunks
  }

  async detectLanguage(text: string): Promise<string> {
    // Simple language detection based on common patterns
    const patterns = {
      python: /\b(def|class|import|from|if __name__ == ['"]__main__['"])\b/,
      javascript: /\b(const|let|var|function|=>|require|import from)\b/,
      typescript: /\b(interface|type|enum|namespace|declare|as)\b/,
      java: /\b(public|private|class|void|static|final)\b/,
      rust: /\b(fn|impl|struct|enum|pub|use|mod)\b/,
      go: /\b(func|package|import|type|struct|interface)\b/,
    }

    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return lang
      }
    }

    return 'text'
  }
}

// Export singleton instance
export const documentProcessor = DocumentProcessor.getInstance() 