export type LlmTextResponse = { text: string };

// MVP stub: trả về output giả để pipeline chạy được
export async function llmComplete(prompt: string): Promise<LlmTextResponse> {
    // Nếu prompt yêu cầu JSON thì trả JSON
    const wantsJson = prompt.includes("Output as JSON") || prompt.includes('"title"');

    if (wantsJson) {
        const json = {
            title: "Why discipline beats motivation (every time)",
            hook: "Motivation feels great. Then it disappears. That’s the whole problem.",
            sections: [
                { id: "problem", text: "Most people don’t lack motivation. They wait to feel ready." },
                { id: "reframe", text: "Motivation is useful after you start. Discipline works before you feel good." },
                { id: "steps", bullets: ["Decide once.", "Make it smaller than your mood.", "Same time daily.", "Track actions.", "Never skip completely."] }
            ],
            closing: "You don’t need more motivation. You need fewer decisions.",
            cta: "If this hit close to home, you’ll like the next one."
        };
        return { text: JSON.stringify(json, null, 2) };
    }

    // Otherwise trả text
    return { text: prompt + "\n\n[stubbed response]\n" };
}
