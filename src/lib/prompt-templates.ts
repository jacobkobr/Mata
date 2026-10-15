export interface PromptTemplate {
  id: string
  /** Typed after "/" in the composer, e.g. "explain" for /explain. Lowercase, no spaces. */
  trigger: string
  description: string
  /** Template body with {{VARIABLE}} placeholders. */
  body: string
  createdAt: number
}

/** Auto-injected — the user never types these, they're filled in at expansion time. */
const DYNAMIC_VARIABLES: Record<string, () => string> = {
  CURRENT_DATE: () => new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
  CURRENT_TIME: () => new Date().toLocaleTimeString(),
  CURRENT_DATETIME: () => new Date().toLocaleString(),
}

const VARIABLE_PATTERN = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g

export function isDynamicVariable(name: string): boolean {
  return name in DYNAMIC_VARIABLES
}

/** All {{VAR}} names in a template, in first-appearance order, deduped. */
export function extractVariables(template: string): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  const pattern = new RegExp(VARIABLE_PATTERN)
  let match: RegExpExecArray | null
  while ((match = pattern.exec(template)) !== null) {
    const name = match[1]
    if (!seen.has(name)) {
      seen.add(name)
      result.push(name)
    }
  }
  return result
}

/** Variables the user actually has to supply — dynamic ones are filled in automatically. */
export function getUserVariables(template: string): string[] {
  return extractVariables(template).filter(v => !isDynamicVariable(v))
}

export function expandTemplate(template: string, values: Record<string, string>): string {
  return template.replace(VARIABLE_PATTERN, (full, name: string) => {
    if (isDynamicVariable(name)) return DYNAMIC_VARIABLES[name]()
    return values[name] ?? ''
  })
}

export function matchingTemplates(templates: PromptTemplate[], query: string): PromptTemplate[] {
  const q = query.toLowerCase()
  return templates
    .filter(t => t.trigger.toLowerCase().startsWith(q))
    .sort((a, b) => a.trigger.localeCompare(b.trigger))
}

/**
 * Parses "/trigger rest of text" from raw composer input and resolves it
 * against known templates. Returns null if the input isn't a recognized
 * slash command at all (so callers can fall through to sending it literally).
 */
export function parseSlashCommand(
  input: string,
  templates: PromptTemplate[]
): { template: PromptTemplate; rest: string; userVariables: string[] } | null {
  const match = input.match(/^\/([A-Za-z0-9_-]+)\s*([\s\S]*)$/)
  if (!match) return null
  const [, trigger, rest] = match
  const template = templates.find(t => t.trigger.toLowerCase() === trigger.toLowerCase())
  if (!template) return null
  return { template, rest: rest.trim(), userVariables: getUserVariables(template.body) }
}
