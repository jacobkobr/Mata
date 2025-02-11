import { ragService } from './lib/rag-service'

async function testRAG() {
  try {
    console.log('🔍 Testing RAG System...\n')

    // 1. Add some test documents
    console.log('📚 Adding documents to knowledge base...')
    
    // Add a markdown document
    await ragService.addDocument(
      `# API Documentation
      
      The API uses REST principles and JSON for data exchange.
      Authentication is done via Bearer tokens.
      Rate limiting is set to 100 requests per minute.`,
      { source: 'api-docs.md', title: 'API Documentation' },
      'markdown'
    )

    // Add some code
    await ragService.addDocument(
      `function authenticate(token: string) {
        if (!token.startsWith('Bearer ')) {
          throw new Error('Invalid token format')
        }
        // Verify JWT token
        return verifyToken(token.substring(7))
      }`,
      { source: 'auth.ts', title: 'Authentication Function' },
      'code'
    )

    // Add plain text
    await ragService.addDocument(
      `The rate limiter uses a sliding window algorithm to track requests.
      Each user is identified by their API key and IP address.
      When the limit is exceeded, requests are queued for the next window.`,
      { source: 'rate-limiter.txt', title: 'Rate Limiting Details' },
      'text'
    )

    console.log('✅ Documents added successfully\n')

    // 2. Test some queries
    const queries = [
      'How is authentication handled?',
      'What is the rate limit?',
      'How does the rate limiter work?',
      'What is the API documentation about?'
    ]

    for (const query of queries) {
      console.log(`🔎 Query: "${query}"`)
      const result = await ragService.query(query)
      
      console.log('Found', result.documents.length, 'relevant documents')
      console.log('Relevance scores:', result.scores)
      
      // Generate and show the prompt
      const prompt = await ragService.generatePrompt(query, result.documents)
      console.log('\nGenerated Prompt:')
      console.log(prompt)
      console.log('\n---\n')
    }

    // 3. Show statistics
    const stats = ragService.getStats()
    console.log('📊 System Statistics:')
    console.log(JSON.stringify(stats, null, 2))

  } catch (error) {
    console.error('❌ Error testing RAG:', error)
  }
}

// Run the test
testRAG() 