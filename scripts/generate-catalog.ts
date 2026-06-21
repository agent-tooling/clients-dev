#!/usr/bin/env bun
/**
 * Compiles the TOML source files under `configs/<client-id>/` into a single
 * validated `src/data/catalog.json`. Mirrors the models.dev compile step:
 * source-of-truth files in, one JSON catalog out.
 */
import { existsSync, readdirSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseToml } from "smol-toml";
import { Catalog, ClientMeta, SurfaceConfig, SURFACES } from "../src/lib/clients/schema";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const configsDir = join(root, "configs");
const outFile = join(root, "src", "data", "catalog.json");

function readToml(path: string): unknown {
  return parseToml(readFileSync(path, "utf-8"));
}

function buildClient(id: string) {
  const dir = join(configsDir, id);
  const metaPath = join(dir, "client.toml");
  if (!existsSync(metaPath)) {
    throw new Error(`Missing client.toml for "${id}"`);
  }
  const meta = ClientMeta.parse(readToml(metaPath));

  const surfaces: Record<string, unknown> = {};
  for (const surface of SURFACES) {
    const surfacePath = join(dir, `${surface}.toml`);
    if (!existsSync(surfacePath)) continue;
    surfaces[surface] = SurfaceConfig.parse(readToml(surfacePath));
  }

  return { id, ...meta, surfaces };
}

function main() {
  if (!existsSync(configsDir)) {
    throw new Error(`configs/ directory not found at ${configsDir}`);
  }
  const ids = readdirSync(configsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const clients = ids.map(buildClient).sort((a, b) => a.name.localeCompare(b.name));

  const catalog = Catalog.parse({
    generatedAt: new Date().toISOString(),
    clients,
  });

  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, JSON.stringify(catalog, null, 2) + "\n");
  console.log(
    `Compiled ${catalog.clients.length} clients -> ${outFile.replace(root + "/", "")}`,
  );
}

main();
