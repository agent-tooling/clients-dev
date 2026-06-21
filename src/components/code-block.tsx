import { CopyButton } from "@/components/copy-button";

export function CodeBlock({
  code,
  language,
  title,
}: {
  code: string;
  language?: string;
  title?: string;
}) {
  const trimmed = code.trim();
  return (
    <div className="overflow-hidden rounded-lg border border-border/60 bg-secondary/30">
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-1.5">
        <span className="font-mono text-xs text-muted-foreground">
          {title ?? language ?? "code"}
        </span>
        <CopyButton value={trimmed} />
      </div>
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed">
        <code className="font-mono">{trimmed}</code>
      </pre>
    </div>
  );
}
