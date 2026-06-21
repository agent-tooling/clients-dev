"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SURFACE_ICON } from "@/lib/clients/display";
import { SURFACES, type SurfaceId } from "@/lib/clients/schema";
import { cn } from "@/lib/utils";

export type SurfaceTab = {
  id: SurfaceId;
  label: string;
  status?: string;
  content: ReactNode;
};

const DOT: Record<string, string> = {
  supported: "bg-primary",
  partial: "bg-amber-500",
  deprecated: "bg-muted-foreground/40",
  unsupported: "bg-destructive/70",
  missing: "border border-dashed border-muted-foreground/50",
};

function isSurface(value: string | null): value is SurfaceId {
  return value !== null && (SURFACES as readonly string[]).includes(value);
}

/**
 * Tabs that keep every panel in the (statically rendered) HTML via `forceMount`
 * — inactive panels carry the `hidden` attribute but stay in the markup for SEO.
 * The active tab is synced to a `?tab=` query param with the History API so each
 * surface has a shareable URL, without pulling content into a useSearchParams
 * client-rendering bailout.
 */
export function ClientSurfaceTabs({
  items,
  initialTab,
}: {
  items: SurfaceTab[];
  initialTab: SurfaceId;
}) {
  const [active, setActive] = useState<SurfaceId>(initialTab);

  useEffect(() => {
    const sync = () => {
      const param = new URLSearchParams(window.location.search).get("tab");
      if (isSurface(param) && items.some((item) => item.id === param)) {
        setActive(param);
      }
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [items]);

  function onChange(value: string) {
    if (!isSurface(value)) return;
    setActive(value);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", value);
    window.history.replaceState(null, "", url);
  }

  return (
    <Tabs value={active} onValueChange={onChange}>
      <TabsList
        variant="line"
        className="h-auto w-full justify-start gap-1 overflow-x-auto"
      >
        {items.map((item) => {
          const Icon = SURFACE_ICON[item.id];
          return (
            <TabsTrigger
              key={item.id}
              value={item.id}
              className="flex-none gap-1.5 px-3 py-1.5"
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
              <span
                className={cn(
                  "ml-0.5 inline-block h-1.5 w-1.5 rounded-full",
                  DOT[item.status ?? "missing"] ?? DOT.missing,
                )}
              />
            </TabsTrigger>
          );
        })}
      </TabsList>

      {items.map((item) => (
        <TabsContent
          key={item.id}
          value={item.id}
          forceMount
          className="mt-4 data-[state=inactive]:hidden"
        >
          {item.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
