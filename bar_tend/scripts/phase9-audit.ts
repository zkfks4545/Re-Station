import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

type SourceInfo = { file: string; line: number | string; text: string }
type Violation = SourceInfo & { pattern: string; severity: 'HIGH' | 'MEDIUM' | 'LOW' }
type MissingPreferred = SourceInfo & { missing: string[] }

const ROOT = path.resolve(__dirname, '..')

// ── Forbidden patterns ──────────────────────────────────────────────────
interface ForbiddenPattern {
  id: string
  regex: RegExp
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
}

const FORBIDDEN_PATTERNS: ForbiddenPattern[] = [
  { id: 'direct-comfort', regex: /힘드셨겠어요/, severity: 'HIGH' },
  { id: 'direct-encouragement', regex: /힘내세요/, severity: 'HIGH' },
  { id: 'blanket-reassurance', regex: /(?:^|[.!?…]\s+)괜찮아요(?!.*?면)/, severity: 'MEDIUM' },
  { id: 'fixed-hope', regex: /괜찮아질\s*거예요|좋은\s*결과가\s*있을\s*거예요/, severity: 'HIGH' },
  { id: 'helper-promise', regex: /제가\s*도와드릴게요/, severity: 'HIGH' },
  { id: 'counselor-prompt', regex: /천천히\s*말씀해\s*주세요/, severity: 'MEDIUM' },
  { id: 'solution-promise', regex: /해결해\s*드릴게요/, severity: 'HIGH' },
  { id: 'self-appointed-solver', regex: /제가\s*해결해/, severity: 'HIGH' },
  { id: 'emotional-recovery-promise', regex: /(?:마음이\s*나아질|기분이\s*좋아질)/, severity: 'HIGH' },
  { id: 'alcohol-as-solution', regex: /술\s*마시면\s*괜찮아|한\s*잔\s*하면\s*괜찮/, severity: 'HIGH' },
]

// ── Preferred patterns ──────────────────────────────────────────────────
const PREFERRED_PATTERNS: { id: string; regex: RegExp }[] = [
  { id: 'observation', regex: /보이|표정|오늘|지금|켜졌|들어왔|남았|기울었/ },
  { id: 'light-humor', regex: /네요|인가요|거죠|다니까요|지만요|이고요/ },
  { id: 'recommendation-tone', regex: /한\s*잔|잔을|칵테일|추천|고르|골라|가죠|드릴까요/ },
  { id: 'semi-formal', regex: /(?:요|죠|네요|까요)[.!?…]?$/m },
]

// ── Character design manual flags ───────────────────────────────────────
const DESIGN_FLAG_PATTERNS: { id: string; regex: RegExp }[] = [
  { id: 'overly-emotional', regex: /너무\s*힘들|많이\s*속상|많이\s*슬프|많이\s*아프/ },
  { id: 'direct-comfort-words', regex: /위로가\s*필요|토닥|다독/ },
  { id: 'alcohol-solution', regex: /술로\s*해결|술\s*마시.*잊|취해서\s*잊|술에\s*기대/ },
  { id: 'explaining-joke', regex: /농담.*뜻|이유는|말장난|이해를\s*위해|설명하자면/ },
  { id: 'overly-philosophical', regex: /인생이란|세상은|사랑은\s*항상|인생의\s*진리|우주의/ },
]

// ── Helpers ─────────────────────────────────────────────────────────────
function stripPlaceholders(text: string): string {
  return text.replace(/\$\{[^}]+\}/g, '').replace(/\{[^}]+\}/g, '').trim()
}

function countSentences(text: string): number {
  const clean = stripPlaceholders(text)
  if (!clean) return 0
  // Normalize ... and … to a single marker, then split by sentence endings
  const normalized = clean.replace(/\.{2,}/g, '…').replace(/…+/g, '…')
  const matches = normalized.match(/[^.!?…]*[.!?…]/g)
  return matches ? matches.length : 1
}

function checkForbidden(text: string): Violation[] {
  const violations: Violation[] = []
  for (const p of FORBIDDEN_PATTERNS) {
    if (p.regex.test(text)) {
      violations.push({
        file: '',
        line: 0,
        text: text.slice(0, 80),
        pattern: p.id,
        severity: p.severity,
      } as Violation)
    }
  }
  return violations
}

function checkPreferred(text: string): string[] {
  const missingIds: string[] = []
  for (const p of PREFERRED_PATTERNS) {
    if (!p.regex.test(text)) {
      missingIds.push(p.id)
    }
  }
  return missingIds
}

function checkSentenceConstraints(text: string): { tooLong: boolean; tooManySentences: boolean; charCount: number; sentenceCount: number } {
  const cleanText = stripPlaceholders(text)
  const charCount = cleanText.length
  const sentenceCount = countSentences(text)
  return {
    tooLong: charCount > 220,
    tooManySentences: sentenceCount > 3,
    charCount,
    sentenceCount,
  }
}

