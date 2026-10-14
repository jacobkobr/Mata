'use client'

import { useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { ChatMessage } from '@/components/chat-message'
import type { Message } from '@/store/chat-store'
import { cn } from '@/lib/utils'

export interface MessageListProps {
  messages: Message[]
  isLoading: boolean
  isCompact?: boolean
  emptyState?: React.ReactNode
  className?: string
  onRegisterMessageRef?: (id: string, el: HTMLDivElement | null) => void
}

/**
 * Shared message list + auto-scroll used by the full chat view, compact
 * mode, and the popout window.
 */
export function MessageList({ messages, isLoading, isCompact, emptyState, className, onRegisterMessageRef }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  if (messages.length === 0 && emptyState) {
    return <>{emptyState}</>
  }

  return (
    <div className={cn('space-y-4', className)}>
      {messages.map((message) => (
        <div key={message.id} data-message-id={message.id} ref={(el) => onRegisterMessageRef?.(message.id, el)}>
          <ChatMessage message={message} isCompact={isCompact} />
        </div>
      ))}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className={cn('animate-spin text-muted-foreground', isCompact ? 'h-4 w-4' : 'h-6 w-6')} />
        </div>
      )}
      <div ref={endRef} />
    </div>
  )
}
