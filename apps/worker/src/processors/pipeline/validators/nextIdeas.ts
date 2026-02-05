export function validateNextIdeas(ideas: any, continuityMode: string) {
  if (!Array.isArray(ideas) || ideas.length !== 3) {
    throw new Error("next_ideas must be an array of exactly 3 items");
  }

  for (const [idx, i] of ideas.entries()) {
    if (!i || typeof i !== "object") throw new Error(`next_ideas[${idx}] invalid object`);

    if (typeof i.topic !== "string" || !i.topic.trim())
      throw new Error(`next_ideas[${idx}].topic required`);
    if (typeof i.pillar !== "string" || !i.pillar.trim())
      throw new Error(`next_ideas[${idx}].pillar required`);
    if (typeof i.tone !== "string" || !i.tone.trim())
      throw new Error(`next_ideas[${idx}].tone required`);

    if (!i.series || typeof i.series !== "object")
      throw new Error(`next_ideas[${idx}].series required`);
    if (!["existing", "new"].includes(i.series.mode))
      throw new Error(`next_ideas[${idx}].series.mode invalid`);
    if (typeof i.series.name !== "string" || !i.series.name.trim())
      throw new Error(`next_ideas[${idx}].series.name required`);

    if (!["none", "light", "occasionally_strong"].includes(i.continuity)) {
      throw new Error(`next_ideas[${idx}].continuity invalid`);
    }
    if (continuityMode === "occasionally_strong" && i.continuity === "none") {
      throw new Error(
        `next_ideas[${idx}].continuity too weak for continuityMode=occasionally_strong`
      );
    }

    if (
      typeof i.duration_minutes !== "number" ||
      i.duration_minutes < 5 ||
      i.duration_minutes > 8
    ) {
      throw new Error(`next_ideas[${idx}].duration_minutes invalid (5..8)`);
    }
  }
}
