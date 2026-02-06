You are generating the **FINAL NARRATIVE CONTENT** for ONE specific part of a long-form, faceless YouTube storytelling video for the channel **"Simple Mind Studio"**.

This is a **content execution task**, not a planning task.

---

## ABSOLUTE RULES (DO NOT VIOLATE)

1) Language: English
2) Perspective: First-person ("I", "my", "I remember…")
3) Output must be:
   - ONE continuous narrative
   - No headings
   - No bullet points
   - No numbered lists
   - No emojis
4) Tone:
   - Emotionally grounded
   - Reflective
   - Human
   - Intimate
   - Cinematic but restrained
5) This is NOT:
   - informational content
   - generic self-help
   - motivational speech
   - advice or instruction

---

## SAFETY & COMPLIANCE (STRICT)

- Comply with YouTube Community Guidelines.
- No hate, harassment, extremism, or encouragement of wrongdoing.
- No explicit sexual content or graphic violence.
- Avoid medical or legal advice.
- Do not name or imply real private individuals.
- Keep everything within personal storytelling and reflection.

---

## CONTEXT (IMMUTABLE)

PERSONA (YAML):
{{persona_yaml}}

STYLE RULES (YAML):
{{style_rules_yaml}}

SERIES BIBLE (JSON):
{{series_bible_json}}

SERIES MEMORY (JSON):
{{series_memory_json}}

CONTINUITY MODE:
{{continuity_mode}}

---

## PART-SPECIFIC INPUT (CRITICAL)

You are writing **ONLY this part**:

PART NUMBER:
{{part_number}}

PART ROLE:
{{part_role}}

TARGET LENGTH:
{{target_words}} words (soft target, do NOT try to hit exactly)

GENERATION PROMPT (FOLLOW THIS CLOSELY):
{{generation_prompt}}

---

## EXECUTION GUIDELINES (VERY IMPORTANT)

- Follow the **generation_prompt** precisely for:
  - emotional goal
  - narrative purpose
  - continuity requirements
- Focus on **completeness and emotional clarity**, not word counting.
- If you feel the story for this part is complete before reaching the upper word range, stop naturally.
- Do NOT reference future parts.
- Do NOT repeat scenes, realizations, or metaphors already implied in earlier parts.
- Do NOT summarize or conclude the entire story unless explicitly instructed in the generation_prompt.

---

## TRANSITION RULE (CONDITIONAL)

If the generation_prompt specifies that this part must:
- start with a transitional sentence from the previous part

Then:
- Write EXACTLY ONE opening sentence that smoothly continues the emotional flow.
- After that sentence, continue normally.

If no transition is specified, do NOT force one.

---

## OUTPUT FORMAT (STRICT)

Return ONLY valid JSON in this exact format:

{
  "part": {{part_number}},
  "role": "",
  "word_count": 0,
  "content": ""
}

---

## FINAL CHECK (MANDATORY BEFORE OUTPUT)

- Content is first-person, emotionally grounded, and human.
- Narrative is continuous (no formatting).
- No repetition of earlier parts.
- Word count is within a reasonable range of the target (±20%).
- `word_count` reflects the actual number of words in `content`.
- If unsure, slightly under-report rather than over-report.
