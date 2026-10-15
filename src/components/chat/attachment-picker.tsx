import { useState } from 'react'
import { Paperclip, AlertTriangle, FileText, Folder } from 'lucide-react'
import { useSettingsStore } from '@/store/settings-store'
import { toast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from '@/components/ui/modal'
import type { AttachmentPickResult } from '@/lib/types'

export interface AttachmentPickerProps {
  /** Called once the user has reviewed any warnings and confirmed attaching. */
  onAttach: (content: string, name: string, isDirectory: boolean) => void
  className?: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Attaches a file or folder as read-only context via Electron's native
 * dialog — reading happens entirely in the main process (electron/attachments.js),
 * the renderer only ever receives already-extracted text. Separate from the
 * existing drag-and-drop FileUpload: this one supports folders, flags
 * sensitive filenames, and warns before sending to ChatGPT rather than after.
 */
export function AttachmentPicker({ onAttach, className }: AttachmentPickerProps) {
  const [pending, setPending] = useState<AttachmentPickResult | null>(null)
  const activeProvider = useSettingsStore((state) => state.activeProvider)
  // Same honesty bar as image attachments in chat-store.ts: only Ollama is
  // guaranteed local, so 'auto' and 'chatgpt' both get the warning since
  // either can resolve to a cloud call.
  const goesToCloud = activeProvider !== 'ollama'

  const handlePick = async () => {
    if (!window.electron) {
      toast({ variant: 'destructive', title: 'Not available', description: 'File attachment requires the Mata desktop app.' })
      return
    }
    try {
      const result = await window.electron.attachments.pick()
      if (result.canceled) return
      if (result.error) {
        toast({ variant: 'destructive', title: 'Could not attach', description: result.error })
        return
      }
      const needsConfirmation = (result.sensitiveFiles?.length ?? 0) > 0 || result.truncated || goesToCloud
      if (needsConfirmation) {
        setPending(result)
      } else {
        onAttach(result.content ?? '', result.name ?? 'file', !!result.isDirectory)
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Could not attach',
        description: error instanceof Error ? error.message : 'Failed to read the selected file or folder.',
      })
    }
  }

  const handleConfirm = () => {
    if (!pending) return
    onAttach(pending.content ?? '', pending.name ?? 'file', !!pending.isDirectory)
    setPending(null)
  }

  return (
    <>
      <button
        type="button"
        onClick={handlePick}
        className={className}
        title="Attach file or folder as context"
      >
        <Paperclip className="h-5 w-5" />
      </button>

      <Modal open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
        <ModalContent className="max-w-md">
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2">
              {pending?.isDirectory ? <Folder className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
              {pending?.name}
            </ModalTitle>
          </ModalHeader>
          <div className="space-y-3 p-6 text-sm">
            <p className="text-muted-foreground">
              {pending?.isDirectory
                ? `${pending.fileCount} file${pending.fileCount === 1 ? '' : 's'}, ${formatBytes(pending.includedBytes ?? 0)}`
                : `${formatBytes(pending?.includedBytes ?? 0)}`}
              {' '}will be added as context to your next message.
            </p>

            {!!pending?.skippedBinaryCount && (
              <p className="text-xs text-muted-foreground">
                {pending.skippedBinaryCount} non-text file{pending.skippedBinaryCount === 1 ? '' : 's'} skipped (images, binaries, etc. aren&apos;t sent as context).
              </p>
            )}

            {pending?.truncated && (
              <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-2 text-warning">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {pending.isDirectory
                    ? 'Some files were skipped or cut off — this folder is larger than what gets sent as context.'
                    : 'This file is larger than what gets sent as context — only the beginning was included.'}
                </span>
              </div>
            )}

            {pending && pending.sensitiveFiles && pending.sensitiveFiles.length > 0 && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">This looks like it may contain secrets:</p>
                  <ul className="mt-1 list-disc pl-4">
                    {pending.sensitiveFiles.map((f) => <li key={f}>{f}</li>)}
                  </ul>
                </div>
              </div>
            )}

            {goesToCloud && (
              <div className="flex items-start gap-2 rounded-md border border-info/30 bg-info/10 p-2 text-info">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {activeProvider === 'chatgpt'
                    ? 'This content will be sent to ChatGPT, leaving your machine.'
                    : 'Auto mode may route this to ChatGPT, which would leave your machine.'}
                </span>
              </div>
            )}
          </div>
          <ModalFooter>
            <Button variant="outline" onClick={() => setPending(null)}>Cancel</Button>
            <Button onClick={handleConfirm}>Attach anyway</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
