import { useState } from 'react'

function Tooltip({ content, children }: { content: string; children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative inline-flex items-center">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute left-6 top-1/2 -translate-y-1/2 z-50 w-48 p-2 bg-popover text-popover-foreground text-xs rounded-md shadow-md border border-border whitespace-normal break-words leading-relaxed">
          {content}
        </div>
      )}
    </div>
  )
}
// ... existing code ...