function checkDesignFlags(text: string): { id: string; match: string }[] {
  const flags: { id: string; match: string }[] = []
  for (const p of DESIGN_FLAG_PATTERNS) {
    const m = text.match(p.regex)
    if (m) {
      flags.push({ id: p.id, match: m[0] })
    }
  }
  return flags
}

// ── Extract strings from response-templates.ts ─────────────────────────
function extractResponseTemplatesStrings(filePath: string): SourceInfo[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const results: SourceInfo[] = []

  // Match fallback: '...' or fallback: "..."
  const fallbackRegex = /fallback:\s*(['"`])((?:\\\1|.)*?)\1/g
  let match: RegExpExecArray | null
  while ((match = fallbackRegex.exec(content)) !== null) {
    const lineNum = content.slice(0, match.index).split('\n').length
    results.push({ file: filePath, line: lineNum, text: match[2] })
  }

  // Match text: '...' or text: "..." or text: `...`
  const textRegex = /text:\s*(['"`])((?:\\\1|.)*?)\1/g
  while ((match = textRegex.exec(content)) !== null) {
    const lineNum = content.slice(0, match.index).split('\n').length
    const txt = match[2]
    if (txt.length > 5) results.push({ file: filePath, line: lineNum, text: txt })
  }

  return results
}

// ── Extract strings from text-presets.ts ────────────────────────────────
function extractTextPresetsStrings(filePath: string): SourceInfo[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const results: SourceInfo[] = []

  // Find each cardua/siesta preset by scanning lines
  const lines = content.split('\n')
  let currentSpeaker = ''
  let inBlock = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Detect speaker declaration
    const spMatch = line.match(/speaker:\s*'(karua|siesta)'/)
    if (spMatch) {
      currentSpeaker = spMatch[1]
      continue
    }

    // Detect start of blocks
    if (/blocks:\s*\{/.test(line)) {
      inBlock = true
      continue
    }

    // Detect end of block (closing brace of blocks at column level)
    if (inBlock && /^\s*\},?\s*$/.test(line) && currentSpeaker) {
      inBlock = false
      currentSpeaker = ''
      continue
    }

    // Extract strings from arrays within blocks
    if (inBlock && currentSpeaker) {
      const strMatch = line.match(/['"`]((?:[^'"`\\]|\\.)*?)['"`]/)
      if (strMatch) {
        const txt = strMatch[1]
        // Only Korean dialogue strings with sufficient length
        if (/[가-힣]/.test(txt) && txt.length > 5) {
          results.push({ file: `${filePath} (speaker: ${currentSpeaker})`, line: i + 1, text: txt })
        }
      }
    }
  }

  // Extract renderer return strings from TEXT_PRESETS constant
  const rendererRegex = /`((?:\\`|.)*?)`/g
  let match: RegExpExecArray | null
  while ((match = rendererRegex.exec(content)) !== null) {
    const txt = match[1]
    if (/[가-힣]/.test(txt) && txt.length > 8 && !txt.includes('hasFinalConsonant') && !txt.includes('withObjectParticle')) {
      const lineNum = content.slice(0, match.index).split('\n').length
      results.push({ file: filePath, line: lineNum, text: txt })
    }
  }

  return results
}

// ── Extract strings from conversation.ts ───────────────────────────────
function extractConversationStrings(filePath: string): SourceInfo[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const results: SourceInfo[] = []

  // Template literals with dialogue
  const templateRegex = /`((?:\\`|.)*?)`/g
  let match: RegExpExecArray | null
  while ((match = templateRegex.exec(content)) !== null) {
    const txt = match[1]
    if (/[가-힣]/.test(txt) && txt.length > 5) {
      const lineNum = content.slice(0, match.index).split('\n').length
      results.push({ file: filePath, line: lineNum, text: txt })
    }
  }

  // String literals
  const stringRegex = /(['"`])((?:\\\1|.)*?)\1/g
  while ((match = stringRegex.exec(content)) !== null) {
    const txt = match[2]
    if (/[가-힣]/.test(txt) && txt.length > 5 && !txt.includes('import') && !txt.includes('export')) {
      const lineNum = content.slice(0, match.index).split('\n').length
      results.push({ file: filePath, line: lineNum, text: txt })
    }
  }

  return results
}

// ── Main audit ──────────────────────────────────────────────────────────
function runAudit(): string {
  const report: string[] = []
  report.push('# Phase 9 — Karua Character Layer Audit Report')
  report.push('')
  report.push(`**Generated:** ${new Date().toISOString()}`)
  report.push('')
  report.push('---')
  report.push('')
  report.push('## 1. Forbidden Pattern Violations')
  report.push('')

  const dialoguesPath = path.join(ROOT, 'src', 'data', 'dialogues.json')
  const templatesPath = path.join(ROOT, 'src', 'lib', 'dialogue', 'response-templates.ts')
  const presetsPath = path.join(ROOT, 'src', 'lib', 'dialogue', 'text-presets.ts')
  const keywordsPath = path.join(ROOT, 'src', 'data', 'keyword-rules.json')
  const conversationPath = path.join(ROOT, 'src', 'lib', 'bartender', 'conversation.ts')

  // Parse dialogues.json
  const dialoguesData = JSON.parse(fs.readFileSync(dialoguesPath, 'utf-8'))
  const allDialogues: SourceInfo[] = []
  for (const [cat, catData] of Object.entries(dialoguesData.categories as Record<string, { lines: { text: string }[] }>)) {
    for (let i = 0; i < catData.lines.length; i++) {
      allDialogues.push({ file: `dialogues.json [${cat}]`, line: i + 1, text: catData.lines[i].text })
    }
  }

  // Parse keyword-rules.json
  const keywordRules: SourceInfo[] = []
  const kwData = JSON.parse(fs.readFileSync(keywordsPath, 'utf-8')) as { response: string; patterns: string[]; dialogueCategory?: string }[]
  for (let i = 0; i < kwData.length; i++) {
    keywordRules.push({ file: 'keyword-rules.json', line: i + 1, text: kwData[i].response })
  }

  // Parse TS files
  const templateStrings = extractResponseTemplatesStrings(templatesPath)
  const presetStringsRaw = extractTextPresetsStrings(presetsPath)
  const conversationStrings = extractConversationStrings(conversationPath)

  // Split presets into Karua and Siesta
  const presetStringsKarua = presetStringsRaw.filter(s => !s.file.includes('speaker: siesta'))
  const presetStringsSiesta = presetStringsRaw.filter(s => s.file.includes('speaker: siesta'))

  // ── Collect all sources ──────────────────────────────────────────────
  const allSources: { label: string; items: SourceInfo[] }[] = [
    { label: 'dialogues.json', items: allDialogues },
    { label: 'response-templates.ts', items: templateStrings },
    { label: 'text-presets.ts (Karua)', items: presetStringsKarua },
    { label: 'text-presets.ts (Siesta) — excluded from Karua audit', items: presetStringsSiesta },
    { label: 'keyword-rules.json', items: keywordRules },
    { label: 'conversation.ts', items: conversationStrings },
  ]

  let totalViolations = 0
  let highViolations = 0
  let totalMissingPreferred = 0
  let totalLengthIssues = 0
  let totalDesignFlags = 0

  const allViolations: (Violation & { sourceLabel: string })[] = []
  const allMissingPreferred: (MissingPreferred & { sourceLabel: string })[] = []
  const allLengthIssues: (SourceInfo & { charCount: number; sentenceCount: number } & { sourceLabel: string })[] = []
  const allDesignFlags: (SourceInfo & { flags: { id: string; match: string }[] } & { sourceLabel: string })[] = []

  for (const source of allSources) {
    const sourceViolations: (Violation & { sourceLabel: string })[] = []
    const sourceMissingPreferred: (MissingPreferred & { sourceLabel: string })[] = []
    const sourceLengthIssues: (SourceInfo & { charCount: number; sentenceCount: number } & { sourceLabel: string })[] = []
    const sourceDesignFlags: (SourceInfo & { flags: { id: string; match: string }[] } & { sourceLabel: string })[] = []

    for (const item of source.items) {
      const cleanText = stripPlaceholders(item.text)

      // Forbidden patterns check
      const fViolations = checkForbidden(cleanText)
      for (const v of fViolations) {
        const full: Violation & { sourceLabel: string } = { ...v, file: item.file, line: item.line, text: item.text, sourceLabel: source.label }
        sourceViolations.push(full)
      }

      // Preferred patterns check — flag only if ALL 4 patterns are missing
      const missing = checkPreferred(cleanText)
      if (missing.length === PREFERRED_PATTERNS.length) {
        sourceMissingPreferred.push({ file: item.file, line: item.line, text: item.text, missing, sourceLabel: source.label })
      }

      // Sentence constraints check
      const constraints = checkSentenceConstraints(item.text)
      if (constraints.tooLong || constraints.tooManySentences) {
        sourceLengthIssues.push({ file: item.file, line: item.line, text: item.text, charCount: constraints.charCount, sentenceCount: constraints.sentenceCount, sourceLabel: source.label })
      }

      // Design flags
      const flags = checkDesignFlags(cleanText)
      if (flags.length > 0) {
        sourceDesignFlags.push({ file: item.file, line: item.line, text: item.text, flags, sourceLabel: source.label })
      }
    }

    // Skip report sections for Siesta items (not Karua's character)
    const isSiesta = source.label.includes('Siesta')

    if (sourceViolations.length > 0 && !isSiesta) {
      report.push(`### ${source.label}`)
      report.push('')
      report.push('| Line | Text (truncated) | Pattern | Severity |')
      report.push('|------|------------------|---------|----------|')
      for (const v of sourceViolations) {
        const truncated = v.text.length > 60 ? v.text.slice(0, 60) + '…' : v.text
        report.push(`| ${v.line} | ${sanitizeMd(truncated)} | ${v.pattern} | ${v.severity} |`)
        if (v.severity === 'HIGH') highViolations++
      }
      report.push('')
    }

    if (sourceMissingPreferred.length > 0 && !isSiesta) {
      report.push(`### ${source.label} — Missing Preferred Patterns`)
      report.push('')
      report.push('| Line | Text (truncated) |')
      report.push('|------|------------------|')
      for (const m of sourceMissingPreferred) {
        const truncated = m.text.length > 60 ? m.text.slice(0, 60) + '…' : m.text
        report.push(`| ${m.line} | ${sanitizeMd(truncated)} |`)
      }
      report.push('')
    }

    if (sourceLengthIssues.length > 0 && !isSiesta) {
      report.push(`### ${source.label} — Sentence Length Issues`)
      report.push('')
      report.push('| Line | Text (truncated) | Chars | Sentences | Issue |')
      report.push('|------|------------------|-------|-----------|-------|')
      for (const l of sourceLengthIssues) {
        const truncated = l.text.length > 60 ? l.text.slice(0, 60) + '…' : l.text
        const issues: string[] = []
        if (l.charCount > 220) issues.push(`>220 chars (${l.charCount})`)
        if (l.sentenceCount > 3) issues.push(`>3 sentences (${l.sentenceCount})`)
        report.push(`| ${l.line} | ${sanitizeMd(truncated)} | ${l.charCount} | ${l.sentenceCount} | ${issues.join(', ')} |`)
      }
      report.push('')
    }

    if (sourceDesignFlags.length > 0 && !isSiesta) {
      report.push(`### ${source.label} — Character Design Issues`)
      report.push('')
      report.push('| Line | Text (truncated) | Flag |')
      report.push('|------|------------------|------|')
      for (const d of sourceDesignFlags) {
        const truncated = d.text.length > 60 ? d.text.slice(0, 60) + '…' : d.text
        for (const f of d.flags) {
          report.push(`| ${d.line} | ${sanitizeMd(truncated)} | ${f.id} ("${sanitizeMd(f.match)}") |`)
        }
      }
      report.push('')
    }

    totalViolations += sourceViolations.length
    totalMissingPreferred += sourceMissingPreferred.length
    totalLengthIssues += sourceLengthIssues.length
    totalDesignFlags += sourceDesignFlags.length
    allViolations.push(...sourceViolations)
    allMissingPreferred.push(...sourceMissingPreferred)
    allLengthIssues.push(...sourceLengthIssues)
    allDesignFlags.push(...sourceDesignFlags)
  }

  if (totalViolations === 0) {
    report.push('**No forbidden pattern violations found.** ✅')
    report.push('')
  }

  // ── Overall Summary ──────────────────────────────────────────────────
  report.push('---')
  report.push('')
  report.push('## 6. Overall Summary')
  report.push('')
  report.push(`| Metric | Count |`)
  report.push('|--------|-------|')
  report.push(`| Total strings checked | ${allDialogues.length + templateStrings.length + presetStringsRaw.length + keywordRules.length + conversationStrings.length} |`)
  report.push(`| Forbidden pattern violations | ${totalViolations} (HIGH: ${highViolations}) |`)
  report.push(`| Missing preferred patterns | ${totalMissingPreferred} |`)
  report.push(`| Sentence length issues | ${totalLengthIssues} |`)
  report.push(`| Design flag issues | ${totalDesignFlags} |`)
  report.push('')
  report.push('### Recommendations')
  report.push('')
  report.push('1. **HIGH severity violations** must be fixed before Phase 9 can be considered complete.')
  report.push('2. **Sentence length issues** should be reviewed for conciseness.')
  report.push('3. **Missing preferred patterns** indicate responses that lack Karua\'s characteristic voice.')
  report.push('4. **Design flag issues** need manual review for character consistency.')
  report.push('5. Template strings containing placeholders (`{}` or `${}`) will be resolved at runtime — verify final rendered output separately.')
  report.push('')

  return report.join('\n')
}

function sanitizeMd(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\n/g, '\\n')
}

// ── Run ────────────────────────────────────────────────────────────────
const report = runAudit()
const outputPath = path.join(ROOT, 'scripts', 'phase9-audit-report.md')
fs.writeFileSync(outputPath, report, 'utf-8')
console.log(report)
console.log(`\n\nReport written to: ${outputPath}`)
