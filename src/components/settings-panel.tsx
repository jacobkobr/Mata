'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Modal, ModalContent, ModalHeader, ModalTitle } from '@/components/ui/modal'
import { GeneralTab } from '@/components/settings/general-tab'
import { KnowledgeTab } from '@/components/settings/knowledge-tab'
import { ChatGPTTab } from '@/components/settings/chatgpt-tab'
import { MessageRailTab } from '@/components/settings/message-rail-tab'
import { HardwareMonitor } from './hardware-monitor'

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'rail', label: 'Message Rail' },
  { id: 'knowledge', label: 'Knowledge' },
  { id: 'chatgpt', label: 'ChatGPT' },
  { id: 'hardware', label: 'Hardware' },
] as const

type TabId = typeof TABS[number]['id']

export function SettingsPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('general')

  return (
    <Modal open={isOpen} onOpenChange={setIsOpen}>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-md hover:bg-accent"
        aria-label="Open settings"
      >
        <Settings className="h-5 w-5" />
      </button>

      <ModalContent className="flex h-[600px] w-[800px] max-w-[90vw] flex-col p-0">
        <ModalHeader>
          <ModalTitle className="text-lg">Settings</ModalTitle>
        </ModalHeader>

        <div className="flex border-b border-border px-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'general' && <GeneralTab />}
          {activeTab === 'rail' && <MessageRailTab />}
          {activeTab === 'knowledge' && <KnowledgeTab />}
          {activeTab === 'chatgpt' && <ChatGPTTab />}
          {activeTab === 'hardware' && <HardwareMonitor />}
        </div>
      </ModalContent>
    </Modal>
  )
}
