'use client'

import { useState } from 'react'
import { Message } from '@/store/chat-store'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import { AlertCircle, ChevronDown, ChevronRight, Brain } from 'lucide-react'

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [showThinking, setShowThinking] = useState(false)
  const isUser = message.role === 'user'
  const isError = message.role === 'error'

  // Extract thinking content if present
  const thinkMatch = message.content.match(/<think>([^]*?)<\/think>/)
  const thinking = thinkMatch ? thinkMatch[1].trim() : null
  const cleanContent = message.content.replace(/<think>[^]*?<\/think>/, '').trim()

  const components: Components = {
    pre: ({ children }) => (
      <pre className="bg-muted p-4 rounded-lg overflow-auto">
        {children}
      </pre>
    ),
    code: ({ children }) => (
      <code className="bg-muted px-1.5 py-0.5 rounded">
        {children}
      </code>
    ),
    a: ({ href, children }) => (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
        {children}
      </a>
    ),
  }

  return (
    <div
      className={cn(
        'flex w-full gap-4 p-4',
        isUser ? 'bg-accent/50' : 'bg-background',
        isError && 'border-l-4 border-destructive bg-destructive/10'
      )}
    >
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          {isError && <AlertCircle className="h-4 w-4 text-destructive" />}
          <span className={cn('text-sm font-medium', isError && 'text-destructive')}>
            {isUser ? 'You' : isError ? 'System Message' : 'Assistant'}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <div className={cn(
          'prose prose-sm dark:prose-invert max-w-none',
          isError && 'prose-headings:text-destructive prose-a:text-destructive'
        )}>
          {thinking && !isUser && (
            <div className="mb-4">
              <button
                onClick={() => setShowThinking(!showThinking)}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
              >
                {showThinking ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                <Brain className="h-3 w-3" />
                <span>Thinking Process</span>
              </button>
              {showThinking && (
                <div className="mt-2 p-3 bg-muted/50 rounded-md text-sm text-muted-foreground">
                  <ReactMarkdown components={components}>
                    {thinking}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          )}
          <ReactMarkdown components={components}>
            {cleanContent}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
} 