import { Hono } from "hono";
import { cors } from "hono/cors";
import { handle } from "hono/vercel";
import {
  getCatalog,
  getClient,
  getClientsForSurface,
} from "@/lib/clients/catalog";
import { SURFACES, SURFACE_META, type SurfaceId } from "@/lib/clients/schema";

const app = new Hono().basePath("/api");

app.use("*", cors());

const stripJson = (value: string) => value.replace(/\.json$/, "");

const isSurface = (value: string): value is SurfaceId =>
  (SURFACES as readonly string[]).includes(value);

app.get("/", (c) =>
  c.json({
    name: "clients.dev API",
    description:
      "Machine-readable configuration surfaces for AI coding clients.",
    endpoints: {
      catalog: "/api/catalog.json",
      clients: "/api/clients.json",
      client: "/api/clients/{id}.json",
      surface: "/api/{surface}.json",
    },
    surfaces: SURFACES.map((id) => ({ id, ...SURFACE_META[id] })),
  }),
);

app.get("/catalog.json", (c) => c.json(getCatalog()));

app.get("/clients.json", (c) => c.json(getCatalog().clients));

app.get("/clients/:id", (c) => {
  const client = getClient(stripJson(c.req.param("id")));
  if (!client) return c.json({ error: "client not found" }, 404);
  return c.json(client);
});

app.get("/:surface", (c) => {
  const surface = stripJson(c.req.param("surface"));
  if (!isSurface(surface)) return c.json({ error: "unknown endpoint" }, 404);
  return c.json({
    surface,
    ...SURFACE_META[surface],
    clients: getClientsForSurface(surface).map((client) => ({
      id: client.id,
      name: client.name,
      config: client.surfaces[surface],
    })),
  });
});

export const GET = handle(app);
