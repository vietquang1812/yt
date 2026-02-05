function countWords(text: string) {
    const cleaned = (text || "").trim();
    if (!cleaned) return 0;
    return cleaned.split(/\s+/).length;
}

function normalizeForCompare(s: string) {
    return (s || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s.!?]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function splitSentences(s: string) {
    const t = normalizeForCompare(s);
    return t
        .split(/[.!?]+/g)
        .map((x) => x.trim())
        .filter(Boolean)
        .filter((x) => x.length >= 20);
}

function sentenceOverlapRatio(a: string, b: string) {
    const sa = new Set(splitSentences(a));
    const sb = new Set(splitSentences(b));
    if (sa.size === 0 || sb.size === 0) return 0;

    let inter = 0;
    for (const x of sa) if (sb.has(x)) inter++;

    const minSize = Math.min(sa.size, sb.size);
    return inter / minSize;
}

export function validateScriptPack(pack: any) {
    if (!pack || typeof pack !== "object") throw new Error("invalid JSON object");
    if (!Array.isArray(pack.parts)) throw new Error("missing `parts` array");
    if (pack.parts.length < 1 || pack.parts.length > 6) {
        throw new Error("parts length must be 1..6");
    }

    let total = 0;
    for (const p of pack.parts) {
        if (!p || typeof p !== "object") throw new Error("invalid part object");
        if (typeof p.part !== "number") throw new Error("part.part must be number");
        if (typeof p.word_count !== "number") throw new Error("part.word_count must be number");
        if (typeof p.content !== "string") throw new Error("part.content must be string");

        const wc = countWords(p.content);
        total += wc;
        p.real_count = wc;
        if (Math.abs(wc - p.word_count) > Math.max(120, p.word_count * 0.2)) {
            p.word_count_corrected = true;
            console.warn(
                `Word count mismatch part ${p.part}`,
                { reported: p.word_count, actual: wc }
            );
            //   throw new Error(`part ${p.part} word_count mismatch (reported ${p.word_count}, actual ${wc})`);
        }
    }

    if (total < 3000 || total > 6000) {
        throw new Error(`total word count out of range (actual ${total})`);
    }

    for (let i = 1; i < pack.parts.length; i++) {
        const prev = pack.parts[i - 1]?.content || "";
        const curr = pack.parts[i]?.content || "";
        const ratio = sentenceOverlapRatio(prev, curr);
        if (ratio > 0.35) {
            throw new Error(
                `repetitive content detected between part ${i} and ${i + 1} (overlap ${ratio.toFixed(2)})`
            );
        }
    }

    if (pack.compliance && typeof pack.compliance === "object") {
        const requiredFlags = [
            "youtube_safe",
            "us_law_safe",
            "no_hate",
            "no_illegal_instructions",
            "no_graphic_violence",
            "no_explicit_sexual_content",
            "no_repetition",
        ] as const;

        for (const k of requiredFlags) {
            if (pack.compliance[k] !== true) {
                throw new Error(`compliance flag ${k} must be true`);
            }
        }
    }

    pack.total_word_count = total;
    return pack;
}
