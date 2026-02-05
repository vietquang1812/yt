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
  - shock should come from a surprising truth or realization (NOT violence)
  - make viewers feel they must stay until the end
- After the hook ends, include a natural call-to-action asking viewers to subscribe to support the channel.
- Keep it cinematic and emotionally vivid.

PART 2–6:
- Start with exactly ONE sentence that smoothly connects from the previous part (a transitional sentence).
- Continue the story with emotional continuity.
- Do NOT repeat ideas or scenes from earlier parts.
- No emojis, no lists, no headings.

SERIES MODE:

Series Bible (JSON):
{{series_bible_json}}

Series Memory (JSON):
{{series_memory_json}}

Continuity Mode: {{continuity_mode}}

Continuity rules:
- Always stay within the series theme and voice.
- If continuity_mode is "light": add ONE subtle callback to a previous video (one sentence max).
- If continuity_mode is "occasionally_strong": add ONE stronger callback OR resolve an open loop occasionally, but do not force it.
- If continuity_mode is "none": no callbacks, no open loops.

---
## FUTURE CONTENT CONTINUITY (NEXT IDEAS)

After completing the current video script, generate **EXACTLY 3 follow-up video ideas** that extend the channel’s long-term narrative.

Your PRIMARY goal is to strengthen **existing series continuity** whenever it makes sense.
Only propose a new series when there is a clear strategic reason.

---

### How to choose between EXISTING vs NEW series

1) First, inspect `series_bible_json` and `series_memory_json`.

2) If an existing series:
- shares the same core theme, belief system, or emotional promise
- and still has room to deepen or escalate

→ You SHOULD reuse that series (`mode: "existing"`).

3) Propose a NEW series (`mode: "new"`) ONLY IF:
- the next idea explores a distinctly different psychological dimension
- or it reframes the topic through a new long-term lens
- or continuing the existing series would feel repetitive or diluted

4) If you create a new series:
- the name must be broad, reusable, and long-term (not a one-off topic)
- it should still feel compatible with the channel identity

5) If no strong existing series is clearly defined in series_bible_json,
assume the CURRENT VIDEO implicitly defines a working series identity.

In that case:
- Prefer reusing ONE inferred series across the 3 ideas
- Treat this as an emerging series rather than creating a brand-new one

Creating a new series is a strategic decision, not a naming exercise.
If a new series is created, justify it implicitly by making the ideas feel impossible
to fully explore within the existing series frame.

---

### Strategic intent
- Build viewer trust through recognizable thematic continuity
- Make the channel feel intentional, not random
- Encourage binge-watching within a series

---

### Rules for next ideas
- Assume the viewer has watched the current video.
- Do NOT repeat the same topic wording or framing.
- Escalate depth or perspective across the 3 ideas.
- Prefer **progression within a series** over constant novelty.
- Keep tone calm, reflective, grounded — never hype-driven or clickbait.

---

### Continuity guidance
- Use `series_bible_json` to preserve:
  - core beliefs
  - tone
  - recurring motifs
- Use `series_memory_json` to:
  - continue an open loop
  - echo a motif
  - resolve or deepen a previously introduced tension

Respect `continuity_mode`:
- "light": subtle thematic connection
- "occasionally_strong": clearer callbacks or conceptual continuation
- "none": thematic similarity only, no callbacks

Because these are follow-up videos, continuity MUST NOT be "none" for all ideas.

At least:
- 2 of the 3 ideas should use "light" or "occasionally_strong" continuity
---

### Output requirements

Add a top-level JSON field named **`next_ideas`** containing **exactly 3 objects**.

Each object MUST include:

- `topic`: concise YouTube-style title
- `pillar`: the psychological angle or mental model
- `series`:
  - `mode`: "existing" or "new"
  - `name`: 
      - if existing → MUST match an existing series name
      - if new → MUST be a reusable, long-term series concept
- `continuity`: one of "none", "light", "occasionally_strong"
- `duration_minutes`: integer between 5 and 8
- `tone`: short phrase consistent with the channel’s emotional voice

---

### Quality bar (VERY IMPORTANT)

Across the 3 ideas:
- At least **2 ideas SHOULD belong to the same existing series**, if a relevant one exists.
- Ideas should feel like:
  - continuation → deepening → reframing
- The viewer should feel:  
  “This channel knows exactly where it’s going.”

If no strong existing series is clearly defined in series_bible_json,
assume the CURRENT VIDEO implicitly defines a working series identity.

In that case:
- Prefer reusing ONE inferred series across the 3 ideas
- Treat this as an emerging series rather than creating a brand-new one

The 3 ideas should form a clear progression:
- Idea 1: practical or behavioral extension
- Idea 2: deeper psychological or emotional layer
- Idea 3: identity-level or philosophical reflection


---

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

FINAL CHECK (before you output JSON):
- total_word_count is between 3000 and 5000 (inclusive).
- parts length is between 4 and 6.
- Each part.content is continuous narrative text (no headings, no bullets, no emojis).
- Part 1 includes the channel greeting and a subscribe call-to-action AFTER the hook.
- Parts 2–6 begin with exactly one transitional sentence.
- No repetition between parts.
- next_ideas contains exactly 3 high-quality, connected ideas.
- Output must be strictly valid JSON, nothing else.
