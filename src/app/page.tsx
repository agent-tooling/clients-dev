import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ClientsMatrix, type MatrixClient } from "@/components/clients-matrix";
import { getCatalog } from "@/lib/clients/catalog";
import { SURFACES, SURFACE_META } from "@/lib/clients/schema";
import { SURFACE_ICON } from "@/lib/clients/display";

export default function HomePage() {
  const { clients } = getCatalog();

  const matrixClients: MatrixClient[] = clients.map((client) => ({
    id: client.id,
    name: client.name,
    vendor: client.vendor ?? "",
    type: client.type,
    description: client.description ?? "",
    statuses: Object.fromEntries(
      SURFACES.map((surface) => [surface, client.surfaces[surface]?.status]),
    ),
  }));

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-mono text-xs font-medium text-primary">
            open config database
          </span>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
            How every AI coding client is{" "}
            <span className="text-primary">configured</span>.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            A machine-readable database of where each client reads its config
            and the typed fields it accepts — across MCP, skills, rules, hooks,
            commands, and settings. Like models.dev, but for the clients.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="#matrix"
              className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Browse clients
            </Link>
            <Link
              href="/api"
              className="inline-flex h-10 items-center gap-1 rounded-md border border-border/60 px-4 text-sm font-medium transition-colors hover:border-primary/40"
            >
              API <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SURFACES.map((surface) => {
            const Icon = SURFACE_ICON[surface];
            return (
              <Link
                key={surface}
                href={`/${surface}`}
                className="group rounded-xl border border-border/60 bg-card/40 p-4 transition-colors hover:border-primary/50 hover:bg-secondary/40"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="font-mono font-semibold tracking-tight group-hover:text-primary">
                    {SURFACE_META[surface].label}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {SURFACE_META[surface].blurb}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section id="matrix" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-20 sm:px-6">
        <h2 className="mb-1 text-2xl font-bold tracking-tight">
          Client support matrix
        </h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Each dot links to the exact config surface for that client. Click a
          column header to compare a surface across clients.
        </p>
        <ClientsMatrix clients={matrixClients} />
      </section>
    </div>
  );
}
