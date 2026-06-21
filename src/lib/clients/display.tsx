import {
  Plug,
  ScrollText,
  Settings2,
  Sparkles,
  SquareSlash,
  Webhook,
  type LucideIcon,
} from "lucide-react";
import type { SurfaceId } from "./schema";

export const SURFACE_ICON: Record<SurfaceId, LucideIcon> = {
  mcp: Plug,
  skills: Sparkles,
  rules: ScrollText,
  hooks: Webhook,
  commands: SquareSlash,
  settings: Settings2,
};

export const CLIENT_TYPE_LABEL: Record<string, string> = {
  editor: "Editor",
  "ide-extension": "IDE extension",
  cli: "CLI",
  "desktop-app": "Desktop app",
  platform: "Platform",
};

/** Human label for a (possibly unknown) client type. */
export function clientTypeLabel(type?: string): string {
  if (!type) return "";
  return CLIENT_TYPE_LABEL[type] ?? type;
}

export const STATUS_LABEL: Record<string, string> = {
  supported: "Supported",
  partial: "Partial",
  deprecated: "Deprecated",
  unsupported: "Not supported",
  missing: "Information missing",
};

/** Tailwind classes for a status pill, keyed by support status. */
export const STATUS_CLASS: Record<string, string> = {
  supported:
    "bg-primary/10 text-primary border-primary/20",
  partial:
    "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400",
  deprecated:
    "bg-muted text-muted-foreground border-border",
  unsupported:
    "bg-destructive/10 text-destructive border-destructive/20",
  missing:
    "bg-muted/60 text-muted-foreground border-dashed border-border",
};

export const SCOPE_LABEL: Record<string, string> = {
  project: "Project",
  global: "Global",
  enterprise: "Enterprise",
};
