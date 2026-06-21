import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ConfigSurface } from "@/components/config-surface";
import { getClientsForSurface } from "@/lib/clients/catalog";
import { SURFACES, SURFACE_META, type SurfaceId } from "@/lib/clients/schema";
import { CLIENT_TYPE_LABEL, SURFACE_ICON } from "@/lib/clients/display";

export const dynamicParams = false;

export function generateStaticParams() {
  return SURFACES.map((surface) => ({ surface }));
}

function asSurface(value: string): SurfaceId | undefined {
  return (SURFACES as readonly string[]).includes(value)
    ? (value as SurfaceId)
    : undefined;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ surface: string }>;
}): Promise<Metadata> {
  const { surface } = await params;
  const id = asSurface(surface);
  if (!id) return {};
  return {
    title: `${SURFACE_META[id].label} across clients`,
    description: SURFACE_META[id].blurb,
  };
}

export default async function SurfacePage({
  params,
}: {
  params: Promise<{ surface: string }>;
}) {
  const { surface } = await params;
  const id = asSurface(surface);
  if (!id) notFound();

  const clients = getClientsForSurface(id);
  const Icon = SURFACE_ICON[id];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Home
      </Link>

      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {SURFACE_META[id].label}
          </h1>
          <p className="text-sm text-muted-foreground">{SURFACE_META[id].blurb}</p>
        </div>
      </div>

      <nav className="mt-6 flex flex-wrap gap-2">
        {SURFACES.filter((other) => other !== id).map((other) => {
          const OtherIcon = SURFACE_ICON[other];
          return (
            <Link
              key={other}
              href={`/${other}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <OtherIcon className="h-3.5 w-3.5" />
              {SURFACE_META[other].label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 space-y-8">
        {clients.map((client) => {
          const config = client.surfaces[id];
          if (!config) return null;
          return (
            <div key={client.id}>
              <div className="mb-3 flex items-center gap-2">
                <Link
                  href={`/clients/${client.id}`}
                  className="font-mono text-lg font-semibold tracking-tight hover:text-primary"
                >
                  {client.name}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {CLIENT_TYPE_LABEL[client.type] ?? client.type}
                </span>
              </div>
              <ConfigSurface
                surface={id}
                config={config}
                anchorId={`${client.id}-${id}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
