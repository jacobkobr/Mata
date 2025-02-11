import { documentProcessor, type Document } from './document-processor'
import { embeddingService } from './embedding-service'
import { vectorStore } from './vector-store'

export interface RAGResult {
  documents: Document[]
  scores: number[]
}

export class RAGService {
  private static instance: RAGService

  private constructor() {}

  static getInstance(): RAGService {
    if (!RAGService.instance) {
      RAGService.instance = new RAGService()
    }
    return RAGService.instance
  }

  async addDocument(
    content: string,
    metadata: Partial<Document['metadata']>,
    type: 'text' | 'markdown' | 'code' = 'text'
  ): Promise<Document[]> {
    let documents: Document[]

    // Process the document based on type
    switch (type) {
      case 'markdown':
        documents = await documentProcessor.processMarkdown(content, metadata)
        break
      case 'code':
        documents = await documentProcessor.processSourceCode(content, metadata)
        break
      default:
        documents = await documentProcessor.processText(content, metadata)
    }

    // Generate embeddings
    const embeddedDocs = await embeddingService.embedDocuments(documents)

    // Store in vector store
    await vectorStore.addDocuments(embeddedDocs)

    return embeddedDocs
  }

  async query(
    query: string,
    options: {
      limit?: number
      threshold?: number
      filterMetadata?: Partial<Document['metadata']>
    } = {}
  ): Promise<RAGResult> {
    // Generate embedding for query
    const queryEmbedding = await embeddingService.embedQuery(query)

    // Search vector store
    const searchResults = await vectorStore.search(queryEmbedding, options.limit)

    // Filter by metadata if specified
    let results = searchResults
    if (options.filterMetadata) {
      const filteredDocs = await vectorStore.searchByMetadata(options.filterMetadata)
      const filteredIds = new Set(filteredDocs.map(d => d.id))
      results = searchResults.filter(r => filteredIds.has(r.document.id))
    }

    // Apply threshold if specified
    if (options.threshold !== undefined) {
      results = results.filter(r => r.score >= options.threshold!)
    }

    return {
      documents: results.map(r => r.document),
      scores: results.map(r => r.score),
    }
  }

  async generatePrompt(query: string, retrievedDocs: Document[]): Promise<string> {
    const context = retrievedDocs
      .map(doc => {
        const source = doc.metadata.source ? ` (from ${doc.metadata.source})` : ''
        return `---\n${doc.content}${source}\n`
      })
      .join('\n')

    return `
Context information is below.
---------------------
${context}
---------------------
Given the context information and no prior knowledge, answer the following query:
${query}

If the context doesn't contain relevant information to answer the query, say so. Do not make up information that is not supported by the context.
`
  }

  async addKnowledgeBase(documents: { content: string; type: 'text' | 'markdown' | 'code'; metadata: any }[]) {
    for (const doc of documents) {
      await this.addDocument(doc.content, doc.metadata, doc.type)
    }
  }

  async clearKnowledgeBase(): Promise<void> {
    await vectorStore.clear()
  }

  getStats() {
    return {
      vectorStore: vectorStore.getStats(),
    }
  }
}

// Export singleton instance
export const ragService = RAGService.getInstance() 