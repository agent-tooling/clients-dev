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

export const STATUS_LABEL: Record<string, string> = {
  supported: "Supported",
  partial: "Partial",
  deprecated: "Deprecated",
  unsupported: "Not supported",
};

/** Tailwind classes for a status pill, keyed by support status. */
export const STATUS_CLASS: Record<string, string> = {
  supported:
    "bg-primary/10 text-primary border-primary/20",
  partial:
    "bg-chart-4/10 text-chart-4 border-chart-4/30",
  deprecated:
    "bg-muted text-muted-foreground border-border",
  unsupported:
    "bg-destructive/10 text-destructive border-destructive/20",
};

export const SCOPE_LABEL: Record<string, string> = {
  project: "Project",
  global: "Global",
  enterprise: "Enterprise",
};
