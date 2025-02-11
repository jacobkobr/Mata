'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Settings, X, Save, Brain, Code2, Gauge, Cpu, AlertCircle, Info, Plus, Trash2, Zap, Lock } from 'lucide-react'
import { AI_MODELS } from '@/lib/config'
import { useSettingsStore } from '@/store/settings-store'
import { useChatStore } from '@/store/chat-store'
import { cn } from '@/lib/utils'
import { HardwareMonitor } from './hardware-monitor'

type ModelId = typeof AI_MODELS[number]['id']

interface TooltipProps {
  content: string
  children: React.ReactNode
}

function Tooltip({ content, children }: TooltipProps) {
  const [show, setShow] = useState(false)

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="inline-flex items-center"
      >
        {children}
      </div>
      {show && (
        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-lg shadow-lg border border-border whitespace-nowrap z-50 min-w-[200px]">
          {content}
        </div>
      )}
    </div>
  )
}

export function SettingsPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const { 
    temperature, 
    maxTokens, 
    shortcuts, 
    advancedSettings,
    updateSettings, 
    resetSettings 
  } = useSettingsStore()
  const { clearAllChats } = useChatStore()
  const [localSettings, setLocalSettings] = useState(advancedSettings)
  const [newKnowledge, setNewKnowledge] = useState('')
  const [newPromptModel, setNewPromptModel] = useState('')
  const [newPromptContent, setNewPromptContent] = useState('')

  // Auto-save whenever localSettings changes
  useEffect(() => {
    updateSettings({ 
      temperature,
      maxTokens,
      shortcuts,
      advancedSettings: localSettings 
    })
  }, [localSettings, temperature, maxTokens, shortcuts, updateSettings])

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
      clearAllChats()
    }
  }

  const addKnowledge = () => {
    if (!newKnowledge.trim()) return
    setLocalSettings(prev => ({
      ...prev,
      modelKnowledge: [
        ...prev.modelKnowledge,
        {
          id: Math.random().toString(36).substring(7),
          content: newKnowledge.trim(),
          enabled: true
        }
      ]
    }))
    setNewKnowledge('')
  }

  const removeKnowledge = (id: string) => {
    setLocalSettings(prev => ({
      ...prev,
      modelKnowledge: prev.modelKnowledge.filter(k => k.id !== id)
    }))
  }

  const toggleKnowledge = (id: string) => {
    setLocalSettings(prev => ({
      ...prev,
      modelKnowledge: prev.modelKnowledge.map(k =>
        k.id === id ? { ...k, enabled: !k.enabled } : k
      )
    }))
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-md hover:bg-accent"
        aria-label="Open settings"
      >
        <Settings className="h-5 w-5" />
      </button>

      {isOpen && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="w-[800px] h-[600px] bg-card shadow-lg rounded-lg border border-border flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold">Settings</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-md hover:bg-accent"
                aria-label="Close settings"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setActiveTab('general')}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                  activeTab === 'general'
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                General
              </button>
              <button
                onClick={() => setActiveTab('hardware')}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                  activeTab === 'hardware'
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                Hardware
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'general' ? (
                <div className="p-6 space-y-6">
                  {/* Basic Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Gauge className="h-5 w-5" />
                      <h3 className="text-lg font-medium">Basic Settings</h3>
                    </div>

                    {/* Temperature */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Temperature</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => updateSettings({ temperature: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                      <div className="text-sm text-muted-foreground">{temperature}</div>
                    </div>

                    {/* Max Tokens */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Max Tokens</label>
                      <input
                        type="number"
                        min="1"
                        max="4096"
                        value={maxTokens}
                        onChange={(e) => updateSettings({ maxTokens: parseInt(e.target.value) })}
                        className="w-full p-2 rounded-md border border-input bg-background"
                      />
                    </div>

                    {/* Context Window */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Context Window</label>
                      <input
                        type="number"
                        value={localSettings.contextWindow}
                        onChange={(e) => setLocalSettings(prev => ({
                          ...prev,
                          contextWindow: parseInt(e.target.value)
                        }))}
                        min={1024}
                        max={32768}
                        step={1024}
                        className="w-full p-2 rounded-md border border-input bg-background"
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum number of tokens to consider for context (1024-32768)
                      </p>
                    </div>

                    {/* Streaming and Debug */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={localSettings.streamingEnabled}
                          onChange={(e) => setLocalSettings(prev => ({
                            ...prev,
                            streamingEnabled: e.target.checked
                          }))}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">Streaming Responses</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={localSettings.debugMode}
                          onChange={(e) => setLocalSettings(prev => ({
                            ...prev,
                            debugMode: e.target.checked
                          }))}
                          className="h-4 w-4"
                        />
                        <label className="text-sm">Debug mode (show additional logging)</label>
                      </div>
                    </div>
                  </div>

                  {/* Keyboard Shortcuts */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Keyboard Shortcuts</label>
                    {Object.entries(shortcuts).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm">{key}</span>
                        <kbd className="px-2 py-1 text-xs bg-muted rounded">{value}</kbd>
                      </div>
                    ))}
                  </div>

                  {/* Context Management */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      <h3 className="text-lg font-medium">Context Management</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newKnowledge}
                          onChange={(e) => setNewKnowledge(e.target.value)}
                          placeholder="Add knowledge or context for the model..."
                          className="flex-1 p-2 text-sm rounded-md border border-input bg-background"
                        />
                        <button
                          onClick={addKnowledge}
                          className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {localSettings.modelKnowledge.map((knowledge) => (
                        <div
                          key={knowledge.id}
                          className="flex items-center gap-2 p-2 rounded-md border border-border"
                        >
                          <input
                            type="checkbox"
                            checked={knowledge.enabled}
                            onChange={() => toggleKnowledge(knowledge.id)}
                            className="h-4 w-4"
                          />
                          <span className="flex-1 text-sm">{knowledge.content}</span>
                          <button
                            onClick={() => removeKnowledge(knowledge.id)}
                            className="p-1 text-destructive hover:bg-destructive/10 rounded-md"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Performance Optimization */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      <h3 className="text-lg font-medium">Performance Optimization</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">GPU Acceleration</span>
                          <Tooltip content="Use GPU for faster model inference when available">
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </Tooltip>
                        </div>
                        <button
                          onClick={() => setLocalSettings(prev => ({
                            ...prev,
                            gpuAcceleration: !prev.gpuAcceleration
                          }))}
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium",
                            localSettings.gpuAcceleration
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-secondary-foreground"
                          )}
                        >
                          {localSettings.gpuAcceleration ? "Enabled" : "Disabled"}
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Memory Management</span>
                          <Tooltip content="Automatically optimize memory usage for long conversations">
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </Tooltip>
                        </div>
                        <button
                          onClick={() => setLocalSettings(prev => ({
                            ...prev,
                            memoryManagement: !prev.memoryManagement
                          }))}
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium",
                            localSettings.memoryManagement
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-secondary-foreground"
                          )}
                        >
                          {localSettings.memoryManagement ? "Enabled" : "Disabled"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Experimental Features */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-5 w-5" />
                      <h3 className="text-lg font-medium">Experimental Features</h3>
                    </div>
                    <div className="space-y-2 rounded-md border border-yellow-500/20 bg-yellow-500/10 p-4">
                      <div className="flex items-center gap-2 text-yellow-500">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">These features are experimental and may be unstable</span>
                      </div>
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">Parallel Inference</span>
                            <Tooltip content="Process responses faster by running multiple inference operations in parallel.">
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </Tooltip>
                          </div>
                          <button
                            onClick={() => setLocalSettings(prev => ({
                              ...prev,
                              experimentalFeatures: {
                                ...prev.experimentalFeatures,
                                parallelInference: !prev.experimentalFeatures.parallelInference
                              }
                            }))}
                            className={cn(
                              "px-3 py-1 rounded-full text-xs font-medium",
                              localSettings.experimentalFeatures.parallelInference
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground"
                            )}
                          >
                            {localSettings.experimentalFeatures.parallelInference ? "Enabled" : "Disabled"}
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">Enhanced Tokenization</span>
                            <Tooltip content="Use advanced NLP techniques for better text processing. May increase processing time.">
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </Tooltip>
                          </div>
                          <button
                            onClick={() => setLocalSettings(prev => ({
                              ...prev,
                              experimentalFeatures: {
                                ...prev.experimentalFeatures,
                                enhancedTokenization: !prev.experimentalFeatures.enhancedTokenization
                              }
                            }))}
                            className={cn(
                              "px-3 py-1 rounded-full text-xs font-medium",
                              localSettings.experimentalFeatures.enhancedTokenization
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground"
                            )}
                          >
                            {localSettings.experimentalFeatures.enhancedTokenization ? "Enabled" : "Disabled"}
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">Context Compression</span>
                            <Tooltip content="Intelligently compress conversation history to maintain longer chats.">
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </Tooltip>
                          </div>
                          <button
                            onClick={() => setLocalSettings(prev => ({
                              ...prev,
                              experimentalFeatures: {
                                ...prev.experimentalFeatures,
                                contextCompression: !prev.experimentalFeatures.contextCompression
                              }
                            }))}
                            className={cn(
                              "px-3 py-1 rounded-full text-xs font-medium",
                              localSettings.experimentalFeatures.contextCompression
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground"
                            )}
                          >
                            {localSettings.experimentalFeatures.contextCompression ? "Enabled" : "Disabled"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <button
                      onClick={handleClearHistory}
                      className="w-full px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:opacity-90"
                    >
                      Clear All Chat History
                    </button>

                    <button
                      onClick={resetSettings}
                      className="w-full px-4 py-2 bg-destructive/10 text-destructive rounded-md hover:opacity-90"
                    >
                      Reset to Defaults
                    </button>
                  </div>
                </div>
              ) : (
                <HardwareMonitor />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
} 