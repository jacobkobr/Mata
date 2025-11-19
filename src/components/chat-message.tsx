'use client'

import { useState } from 'react'
import { Message } from '@/store/chat-store'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import { AlertCircle, ChevronDown, ChevronRight, Brain, Bot, User2 } from 'lucide-react'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'

interface ChatMessageProps {
  message: Message
  isCompact?: boolean
}

export function ChatMessage({ message, isCompact = false }: ChatMessageProps) {
  const [showThinking, setShowThinking] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const isUser = message.role === 'user'
  const isError = message.role === 'error'

  // Extract thinking content if present
  const thinkMatches = message.content.match(/<think>([\s\S]*?)<\/think>/g)
  const thinking = thinkMatches 
    ? thinkMatches
        .map(match => match.replace(/<think>|<\/think>/g, '').trim())
        .join('\n\n')
    : null

  // Process LaTeX expressions
  const processContent = (text: string) => {
    // Convert LaTeX expressions to plain text
    return text
      .replace(/\[([^\]]+)\]/g, '$1') // Remove square brackets
      .replace(/<InlineMath>([^<]+)<\/InlineMath>/g, '$1') // Remove InlineMath tags
      .replace(/\\boxed{([^}]+)}/g, '$1') // Remove boxed
      .replace(/\\frac{(\d+)}{(\d+)}/g, '$1/$2') // Convert fractions to division
      .trim()
  }

  // Remove the thinking tags and any surrounding whitespace
  const cleanContent = processContent(
    message.content
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .trim()
  )

  const components = {
    pre: ({ children }: { children: React.ReactNode }) => (
      <pre className="bg-muted p-4 rounded-lg overflow-auto">
        {children}
      </pre>
    ),
    code: ({ children }: { children: React.ReactNode }) => (
      <code className="bg-muted px-1.5 py-0.5 rounded">
        {children}
      </code>
    ),
    a: ({ href, children }: { href?: string; children: React.ReactNode }) => (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
        {children}
      </a>
    ),
  } as Components

  return (
    <div className={cn(
      "py-6 px-4 flex gap-4",
      message.role === 'assistant' ? 'bg-muted/50' : 'bg-background',
      isError && 'bg-destructive/5 border-l-2 border-destructive',
      isCompact && 'py-3 px-3'
    )}>
      {/* Avatar */}
      <div className={cn(
        "rounded-full overflow-hidden flex-shrink-0",
        isCompact ? "w-6 h-6" : "w-8 h-8"
      )}>
        {isError ? (
          <div className="w-full h-full bg-destructive flex items-center justify-center text-destructive-foreground">
            <AlertCircle className={cn("w-5 h-5", isCompact && "w-4 h-4")} />
          </div>
        ) : message.role === 'assistant' ? (
          <div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground">
            <Bot className={cn("w-5 h-5", isCompact && "w-4 h-4")} />
          </div>
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center">
            <User2 className={cn("w-5 h-5", isCompact && "w-4 h-4")} />
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-2">
          <span className={cn(
            'font-medium',
            isError && 'text-destructive',
            isCompact ? 'text-xs' : 'text-sm'
          )}>
            {isUser ? 'You' : isError ? 'Error' : 'Assistant'}
          </span>
          <span className={cn(
            "text-muted-foreground",
            isCompact ? 'text-[10px]' : 'text-xs'
          )}>
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
        {thinking && message.role === 'assistant' && (
          <div className="mb-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className={cn(
                "transition-transform",
                isExpanded && "rotate-90",
                isCompact ? "h-3 w-3" : "h-4 w-4"
              )} />
              <span className={cn(
                isCompact && "text-xs"
              )}>Thinking Process</span>
            </button>
            {isExpanded && (
              <div className={cn(
                "mt-2 pl-4 border-l-2 border-muted-foreground/20 text-muted-foreground",
                isCompact ? "text-xs" : "text-sm"
              )}>
                <ReactMarkdown
                  components={components}
                  remarkPlugins={[remarkGfm]}
                >
                  {thinking}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}
        <div className={cn(
          isCompact && "text-sm"
        )}>
          <ReactMarkdown
            components={components}
            remarkPlugins={[remarkGfm]}
          >
            {cleanContent}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
} 