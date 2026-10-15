import { Loader2, Send, Square, AlertCircle } from 'lucide-react'
import { Modal, ModalContent, ModalHeader, ModalTitle } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { useCompareStore, type ComparisonSlot } from '@/store/compare-store'
import { CompareModelPicker } from './compare-model-picker'
import { cn } from '@/lib/utils'

function SlotColumn({ slot, which }: { slot: ComparisonSlot; which: 'A' | 'B' }) {
  const setSlot = useCompareStore((state) => state.setSlot)

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border">
      <div className="flex shrink-0 items-center justify-between border-b border-border p-2">
        <CompareModelPicker
          providerId={slot.providerId}
          modelId={slot.modelId}
          label={slot.label}
          onSelect={(providerId, modelId, label) => setSlot(which, providerId, modelId, label)}
        />
        {slot.isLoading && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3 text-sm whitespace-pre-wrap">
        {slot.error ? (
          <div className="flex items-start gap-2 text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{slot.error}</span>
          </div>
        ) : slot.content ? (
          slot.content
        ) : (
          <span className="text-muted-foreground">
            {slot.isLoading ? 'Waiting for a response...' : 'Response will appear here.'}
          </span>
        )}
      </div>
    </div>
  )
}

export function CompareModal() {
  const { isOpen, close, prompt, setPrompt, slotA, slotB, run, stop } = useCompareStore()
  const isLoading = slotA.isLoading || slotB.isLoading
  const canRun = !!slotA.modelId && !!slotB.modelId && !!prompt.trim() && !isLoading

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (canRun) run()
  }

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && close()}>
      <ModalContent className="flex h-[640px] w-[920px] max-w-[95vw] flex-col p-0">
        <ModalHeader>
          <ModalTitle>Compare models</ModalTitle>
        </ModalHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
          <div className="flex min-h-0 flex-1 gap-3">
            <SlotColumn slot={slotA} which="A" />
            <SlotColumn slot={slotB} which="B" />
          </div>

          <form onSubmit={handleSubmit} className="flex shrink-0 items-start gap-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={!slotA.modelId || !slotB.modelId ? 'Pick a model on both sides first...' : 'Ask both models the same thing...'}
              rows={1}
              className="h-[46px] flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (canRun) run()
                }
              }}
            />
            {isLoading ? (
              <Button type="button" variant="secondary" onClick={stop} className={cn('h-[46px]')}>
                <Square className="h-4 w-4 fill-current" /> Stop
              </Button>
            ) : (
              <Button type="submit" disabled={!canRun} className="h-[46px]">
                <Send className="h-4 w-4" /> Ask both
              </Button>
            )}
          </form>
        </div>
      </ModalContent>
    </Modal>
  )
}
