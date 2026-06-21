import { cn } from "@/lib/utils";
import { STATUS_CLASS, STATUS_LABEL } from "@/lib/clients/display";

export function StatusPill({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        STATUS_CLASS[status] ?? STATUS_CLASS.unsupported,
        className,
      )}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
