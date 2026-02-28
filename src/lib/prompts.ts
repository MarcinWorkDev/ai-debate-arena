// Centralized system prompts for debate rounds

import type { DebateLanguage } from '../stores/debateStore'
import type { ModeratorSummaryData, EscalationData } from './roundTypes'

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
  moderatorSummary: ModeratorSummaryData | null,
  escalationData: EscalationData | null
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

    if (moderatorSummary.position_shifts && moderatorSummary.position_shifts.length > 0) {
      moderatorSummarySection += `
### Position shifts so far:
${format(moderatorSummary.position_shifts)}`
    }
  }

  let escalationSection = ''
  if (escalationData) {
    escalationSection = `

ESCALATION INSTRUCTION:
You have been selected to challenge a problematic assumption in this debate.

### Assumption to challenge:
${escalationData.assumption_to_challenge}

### Why this is problematic:
${escalationData.why_problematic}

### Your instruction:
${escalationData.instruction_to_participant}

You MUST follow this instruction. Attack the assumption directly. Do NOT compromise or soften your position.`
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
8. Argue from YOUR professional expertise and priorities.
   You may agree with a specific point if it genuinely aligns with your expertise,
   but you MUST add a condition, caveat, or requirement from your domain.
   Never agree unconditionally. Never flip your core position entirely.
   Example: "That threshold approach works, but only if we add X" — good.
   "I agree with everything" — bad.
9. If an argument appears in "Repeated arguments to avoid", do NOT use it again.
   Prefer arguments from "Missing angles to explore".
10. ${langInstruction}${moderatorSummarySection}${escalationSection}`
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
  "missing_or_underexplored_angles": [ "..." ],
  "position_shifts": [ "..." ]
}

Rules:
- Do NOT take sides.
- Do NOT add new arguments.
- Focus on what has already been said.
- If a category is empty, return an empty array.
- "position_shifts": Track any participant who changed, softened, or conditionally accepted an opposing argument. Format: "Role Name: shifted from X to Y because Z". If no shifts occurred, return an empty array.
${langInstruction}`
}

// ============================================
// ESCALATION PROMPT (provocative questions)
// ============================================
export function getEscalationSystemPrompt(language: DebateLanguage): string {
  const langInstruction = LANGUAGE_INSTRUCTIONS[language]

  return `# ROLE: Escalation Moderator (Control Plane)

You are an escalation moderator in a structured, multi-agent debate.

You do NOT participate in the debate.
Participants are NOT aware of your existence.
Your output is consumed programmatically and MUST be valid JSON.

Your role is to deliberately increase productive conflict
by breaking emerging consensus or comfortable framing.

---

## YOUR OBJECTIVE

Assume the debate is becoming:
- too polite,
- too aligned,
- too consensual,
- or stuck in safe, repeated narratives.

Your task is to identify what most participants are implicitly agreeing on
and force a direct challenge.

Your task is also to identify when participants are converging too easily
and force them to stress-test their emerging agreement with edge cases,
adversarial scenarios, or underrepresented stakeholder perspectives.

---

## WHAT YOU MUST DO

1. Identify ONE assumption, framing, or premise that:
   - most participants currently accept, or
   - is treated as obvious, reasonable, or inevitable.

2. Explain briefly why this assumption is problematic:
   - intellectually lazy,
   - misleading,
   - dangerous,
   - or structurally limiting the debate.

3. Select ONE participant (by exact role name)
   who is best positioned to challenge this assumption.

4. Create a forceful escalation instruction for that participant:
   - It MUST require rejection or attack.
   - NO compromise, balance, or moderation.
   - NO soft language.

---

## OUTPUT FORMAT (STRICT — JSON ONLY)

Return ONLY valid JSON.
Do NOT include markdown, commentary, or explanations.

The JSON MUST match this schema exactly:

{
  "escalation_target": "Role Name",
  "assumption_to_challenge": "One clear sentence.",
  "why_problematic": "1–2 sentences.",
  "instruction_to_participant": "A direct, forceful instruction telling the participant how to attack the assumption."
}

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
3. Track how positions evolved during the debate
4. Provide a balanced conclusion with actionable recommendations

CRITICAL: Format your summary using structured Markdown - DO NOT write plain text with just bold/italics. Use proper structure:

## Required Structure:

### Use Section Headings (## or ###)
Organize your summary with clear sections like:
- ## Key Arguments
- ## Points of Agreement
- ## Points of Disagreement
- ## How Positions Evolved
- ## Consensus Recommendations
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

## CRITICAL: Actionable Conclusion

Your conclusion MUST include a concrete "Consensus Recommendations" section with:
- Specific, numbered action items that emerged from the debate
- For each item, note which participants support it and any remaining caveats
- If no full consensus exists, clearly state what the majority position is and what the minority dissent is

The reader should walk away with a PRACTICAL CHECKLIST, not just a summary of who said what.

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

  if (summary.position_shifts && summary.position_shifts.length > 0) {
    content += isPl ? '### Zmiany pozycji:\n\n' : '### Position Shifts:\n\n'
    summary.position_shifts.forEach((item, idx) => {
      content += `${idx + 1}. ${item}\n`
    })
    content += '\n'
  }

  return content.trim()
}