import { API_ENDPOINTS } from './config'
import { MODEL_PULL_NAMES } from './model-service'
import type { Document } from './document-processor'

interface EmbeddingResponse {
  embedding: number[]
}

export class EmbeddingService {
  private static instance: EmbeddingService
  private modelName: string

  private constructor(modelName: string = 'llama2') {
    this.modelName = modelName
  }

  static getInstance(modelName?: string): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService(modelName)
    }
    return EmbeddingService.instance
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${API_ENDPOINTS.ollama}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL_PULL_NAMES[this.modelName] || this.modelName,
          prompt: text
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate embedding: ${response.statusText}`)
      }

      const data = await response.json()
      if (!data.embedding || !Array.isArray(data.embedding)) {
        throw new Error('Invalid embedding response from Ollama')
      }

      return data.embedding
    } catch (error) {
      console.error('Error generating embedding:', error)
      throw error
    }
  }

  async embedDocuments(documents: Document[]): Promise<Document[]> {
    const embeddedDocs = await Promise.all(
      documents.map(async (doc) => {
        try {
          const embedding = await this.generateEmbedding(doc.content)
          return { ...doc, embedding }
        } catch (error) {
          console.error(`Failed to embed document ${doc.id}:`, error)
          return doc
        }
      })
    )

    return embeddedDocs
  }

  async embedQuery(query: string): Promise<number[]> {
    return this.generateEmbedding(query)
  }

  setModel(modelName: string) {
    this.modelName = modelName
  }
}

// Export singleton instance
export const embeddingService = EmbeddingService.getInstance() 