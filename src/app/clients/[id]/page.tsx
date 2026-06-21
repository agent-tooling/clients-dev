import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, ChevronLeft } from "lucide-react";
import { ConfigSurface } from "@/components/config-surface";
import { getClient, getClientIds } from "@/lib/clients/catalog";
import { SURFACES, SURFACE_META } from "@/lib/clients/schema";
import { CLIENT_TYPE_LABEL, SURFACE_ICON } from "@/lib/clients/display";

export const dynamicParams = false;

export function generateStaticParams() {
  return getClientIds().map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const client = getClient(id);
  if (!client) return {};
  return {
    title: client.name,
    description:
      client.description ??
      `Configuration surfaces for ${client.name}: MCP, skills, rules, hooks, commands, and settings.`,
  };
}

export default async function ClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = getClient(id);
  if (!client) notFound();

  const present = SURFACES.flatMap((surface) => {
    const config = client.surfaces[surface];
    return config ? [{ surface, config }] : [];
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> All clients
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-3xl font-bold tracking-tight">
              {client.name}
            </h1>
            <span className="rounded-full border border-border/60 px-2 py-0.5 text-xs text-muted-foreground">
              {CLIENT_TYPE_LABEL[client.type] ?? client.type}
            </span>
          </div>
          {client.vendor ? (
            <p className="mt-1 text-sm text-muted-foreground">{client.vendor}</p>
          ) : null}
          {client.description ? (
            <p className="mt-3 max-w-2xl text-muted-foreground">
              {client.description}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-1 text-sm">
          {client.homepage ? (
            <a
              href={client.homepage}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary"
            >
              Website <ArrowUpRight className="h-3 w-3" />
            </a>
          ) : null}
          {client.docs ? (
            <a
              href={client.docs}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary"
            >
              Docs <ArrowUpRight className="h-3 w-3" />
            </a>
          ) : null}
        </div>
      </div>

      <nav className="mt-6 flex flex-wrap gap-2">
        {present.map(({ surface }) => {
          const Icon = SURFACE_ICON[surface];
          return (
            <a
              key={surface}
              href={`#${surface}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <Icon className="h-3.5 w-3.5" />
              {SURFACE_META[surface].label}
            </a>
          );
        })}
      </nav>

      <div className="mt-8 space-y-5">
        {present.map(({ surface, config }) => (
          <ConfigSurface key={surface} surface={surface} config={config} />
        ))}
      </div>
    </div>
  );
}
