'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { useBookmarkStore } from '@/store/bookmark-store'
import { useRailUIStore } from '@/store/rail-ui-store'
import { useChatStore } from '@/store/chat-store'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ExportFormat = 'markdown' | 'json'

function buildMarkdown(entries: { content: string; role: string; createdAt: number }[]) {
  return entries
    .map((entry) => `### ${entry.role === 'user' ? 'You' : 'Assistant'} · bookmarked ${new Date(entry.createdAt).toLocaleString()}\n\n${entry.content}`)
    .join('\n\n---\n\n')
}

function download(filename: string, contents: string, mimeType: string) {
  const blob = new Blob([contents], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function BookmarkExportDialog() {
  const isOpen = useRailUIStore((state) => state.exportDialogOpen)
  const close = useRailUIStore((state) => state.closeExportDialog)
  const bookmarks = useBookmarkStore((state) => state.bookmarks)
  const messages = useChatStore((state) => state.messages)
  const [format, setFormat] = useState<ExportFormat>('markdown')

  const entries = messages
    .filter((m) => bookmarks[m.id])
    .map((m) => ({ content: m.content, role: m.role, createdAt: bookmarks[m.id].createdAt }))
    .sort((a, b) => a.createdAt - b.createdAt)

  const handleExport = () => {
    if (format === 'markdown') {
      download('mata-bookmarks.md', buildMarkdown(entries), 'text/markdown')
    } else {
      download('mata-bookmarks.json', JSON.stringify(entries, null, 2), 'application/json')
    }
    close()
  }

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && close()}>
      <ModalContent className="w-[420px] max-w-[90vw] p-0">
        <ModalHeader>
          <ModalTitle>Export bookmarks</ModalTitle>
        </ModalHeader>

        <div className="space-y-4 px-6 py-4">
          <p className="text-sm text-muted-foreground">
            {entries.length === 0
              ? 'No bookmarked messages in this chat yet.'
              : `${entries.length} bookmarked message${entries.length === 1 ? '' : 's'} ready to export.`}
          </p>

          <div className="flex gap-2">
            {(['markdown', 'json'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setFormat(option)}
                className={cn(
                  'flex-1 rounded-md border px-3 py-2 text-xs font-medium capitalize transition-colors',
                  format === option
                    ? 'border-primary text-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={close}>Cancel</Button>
          <Button onClick={handleExport} disabled={entries.length === 0}>
            <Download className="h-4 w-4" />
            Download
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
