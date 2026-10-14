'use client'

import { useState } from 'react'
import { Message, useChatStore } from '@/store/chat-store'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import { AlertCircle, ChevronRight, Star, Copy, Check, Pencil, RotateCcw, Trash2, X } from 'lucide-react'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { useBookmarkStore } from '@/store/bookmark-store'
import { useRailStore } from '@/store/rail-store'

interface ChatMessageProps {
  message: Message
  isCompact?: boolean
  /** Only the latest assistant reply can be regenerated, matching how ChatGPT itself works. */
  isLast?: boolean
}

export function ChatMessage({ message, isCompact = false, isLast = false }: ChatMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(message.content)
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'
  const isError = message.role === 'error'
  const isBookmarked = useBookmarkStore((state) => !!state.bookmarks[message.id])
  const toggleBookmark = useBookmarkStore((state) => state.toggleBookmark)
  const quickBookmarkColor = useRailStore((state) => state.quickBookmarkColor)
  const isLoading = useChatStore((state) => state.isLoading)
  const editMessage = useChatStore((state) => state.editMessage)
  const regenerateLastResponse = useChatStore((state) => state.regenerateLastResponse)
  const deleteMessage = useChatStore((state) => state.deleteMessage)

  // Extract thinking content if present
  const thinkMatches = message.content.match(/<think>([\s\S]*?)<\/think>/g)
  const thinking = thinkMatches
    ? thinkMatches
        .map(match => match.replace(/<think>|<\/think>/g, '').trim())
        .join('\n\n')
    : null

  // Remove the thinking tags and any surrounding whitespace; math/LaTeX is
  // rendered properly below via remark-math + rehype-katex, not regex surgery.
  const cleanContent = message.content
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .trim()

  const handleCopy = async () => {
    await navigator.clipboard.writeText(cleanContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleStartEdit = () => {
    setEditValue(message.content)
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    if (editValue.trim() && editValue !== message.content) {
      editMessage(message.id, editValue.trim())
    }
    setIsEditing(false)
  }

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

  const iconSize = isCompact ? 'h-3 w-3' : 'h-3.5 w-3.5'
  const buttonClass = 'text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40'

  const footer = (
    <div className={cn(
      'flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100',
      isBookmarked && 'opacity-100'
    )}>
      <button onClick={handleCopy} className={buttonClass} title="Copy">
        {copied ? <Check className={iconSize} /> : <Copy className={iconSize} />}
      </button>
      {isUser && (
        <button onClick={handleStartEdit} disabled={isLoading} className={buttonClass} title="Edit and resend">
          <Pencil className={iconSize} />
        </button>
      )}
      {message.role === 'assistant' && isLast && (
        <button onClick={() => regenerateLastResponse()} disabled={isLoading} className={buttonClass} title="Regenerate">
          <RotateCcw className={iconSize} />
        </button>
      )}
      {!isError && (
        <button onClick={() => deleteMessage(message.id)} disabled={isLoading} className={buttonClass} title="Delete">
          <Trash2 className={iconSize} />
        </button>
      )}
      <button
        onClick={() => toggleBookmark(message.id, quickBookmarkColor)}
        className={buttonClass}
        style={isBookmarked ? { color: quickBookmarkColor } : undefined}
        title={isBookmarked ? 'Remove bookmark' : 'Bookmark this message'}
      >
        <Star className={cn(iconSize, isBookmarked && 'fill-current')} />
      </button>
      <span className={cn('text-muted-foreground', isCompact ? 'text-[10px]' : 'text-xs')}>
        {new Date(message.timestamp).toLocaleTimeString()}
      </span>
    </div>
  )

  if (isError) {
    return (
      <div className={cn('group flex gap-2 py-2', isCompact ? 'px-3' : 'px-4')}>
        <div className={cn(
          'flex max-w-[85%] items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive',
          isCompact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm'
        )}>
          <AlertCircle className={cn('mt-0.5 shrink-0', isCompact ? 'h-3 w-3' : 'h-4 w-4')} />
          <div className="space-y-1">
            <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
              {cleanContent}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'group flex flex-col gap-1 py-2',
      isCompact ? 'px-3' : 'px-4',
      isUser ? 'items-end' : 'items-start'
    )}>
      {isUser && isEditing ? (
        <div className="w-full max-w-[85%] space-y-2">
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            autoFocus
            rows={Math.min(8, Math.max(2, editValue.split('\n').length))}
            className="w-full resize-none rounded-lg border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSaveEdit()
              } else if (e.key === 'Escape') {
                setIsEditing(false)
              }
            }}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
            >
              <X className="h-3 w-3" /> Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground hover:opacity-90"
            >
              Save &amp; submit
            </button>
          </div>
        </div>
      ) : isUser ? (
        <div className={cn(
          'max-w-[75%] rounded-2xl bg-primary text-primary-foreground',
          isCompact ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'
        )}>
          <ReactMarkdown components={components} remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
            {cleanContent}
          </ReactMarkdown>
        </div>
      ) : (
        <div className={cn('w-full max-w-[85%] space-y-2', isCompact && 'text-sm')}>
          {thinking && (
            <div>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className={cn(
                  'transition-transform',
                  isExpanded && 'rotate-90',
                  isCompact ? 'h-3 w-3' : 'h-4 w-4'
                )} />
                <span className={cn(isCompact && 'text-xs')}>Thinking Process</span>
              </button>
              {isExpanded && (
                <div className={cn(
                  'mt-2 pl-4 border-l-2 border-muted-foreground/20 text-muted-foreground',
                  isCompact ? 'text-xs' : 'text-sm'
                )}>
                  <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
                    {thinking}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          )}
          <ReactMarkdown components={components} remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
            {cleanContent}
          </ReactMarkdown>
        </div>
      )}
      {!isEditing && footer}
    </div>
  )
}
