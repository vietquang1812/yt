import { useState } from "react";

export function usePromptPack(projectId: string) {
  const [value, setValue] = useState('');

  const save = async () => {
    const parsed = JSON.parse(value);

    await fetch(`/api/projects/${projectId}/prompt-pack`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt_pack_json: parsed }),
    });
  };

  return {
    value,
    setValue,
    save,
  };
}
