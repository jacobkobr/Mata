import type { Document } from './document-processor'

interface VectorSearchResult {
  document: Document
  score: number
}

interface VectorStoreOptions {
  dimensions: number
  similarityThreshold?: number
  maxResults?: number
}

const DEFAULT_OPTIONS: VectorStoreOptions = {
  dimensions: 4096,  // Llama2 embedding dimensions
  similarityThreshold: 0.7,
  maxResults: 5,
}

export class VectorStore {
  private static instance: VectorStore
  private documents: Document[] = []
  private options: VectorStoreOptions

  private constructor(options: Partial<VectorStoreOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  static getInstance(options: Partial<VectorStoreOptions> = {}): VectorStore {
    if (!VectorStore.instance) {
      VectorStore.instance = new VectorStore(options)
    }
    return VectorStore.instance
  }

  async addDocuments(documents: Document[]): Promise<void> {
    // Validate embeddings
    const validDocuments = documents.filter(doc => {
      if (!doc.embedding) return false
      if (doc.embedding.length !== this.options.dimensions) {
        console.warn(`Document ${doc.id} has invalid embedding dimensions`)
        return false
      }
      return true
    })

    this.documents.push(...validDocuments)
  }

  async search(queryEmbedding: number[], limit?: number): Promise<VectorSearchResult[]> {
    if (queryEmbedding.length !== this.options.dimensions) {
      throw new Error('Query embedding has invalid dimensions')
    }

    const results: VectorSearchResult[] = []
    
    for (const doc of this.documents) {
      if (!doc.embedding) continue

      const score = this.cosineSimilarity(queryEmbedding, doc.embedding)
      if (score >= (this.options.similarityThreshold || 0)) {
        results.push({ document: doc, score })
      }
    }

    // Sort by score and limit results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit || this.options.maxResults)
  }

  async searchByMetadata(metadata: Partial<Document['metadata']>): Promise<Document[]> {
    return this.documents.filter(doc => {
      for (const [key, value] of Object.entries(metadata)) {
        if (doc.metadata[key as keyof Document['metadata']] !== value) {
          return false
        }
      }
      return true
    })
  }

  async delete(documentId: string): Promise<void> {
    this.documents = this.documents.filter(doc => doc.id !== documentId)
  }

  async clear(): Promise<void> {
    this.documents = []
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0
    let normA = 0
    let normB = 0
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }
    
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB)
    return magnitude === 0 ? 0 : dotProduct / magnitude
  }

  getStats() {
    const typeStats = this.documents.reduce((acc, doc) => {
      acc[doc.metadata.type] = (acc[doc.metadata.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalDocuments: this.documents.length,
      typeDistribution: typeStats,
      dimensions: this.options.dimensions,
    }
  }
}

// Export singleton instance
export const vectorStore = VectorStore.getInstance() 