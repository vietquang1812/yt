import { usePromptPack } from '../hooks/usePromptPack';
import { PromptPackEditor } from '../components/PromptPackEditor';
import { PromptPackActions } from '../components/PromptPackActions';

export function PromptPackTab({ projectId }: any) {
  const { value, setValue, save } = usePromptPack(projectId);

  return (
    <>
      <PromptPackEditor value={value} onChange={setValue} />
      <PromptPackActions onSave={save} />
    </>
  );
}
