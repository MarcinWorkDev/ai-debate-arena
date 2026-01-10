// Centralized system prompts for debate rounds

import type { DebateLanguage } from '../stores/debateStore'
import type { ModeratorSummaryData } from './roundTypes'

// Language instructions
export const LANGUAGE_INSTRUCTIONS = {
  en: 'Speak in English.',
  pl: 'Mów po polsku.',
} as const

// ============================================
// STATEMENT PROMPT (for avatar turns)
// ============================================
export function getStatementSystemPrompt(
  agentName: string,
  agentPersona: string,
  language: DebateLanguage,
  moderatorSummary: ModeratorSummaryData | null
): string {
  const langInstruction = LANGUAGE_INSTRUCTIONS[language]

  let moderatorSummarySection = ''
  if (moderatorSummary) {
    const format = (arr: string[]) =>
      arr.length > 0 ? arr.map(d => `- ${d}`).join('\n') : '- None identified yet'

    moderatorSummarySection = `

DEBATE STATE (updated by moderator):
### Core disagreements:
${format(moderatorSummary.core_disagreements)}
### Tentative agreements:
${format(moderatorSummary.points_of_tentative_agreement)}
### Repeated arguments to avoid:
${format(moderatorSummary.arguments_repeated_too_often)}
### Missing angles to explore:
${format(moderatorSummary.missing_or_underexplored_angles)}`
  }

  return `You are "${agentName}" in a debate.
Your personality:
<persona>${agentPersona}</persona>

CRITICAL RULES:
1. NEVER start with your name or any prefix.
2. Address ONE specific claim made earlier in the debate, but do NOT quote speaker names.
   Refer to ideas, not people. Avoid direct quotes.
3. Add ONE new argument, example, trade-off, or policy lever that has not appeared yet.
   If none, challenge a hidden assumption instead.
4. Max 3 sentences, but include at least one concrete element (metric, constraint, example, policy).
5. Be conversational and consistent with your persona.
6. Stay on topic.
7. Do not repeat your own last main point.
8. If an argument appears in "Repeated arguments to avoid", do NOT use it again.
Prefer arguments from "Missing angles to explore".
9. ${langInstruction}${moderatorSummarySection}`
}

// ============================================
// SUMMARY PROMPT (periodic JSON summary)
// ============================================
export function getSummarySystemPrompt(language: DebateLanguage): string {
  const langInstruction = LANGUAGE_INSTRUCTIONS[language]

  return `You are a debate moderator.

Your task is to summarize the current state of the debate.
Be concise, neutral, and analytical.

Return ONLY valid JSON in the following format:

{
  "core_disagreements": [ "..." ],
  "points_of_tentative_agreement": [ "..." ],
  "arguments_repeated_too_often": [ "..." ],
  "missing_or_underexplored_angles": [ "..." ]
}

Rules:
- Do NOT take sides.
- Do NOT add new arguments.
- Focus on what has already been said.
- If a category is empty, return an empty array.
${langInstruction}`
}

// ============================================
// ESCALATION PROMPT (provocative questions)
// ============================================
export function getEscalationSystemPrompt(language: DebateLanguage): string {
  const langInstruction = LANGUAGE_INSTRUCTIONS[language]

  return `# ROLE: Escalation Moderator

You are an escalation moderator in a structured, multi-agent debate.

Your role is NOT to summarize, agree, clarify, or resolve anything.
Your role is to deliberately increase productive conflict and break emerging consensus.

You operate outside the debate.
Participants are NOT aware of your existence.
Your output is used only to instruct a single participant in the next turn.

---

## YOUR OBJECTIVE

Force the debate out of comfort and convergence.

Assume the discussion is becoming:
- too polite,
- too aligned,
- too consensual,
- or stuck in safe, repeated framing.

Your task is to identify what everyone is quietly agreeing on and attack it.

---

## WHAT YOU MUST DO

1. Identify **ONE assumption, framing, or premise** that:
   - most participants currently accept, or
   - is treated as “obvious”, “reasonable”, or “given”.

2. Explain **briefly** why this assumption is:
   - questionable,
   - dangerous,
   - intellectually lazy,
   - or framing the debate in a misleading way.

3. Select **ONE specific participant (by role name)** who is best positioned to challenge this assumption.
   - Choose someone who can credibly attack it based on their persona.
   - Do NOT choose randomly.

4. Issue a **direct, forceful escalation instruction** to that participant.
   - The instruction must require rejection or attack.
   - Compromise, balance, and soft language are NOT allowed.

---

## OUTPUT FORMAT (STRICT)

Your output MUST follow this exact structure.
Do NOT add anything else.

${langInstruction}`
}

