// apps/orchestrator-api/src/projects/utils/template.ts
export function renderTemplate(t: string, vars: Record<string, any>) {
  return t.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k) => {
    const v = vars[k];
    return v === undefined || v === null ? "" : String(v);
  });
}
