import type { PipelineStepConfig } from "./pipeline.config";

export function topoSortSteps(steps: PipelineStepConfig[]): PipelineStepConfig[] {
  const byName = new Map(steps.map(s => [s.name, s]));
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const out: PipelineStepConfig[] = [];

  function dfs(name: string) {
    if (visited.has(name)) return;
    if (visiting.has(name)) {
      throw new Error(`Pipeline has a cycle involving: ${name}`);
    }
    const step = byName.get(name);
    if (!step) throw new Error(`Pipeline depends on missing step: ${name}`);

    visiting.add(name);
    for (const dep of step.depends_on ?? []) dfs(dep);
    visiting.delete(name);

    visited.add(name);
    out.push(step);
  }

  for (const s of steps) dfs(s.name);
  return out;
}
