import { ClientsMatrix, type MatrixClient } from "@/components/clients-matrix";
import { getCatalog } from "@/lib/clients/catalog";
import { SURFACES } from "@/lib/clients/schema";

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
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <h1 className="sr-only">
        clients.dev — how AI coding clients are configured
      </h1>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{clients.length}</span>{" "}
          clients across{" "}
          <span className="font-medium text-foreground">{SURFACES.length}</span>{" "}
          config surfaces. Each dot links to that client&apos;s config; column
          headers compare a surface across clients.
        </p>
      </div>
      <ClientsMatrix clients={matrixClients} />
    </div>
  );
}