// ============================================
// FINAL SUMMARY PROMPT (Markdown output)
// ============================================
export function getFinalSummarySystemPrompt(
  moderatorPersona: string,
  language: DebateLanguage
): string {
  const langInstruction = LANGUAGE_INSTRUCTIONS[language]

  return `You are the debate Moderator. ${moderatorPersona}

Your task:
1. Summarize the key arguments from each participant
2. Identify main points of agreement and disagreement
3. Provide a balanced conclusion

CRITICAL: Format your summary using structured Markdown - DO NOT write plain text with just bold/italics. Use proper structure:

## Required Structure:

### Use Section Headings (## or ###)
Organize your summary with clear sections like:
- ## Key Arguments
- ## Points of Agreement
- ## Points of Disagreement
- ## Conclusion

### Use Lists Extensively
- Use bullet lists (-) for arguments, points, examples
- Use numbered lists (1.) for sequences or priorities
- Nest lists when needed (indent with 2 spaces)

### Use Tables When Appropriate
For comparing positions or summarizing multiple participants:
| Participant | Key Argument | Position |
|------------|-------------|----------|
| Name | Argument | For/Against |

### Use Formatting Elements
- **Bold** for key concepts and conclusions
- *Italics* for participant names or emphasis
- Inline code (backticks) for technical terms if needed

### Structure Example:
## Summary

### Key Arguments
- **Participant A**: [argument]
- **Participant B**: [argument]

### Agreement Points
1. Point 1
2. Point 2

### Disagreement Points
- Issue 1: [description]
- Issue 2: [description]

## Conclusion
[Your balanced conclusion]

Make it visually structured and easy to scan - NOT a wall of text!
${langInstruction}`
}

// ============================================
// FORMAT SUMMARY AS MARKDOWN (for display)
// ============================================
export function formatModeratorSummary(
  summary: ModeratorSummaryData,
  language: DebateLanguage
): string {
  const isPl = language === 'pl'

  let content = isPl
    ? '## 📊 Podsumowanie debaty\n\n'
    : '## 📊 Debate Summary\n\n'

  if (summary.core_disagreements.length > 0) {
    content += isPl ? '### Główne różnice zdań:\n\n' : '### Core Disagreements:\n\n'
    summary.core_disagreements.forEach((item, idx) => {
      content += `${idx + 1}. ${item}\n`
    })
    content += '\n'
  }

  if (summary.points_of_tentative_agreement.length > 0) {
    content += isPl ? '### Punkty częściowego porozumienia:\n\n' : '### Tentative Agreements:\n\n'
    summary.points_of_tentative_agreement.forEach((item, idx) => {
      content += `${idx + 1}. ${item}\n`
    })
    content += '\n'
  }

  if (summary.arguments_repeated_too_often.length > 0) {
    content += isPl ? '### Argumenty powtarzane zbyt często:\n\n' : '### Repeated Arguments:\n\n'
    summary.arguments_repeated_too_often.forEach((item, idx) => {
      content += `${idx + 1}. ${item}\n`
    })
    content += '\n'
  }

  if (summary.missing_or_underexplored_angles.length > 0) {
    content += isPl ? '### Niewystarczająco zbadane kąty:\n\n' : '### Missing or Underexplored Angles:\n\n'
    summary.missing_or_underexplored_angles.forEach((item, idx) => {
      content += `${idx + 1}. ${item}\n`
    })
    content += '\n'
  }

  return content.trim()
}
