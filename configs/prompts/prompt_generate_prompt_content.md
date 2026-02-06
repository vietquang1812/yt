You are generating a **CONTENT PROMPT PACK**, not the final script.

Your task is to design a structured set of **high-quality generation prompts** that will later be used to create a long-form, faceless YouTube storytelling script for the channel **"Simple Mind Studio"**.

IMPORTANT:
- Do NOT write the actual story content.
- Do NOT generate narrative text.
- You are ONLY creating prompts that will be used later to generate each part.
- All `content` fields must be an empty string.

---

## GLOBAL REQUIREMENTS (DO NOT VIOLATE)

1) Language: English  
2) Total parts: **4–8**
3) Target total length (when content is generated later): **3000–5000 words**
4) Each part (when generated later): **600–1200 words**
5) Style:
   - First-person perspective ("I", "my", "I remember…")
   - Emotionally grounded, reflective, intimate
   - Cinematic, human, personal
   - NOT informational, NOT generic self-help

---

## SAFETY & COMPLIANCE (STRICT)

- Must comply with YouTube Community Guidelines.
- No hate, harassment, extremism, illegal instructions, explicit sexual content, or graphic violence.
- No encouragement of wrongdoing.
- No attacks on protected groups.
- Avoid medical or legal advice.
- No defamation or naming private individuals.

---

## CONTEXT INPUTS

PERSONA (YAML):
{{persona_yaml}}

STYLE RULES (YAML):
{{style_rules_yaml}}

TOPIC:
{{topic}}

ANGLE:
{{angle}}

SERIES BIBLE (JSON):
{{series_bible_json}}

SERIES MEMORY (JSON):
{{series_memory_json}}

CONTINUITY MODE:
{{continuity_mode}}

---

## PART DESIGN RULES

You must design **one prompt per part**.

Each prompt must:
- Clearly define the emotional goal of the part
- Define narrative function (hook, escalation, reflection, resolution, etc.)
- Specify continuity requirements
- Include word range guidance (600–1200 words)
- Emphasize **clarity and completeness over exact word count**
- Avoid telling the model to “hit an exact word number”

### IMPORTANT
- Do NOT ask the model to count words exactly.
- Do NOT include lists, headings, emojis, or formatting instructions for the final content.
- Each part must be ONE continuous narrative when generated later.

---

## SPECIAL RULES BY PART

### PART 1 – HOOK + INTRO (STRICT)

The prompt for Part 1 MUST instruct the future model to:
- Open with a strong psychological hook (mysterious, emotionally unsettling, curiosity-driven)
- Shock through insight or realization (NOT violence)
- Include exactly ONE short greeting introducing the channel name **"Simple Mind Studio"**
- Include a natural subscribe call-to-action AFTER the hook
- Maintain cinematic, emotionally vivid language

---

### PARTS 2–6 (IF PRESENT)

Each prompt MUST instruct the future model to:
- Begin with exactly ONE transitional sentence connecting from the previous part
- Continue the emotional and narrative arc without repetition
- Deepen or evolve the story (not re-explain)

---

## SERIES CONTINUITY RULES

Based on `continuity_mode`:

- "light": instruct one subtle callback to a previous video (max one sentence)
- "occasionally_strong": allow one stronger callback OR resolution of an open loop
- "none": no callbacks

Continuity must feel natural and not forced.

---

## FUTURE CONTENT (NEXT IDEAS)

After designing all part prompts, design **EXACTLY 3 follow-up video ideas**.

Rules:
- Assume the viewer has watched the current video
- Do NOT repeat the same topic framing
- Escalate depth across the 3 ideas
- Prefer continuation within an existing series when possible
- At least 2 ideas must use "light" or "occasionally_strong" continuity
- Tone: calm, reflective, grounded (never hype-driven)

---

## OUTPUT FORMAT (STRICT JSON ONLY)

Return ONLY valid JSON in the following schema:

{
  "channel": "Simple Mind Studio",
  "language": "en",
  "format": "faceless_storytelling",
  "total_word_count": 0,
  "parts": [
    {
      "part": 1,
      "role": "hook_and_intro",
      "target_words": "600–1200",
      "generation_prompt": "",
      "content": ""
    }
  ],
  "next_ideas": [
    {
      "topic": "",
      "pillar": "",
      "series": {
        "mode": "existing",
        "name": ""
      },
      "continuity": "light",
      "duration_minutes": 6,
      "tone": ""
    }
  ],
  "compliance": {
    "youtube_safe": true,
    "us_law_safe": true,
    "no_hate": true,
    "no_illegal_instructions": true,
    "no_graphic_violence": true,
    "no_explicit_sexual_content": true,
    "no_repetition": true
  }
}

---

## FINAL CHECK (MANDATORY)

Before outputting JSON:
- Ensure 4–8 parts are created
- Each part has a **clear, high-quality generation_prompt**
- All `content` fields are empty strings
- No narrative text is generated
- next_ideas contains exactly 3 coherent, connected ideas
- Output is strictly valid JSON
