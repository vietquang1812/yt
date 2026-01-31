You are revising a faceless, first-person storytelling YouTube script for the channel "Simple Mind Studio".

INPUTS:
- Topic: {{topic}}
- Angle: {{angle}}

Original script (full):
{{script_text}}

QA report JSON (issues + suggested fixes):
{{qa_report_json}}

GOALS (STRICT):
1) Keep the story topic and emotional intent, but fix ALL issues from the QA report.
2) Must comply with YouTube Community Guidelines and US law.
3) Language: English
4) Total length: 3000–5000 words
5) Maximum 6 parts
6) Each part must be ONE continuous narrative (no headings, no bullet points, no numbered lists, no emojis)
7) Part 1 must include:
   - A strong psychological hook (shock via realization, not violence)
   - One short greeting introducing the channel name exactly: "Simple Mind Studio"
   - After the hook ends, a natural call-to-action to subscribe
8) Parts 2–6 must start with exactly ONE transitional sentence connecting from the previous part.
9) No repetition between parts.

OUTPUT:
Return ONLY valid JSON in this exact schema:

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

FINAL CHECK:
- Fix every QA issue. If conflict exists, prioritize safety compliance.
- total_word_count is 3000–5000.
- parts length is 1–6.
- Part 1 contains greeting + subscribe CTA after hook.
- Parts 2–6 begin with one transitional sentence.
- Output strictly valid JSON, nothing else.

SERIES BIBLE:
{{series_bible_json}}

SERIES MEMORY:
{{series_memory_json}}

Continuity Mode: {{continuity_mode}}