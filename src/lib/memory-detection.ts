/**
 * Regex-first detector for "remember that ..." style phrasing, so a fact the
 * user states in passing gets captured into cross-conversation memory
 * without needing real tool-calling support (the Provider interface has no
 * function-calling today — see chat-store.ts generateReply). This only
 * fires on a clear, explicit ask to remember something; it never tries to
 * infer facts from ordinary conversation.
 */
const REMEMBER_PATTERNS = [
  /^(?:please\s+)?remember(?:\s+that)?\s*[:,]?\s*(.+)/i,
  /^(?:please\s+)?don'?t forget(?:\s+that)?\s*[:,]?\s*(.+)/i,
  /^(?:for future reference|from now on|going forward)\s*[:,]?\s*(.+)/i,
]

export function detectMemoryRequest(content: string): string | null {
  const trimmed = content.trim()
  for (const pattern of REMEMBER_PATTERNS) {
    const match = trimmed.match(pattern)
    if (match && match[1] && match[1].trim().length >= 3) {
      return match[1].trim().replace(/[.!]+$/, '')
    }
  }
  return null
}
