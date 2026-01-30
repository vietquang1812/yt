You are writing a long-form, faceless YouTube storytelling script for the channel: "Simple Mind Studio".

ABSOLUTE REQUIREMENTS (do not violate):
1) Language: English
2) Total length: 3000–5000 words
3) Structure:
   - Maximum 6 parts
   - Each part must be ONE continuous narrative (no subheadings, no bullet points, no numbered lists, no emojis)
   - Provide word_count for each part and ensure the sum is within 3000–5000
4) Voice & style:
   - First-person perspective ("I", "my", "I remember", "I didn’t realize…")
   - Emotionally grounded, reflective, human, intimate
   - Must feel like a real person with a unique viewpoint
   - NOT an informational compilation, NOT generic self-help content

SAFETY & COMPLIANCE (STRICT):
- Must comply with YouTube Community Guidelines.
- No hate, harassment, extremist praise, illegal instructions, explicit sexual content, or graphic violence.
- Do not encourage wrongdoing or illegal acts.
- Do not attack protected groups.
- Do not present advice that could violate US law or moral standards.
- No defamation; avoid naming private individuals.
- Avoid medical/legal instructions; keep it as personal storytelling and reflection.

PERSONA (YAML):
{{persona_yaml}}

STYLE RULES (YAML):
{{style_rules_yaml}}

TOPIC: {{topic}}
ANGLE: {{angle}}

PART RULES (VERY IMPORTANT):
PART 1 (HOOK + INTRO, STRICT):
- Write as ONE continuous piece (no section breaks).
- Include ONE short greeting that introduces the channel name exactly: "Simple Mind Studio".
- The opening must be a strong psychological hook:
  - mysterious, unsettling curiosity, emotionally intense
  - shock should come from a surprising truth/realization (NOT violence)
  - make viewers feel they must stay until the end
- After the hook ends, include a natural call-to-action asking viewers to subscribe to support the channel.
- Keep it cinematic and emotionally vivid.

PART 2–6:
- Start with exactly ONE sentence that smoothly connects from the previous part (a transitional sentence).
- Continue the story with emotional continuity.
- Do NOT repeat ideas or scenes from earlier parts.
- No emojis, no lists, no headings.

OUTPUT FORMAT:
Return ONLY valid JSON following this exact schema:

{
  "channel": "Simple Mind Studio",
  "language": "en",
  "format": "faceless_storytelling",
  "total_word_count": 0,
  "parts": [
    {
      "part": 1,
      "role": "hook_and_intro",
      "word_count": 0,
      "content": ""
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

FINAL CHECK (before you output JSON):
- total_word_count is between 3000 and 5000 (inclusive).
- parts length is 1–6.
- Each part.content is continuous narrative text (no headings, no bullets, no emojis).
- Part 1 includes the channel greeting and a subscribe call-to-action AFTER the hook.
- Parts 2–6 begin with one transitional sentence.
- No repetition between parts.
- Output must be strictly valid JSON, nothing else.
