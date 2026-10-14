'use client'

import { forwardRef } from 'react'
import { Loader2, Send, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export interface ComposerProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  isLoading: boolean
  placeholder?: string
  showUpload?: boolean
  onToggleUpload?: () => void
  showSendLabel?: boolean
  size?: 'default' | 'compact'
  className?: string
}

/**
 * Shared composer used by the full chat view, compact mode, and the popout
 * window — previously three separate hand-duplicated input implementations.
 */
export const Composer = forwardRef<HTMLTextAreaElement, ComposerProps>(function Composer(
  {
    value,
    onChange,
    onSubmit,
    isLoading,
    placeholder = 'Type your message...',
    showUpload = false,
    onToggleUpload,
    showSendLabel = false,
    size = 'default',
    className,
  },
  ref
) {
  const isCompact = size === 'compact'
  const height = isCompact ? 'h-9' : 'h-[50px]'

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit(e)
    }
  }

  return (
    <form onSubmit={onSubmit} className={cn('flex items-start gap-2', className)}>
      {showUpload && (
        <button
          type="button"
          onClick={onToggleUpload}
          className={cn('flex items-center justify-center rounded-lg hover:bg-accent', height, isCompact ? 'w-9' : 'p-3')}
          title="Upload file"
        >
          <Upload className={isCompact ? 'h-4 w-4' : 'h-5 w-5'} />
        </button>
      )}

      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={1}
        disabled={isLoading}
        className={cn(
          'flex-1 resize-none rounded-lg border border-input bg-background px-3 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50',
          isCompact ? 'h-9 py-2 text-sm' : 'h-[50px] py-3'
        )}
        onKeyDown={handleKeyDown}
      />

      <Button
        type="submit"
        disabled={isLoading || !value.trim()}
        size={isCompact ? 'icon' : 'default'}
        className={height}
      >
        {isLoading ? (
          <Loader2 className={cn('animate-spin', isCompact ? 'h-4 w-4' : 'h-5 w-5')} />
        ) : showSendLabel ? (
          <>
            <Send className="h-5 w-5" />
            <span className="font-medium">Send</span>
          </>
        ) : (
          <Send className={isCompact ? 'h-4 w-4' : 'h-5 w-5'} />
        )}
      </Button>
    </form>
  )
})
