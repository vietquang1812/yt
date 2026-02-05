// apps/orchestrator-api/src/projects/utils/promptFormat.ts
export function toChatGPTFormat(systemText: string, userText: string) {
  return `system\n${systemText.trim()}\n\nuser\n${userText.trim()}\n`;
}
