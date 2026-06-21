"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { SURFACES, SURFACE_META, type SurfaceId } from "@/lib/clients/schema";
import {
  CLIENT_TYPE_LABEL,
  STATUS_LABEL,
  SURFACE_ICON,
} from "@/lib/clients/display";

export type MatrixClient = {
  id: string;
  name: string;
  vendor: string;
  type: string;
  description: string;
  statuses: Partial<Record<SurfaceId, string>>;
};

const DOT_CLASS: Record<string, string> = {
  supported: "bg-primary",
  partial: "bg-chart-4",
  deprecated: "bg-muted-foreground/40",
  unsupported: "bg-transparent border border-border",
};

function Dot({ status }: { status: string | undefined }) {
  const resolved = status ?? "unsupported";
  return (
    <span
      title={status ? STATUS_LABEL[status] : "Not documented"}
      className={cn(
        "inline-block h-2.5 w-2.5 rounded-full",
        DOT_CLASS[resolved] ?? DOT_CLASS.unsupported,
      )}
    />
  );
}

function supportedCount(client: MatrixClient): number {
  return Object.values(client.statuses).filter(
    (status) => status === "supported" || status === "partial",
  ).length;
}

export function ClientsMatrix({ clients }: { clients: MatrixClient[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"name" | "coverage">("name");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = clients.filter((client) =>
      q
        ? `${client.name} ${client.vendor} ${client.id} ${client.type}`
            .toLowerCase()
            .includes(q)
        : true,
    );
    return [...matched].sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : supportedCount(b) - supportedCount(a) || a.name.localeCompare(b.name),
    );
  }, [clients, query, sort]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter clients…"
            className="h-9 w-full rounded-md border border-border/60 bg-secondary/30 pr-3 pl-9 text-sm outline-none focus:border-primary/50"
          />
        </div>
        <div className="flex items-center gap-1 text-xs">
          <span className="text-muted-foreground">Sort</span>
          {(["name", "coverage"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSort(option)}
              className={cn(
                "rounded-md px-2 py-1 font-medium transition-colors",
                sort === option
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option === "name" ? "Name" : "Coverage"}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-secondary/30">
              <th className="px-4 py-3 text-left font-medium">Client</th>
              {SURFACES.map((surface) => {
                const Icon = SURFACE_ICON[surface];
                return (
                  <th key={surface} className="px-2 py-3 text-center font-medium">
                    <Link
                      href={`/${surface}`}
                      className="inline-flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-primary"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-[11px]">
                        {SURFACE_META[surface].label}
                      </span>
                    </Link>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filtered.map((client) => (
              <tr
                key={client.id}
                className="border-b border-border/40 transition-colors last:border-0 hover:bg-secondary/30"
              >
                <td className="px-4 py-3">
                  <Link href={`/clients/${client.id}`} className="group block">
                    <span className="font-medium group-hover:text-primary">
                      {client.name}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {CLIENT_TYPE_LABEL[client.type] ?? client.type}
                    </span>
                  </Link>
                </td>
                {SURFACES.map((surface) => (
                  <td key={surface} className="px-2 py-3 text-center">
                    <Link
                      href={`/clients/${client.id}#${surface}`}
                      className="inline-flex items-center justify-center"
                      aria-label={`${client.name} ${SURFACE_META[surface].label}`}
                    >
                      <Dot status={client.statuses[surface]} />
                    </Link>
                  </td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={SURFACES.length + 1}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  No clients match “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        {(["supported", "partial", "deprecated", "unsupported"] as const).map(
          (status) => (
            <span key={status} className="inline-flex items-center gap-1.5">
              <Dot status={status === "unsupported" ? undefined : status} />
              {status === "unsupported" ? "Not documented" : STATUS_LABEL[status]}
            </span>
          ),
        )}
      </div>
    </div>
  );
}
