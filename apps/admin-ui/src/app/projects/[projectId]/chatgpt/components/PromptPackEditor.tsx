export function PromptPackEditor({ value, onChange }: any) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-[500px] font-mono text-sm"
    />
  );
}
