#!/usr/bin/env bun
/**
 * One-time seed importer. Encodes the authoritative datasets from two source
 * repos and emits `configs/<id>/` TOML:
 *
 *   - MCP config  → neon-solutions/add-mcp  (src/agents.ts)
 *   - Skills      → vercel-labs/skills      (src/agents.ts)
 *
 * Everything here is transcribed from those repos (which are themselves derived
 * from each client's official docs). Where a repo gives no information for a
 * surface, we emit nothing — the UI renders that as "Information missing"
 * rather than guessing supported/unsupported.
 *
 * The importer NEVER overwrites an existing file, so the hand-authored clients
 * (cursor, claude-code, codex) and any manual edits are preserved. Re-running
 * is safe and only fills in gaps.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const configsDir = join(root, "configs");

// ---------------------------------------------------------------------------
// Minimal, exact TOML serializer for our constrained shapes.
// Scalars + string arrays are emitted first, arrays-of-tables ([[key]]) last,
// which keeps the output valid regardless of insertion order.
// ---------------------------------------------------------------------------
type Scalar = string | number | boolean;
type Row = Record<string, Scalar>;
type Table = Record<string, Scalar | Scalar[] | Row[]>;

function isRowArray(value: Scalar | Scalar[] | Row[]): value is Row[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    typeof value[0] === "object" &&
    value[0] !== null
  );
}

function emitScalar(value: Scalar): string {
  if (typeof value === "string") return JSON.stringify(value);
  return String(value);
}

function emitArray(values: Scalar[]): string {
  if (values.length === 0) return "[]";
  return `[${values.map(emitScalar).join(", ")}]`;
}

function toToml(table: Table): string {
  const lines: string[] = [];
  const rowArrays: Array<[string, Row[]]> = [];

  for (const [key, value] of Object.entries(table)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      if (isRowArray(value)) {
        rowArrays.push([key, value]);
      } else {
        lines.push(`${key} = ${emitArray(value as Scalar[])}`);
      }
    } else {
      lines.push(`${key} = ${emitScalar(value)}`);
    }
  }

  for (const [key, rows] of rowArrays) {
    for (const row of rows) {
      lines.push("");
      lines.push(`[[${key}]]`);
      for (const [rowKey, rowValue] of Object.entries(row)) {
        if (rowValue === undefined) continue;
        lines.push(`${rowKey} = ${emitScalar(rowValue)}`);
      }
    }
  }

  return lines.join("\n") + "\n";
}

function writeIfAbsent(relPath: string, table: Table): "wrote" | "skip" {
  const full = join(configsDir, relPath);
  if (existsSync(full)) return "skip";
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, toToml(table));
  return "wrote";
}

// ---------------------------------------------------------------------------
// Field/capability helpers
// ---------------------------------------------------------------------------
function field(
  name: string,
  type: string,
  description: string,
  required = false,
): Row {
  return required
    ? { name, type, required: true, description }
    : { name, type, description };
}

function cap(name: string, status: "supported" | "unsupported"): Row {
  return { name, status };
}

const F = {
  command: () =>
    field("command", "string", "Command to start a local (stdio) server."),
  args: () => field("args", "string[]", "Arguments passed to the command."),
  env: () =>
    field("env", "record<string, string>", "Environment variables for the server."),
  url: () => field("url", "string", "Endpoint URL for a remote server."),
  headers: () =>
    field("headers", "record<string, string>", "HTTP headers for a remote server."),
};

// ---------------------------------------------------------------------------
// Curated metadata — ONLY where verified. Unknown fields are omitted (not guessed).
// ---------------------------------------------------------------------------
type Meta = {
  name?: string;
  type?: string;
  vendor?: string;
  homepage?: string;
  docs?: string;
  description?: string;
};

const META: Record<string, Meta> = {
  "gemini-cli": {
    name: "Gemini CLI",
    type: "cli",
    vendor: "Google",
    homepage: "https://github.com/google-gemini/gemini-cli",
  },
  opencode: {
    name: "OpenCode",
    type: "cli",
    vendor: "opencode",
    homepage: "https://opencode.ai",
  },
  zed: { name: "Zed", type: "editor", vendor: "Zed Industries", homepage: "https://zed.dev" },
  windsurf: {
    name: "Windsurf",
    type: "editor",
    vendor: "Codeium",
    homepage: "https://windsurf.com",
  },
  cline: { name: "Cline", type: "ide-extension", vendor: "Cline", homepage: "https://cline.bot" },
  "cline-cli": { name: "Cline CLI", type: "cli", vendor: "Cline", homepage: "https://cline.bot" },
  goose: {
    name: "Goose",
    type: "cli",
    vendor: "Block",
    homepage: "https://block.github.io/goose/",
  },
  antigravity: {
    name: "Antigravity",
    type: "editor",
    vendor: "Google",
    homepage: "https://antigravity.google/",
  },
  "antigravity-cli": { name: "Antigravity CLI", type: "cli", vendor: "Google" },
  "claude-desktop": {
    name: "Claude Desktop",
    type: "desktop-app",
    vendor: "Anthropic",
    homepage: "https://claude.ai/download",
  },
  vscode: {
    name: "VS Code",
    type: "editor",
    vendor: "Microsoft",
    homepage: "https://code.visualstudio.com/",
  },
  "github-copilot": {
    name: "GitHub Copilot",
    type: "ide-extension",
    vendor: "GitHub",
    homepage: "https://github.com/features/copilot",
  },
  "github-copilot-cli": {
    name: "GitHub Copilot CLI",
    type: "cli",
    vendor: "GitHub",
    homepage: "https://github.com/features/copilot",
  },
  mcporter: { name: "MCPorter", type: "cli" },
  continue: {
    name: "Continue",
    type: "ide-extension",
    vendor: "Continue",
    homepage: "https://continue.dev/",
  },
  roo: { name: "Roo Code", type: "ide-extension", vendor: "Roo Code", homepage: "https://roocode.com/" },
  kilo: { name: "Kilo Code", type: "ide-extension", vendor: "Kilo Code", homepage: "https://kilocode.ai/" },
  amp: { name: "Amp", type: "cli", vendor: "Sourcegraph", homepage: "https://ampcode.com/" },
  augment: {
    name: "Augment",
    type: "ide-extension",
    vendor: "Augment Code",
    homepage: "https://www.augmentcode.com/",
  },
  "qwen-code": {
    name: "Qwen Code",
    type: "cli",
    vendor: "Alibaba",
    homepage: "https://github.com/QwenLM/qwen-code",
  },
  crush: {
    name: "Crush",
    type: "cli",
    vendor: "Charm",
    homepage: "https://github.com/charmbracelet/crush",
  },
  droid: { name: "Droid", type: "cli", vendor: "Factory", homepage: "https://factory.ai/" },
  warp: { name: "Warp", type: "cli", vendor: "Warp", homepage: "https://www.warp.dev/" },
  replit: { name: "Replit", type: "platform", vendor: "Replit", homepage: "https://replit.com/" },
  junie: {
    name: "Junie",
    type: "ide-extension",
    vendor: "JetBrains",
    homepage: "https://www.jetbrains.com/junie/",
  },
  trae: { name: "Trae", type: "editor", vendor: "ByteDance", homepage: "https://www.trae.ai/" },
  "trae-cn": { name: "Trae CN", type: "editor", vendor: "ByteDance", homepage: "https://www.trae.com.cn/" },
  "kiro-cli": { name: "Kiro CLI", type: "cli", vendor: "AWS", homepage: "https://kiro.dev/" },
  openhands: {
    name: "OpenHands",
    type: "cli",
    vendor: "All Hands AI",
    homepage: "https://github.com/All-Hands-AI/OpenHands",
  },
  devin: { name: "Devin for Terminal", type: "cli", vendor: "Cognition", homepage: "https://devin.ai/" },
  qoder: { name: "Qoder", type: "editor", vendor: "Qoder", homepage: "https://qoder.com/" },
  "qoder-cn": { name: "Qoder CN", type: "editor", vendor: "Qoder" },
  cortex: { name: "Cortex Code", type: "cli", vendor: "Snowflake" },
  "mistral-vibe": { name: "Mistral Vibe", type: "cli", vendor: "Mistral", homepage: "https://mistral.ai/" },
  "kimi-code-cli": { name: "Kimi Code CLI", type: "cli", vendor: "Moonshot AI" },
  "iflow-cli": { name: "iFlow CLI", type: "cli", vendor: "iFlow" },
  lingma: { name: "Lingma", type: "ide-extension", vendor: "Alibaba" },
  "tabnine-cli": { name: "Tabnine CLI", type: "cli", vendor: "Tabnine", homepage: "https://www.tabnine.com/" },
  firebender: {
    name: "Firebender",
    type: "ide-extension",
    vendor: "Firebender",
    homepage: "https://firebender.com/",
  },
  forgecode: { name: "ForgeCode", type: "cli", vendor: "ForgeCode", homepage: "https://forgecode.dev/" },
  bob: { name: "IBM Bob", vendor: "IBM" },
  codebuddy: { name: "CodeBuddy", vendor: "Tencent" },
  "codearts-agent": { name: "CodeArts Agent", vendor: "Huawei" },
  rovodev: { name: "Rovo Dev", type: "cli", vendor: "Atlassian" },
  ona: { name: "Ona", type: "cli", vendor: "Ona" },
  zencoder: { name: "Zencoder", type: "ide-extension", vendor: "Zencoder", homepage: "https://zencoder.ai/" },
  zenflow: { name: "Zenflow", type: "ide-extension", vendor: "Zencoder", homepage: "https://zencoder.ai/" },
  "aider-desk": { name: "AiderDesk", type: "desktop-app" },
};

// ---------------------------------------------------------------------------
// MCP dataset — from neon-solutions/add-mcp (src/agents.ts)
// ---------------------------------------------------------------------------
type McpEntry = {
  displayName: string;
  transports: string[];
  auth: string[];
  files: Row[];
  fields: Row[];
  notes?: string[];
  summary: string;
};

const MCP: Record<string, McpEntry> = {
  antigravity: {
    displayName: "Antigravity",
    summary: "Configure MCP servers in JSON under the mcpServers key.",
    transports: ["stdio", "http", "sse"],
    auth: ["headers"],
    files: [
      { path: "~/.gemini/antigravity/mcp_config.json", scope: "global", format: "json", key: "mcpServers" },
    ],
    fields: [
      F.command(),
      F.args(),
      F.env(),
      field("serverUrl", "string", "Endpoint URL for a remote server."),
      F.headers(),
    ],
    notes: ["Remote entries use serverUrl (no type field)."],
  },
  cline: {
    displayName: "Cline",
    summary: "Configure MCP servers in JSON under the mcpServers key.",
    transports: ["stdio", "http", "sse"],
    auth: ["headers"],
    files: [
      {
        path: "saoudrizwan.claude-dev/settings/cline_mcp_settings.json",
        scope: "global",
        format: "json",
        key: "mcpServers",
        note: "Stored under the VS Code globalStorage directory (e.g. ~/Library/Application Support/Code/User/globalStorage on macOS).",
      },
    ],
    fields: [
      F.command(),
      F.args(),
      F.env(),
      F.url(),
      field("type", '"sse" | "streamableHttp"', "Remote transport type."),
      field("disabled", "boolean", "Whether the server is disabled."),
      F.headers(),
    ],
    notes: ["Remote entries set type to 'sse' or 'streamableHttp' and include disabled."],
  },
  "cline-cli": {
    displayName: "Cline CLI",
    summary: "Configure MCP servers in JSON under the mcpServers key.",
    transports: ["stdio", "http", "sse"],
    auth: ["headers"],
    files: [
      {
        path: "~/.cline/data/settings/cline_mcp_settings.json",
        scope: "global",
        format: "json",
        key: "mcpServers",
        note: "$CLINE_DIR defaults to ~/.cline.",
      },
    ],
    fields: [
      F.command(),
      F.args(),
      F.env(),
      F.url(),
      field("type", '"sse" | "streamableHttp"', "Remote transport type."),
      field("disabled", "boolean", "Whether the server is disabled."),
      F.headers(),
    ],
  },
  "claude-desktop": {
    displayName: "Claude Desktop",
    summary: "Local (stdio) MCP servers in JSON under the mcpServers key.",
    transports: ["stdio"],
    auth: [],
    files: [
      {
        path: "~/Library/Application Support/Claude/claude_desktop_config.json",
        scope: "global",
        format: "json",
        key: "mcpServers",
        note: "macOS path; see Claude Desktop docs for other operating systems.",
      },
    ],
    fields: [F.command(), F.args(), F.env()],
    notes: [
      "Only local (stdio) servers are configured via the file. Add remote servers through Settings → Connectors in the app.",
    ],
  },
  "gemini-cli": {
    displayName: "Gemini CLI",
    summary: "Configure MCP servers in JSON under the mcpServers key.",
    transports: ["stdio", "http", "sse"],
    auth: ["headers", "oauth"],
    files: [
      { path: "~/.gemini/settings.json", scope: "global", format: "json", key: "mcpServers" },
      { path: ".gemini/settings.json", scope: "project", format: "json", key: "mcpServers" },
    ],
    fields: [
      F.command(),
      F.args(),
      F.env(),
      F.url(),
      F.headers(),
      field("timeout", "number", "Request timeout in milliseconds for remote servers."),
      field("oauth", "{ scopes: string[] }", "OAuth configuration (scopes written under oauth.scopes)."),
    ],
  },
  goose: {
    displayName: "Goose",
    summary: "Configure MCP servers in YAML under the extensions key.",
    transports: ["stdio", "http", "sse"],
    auth: ["headers"],
    files: [
      {
        path: "~/.config/goose/config.yaml",
        scope: "global",
        format: "yaml",
        key: "extensions",
        note: "Windows: %APPDATA%/Block/goose/config/config.yaml.",
      },
    ],
    fields: [
      field("name", "string", "Extension name."),
      field("cmd", "string", "Command for a local (stdio) extension."),
      F.args(),
      field("uri", "string", "Endpoint URL for a remote extension."),
      field("type", '"stdio" | "sse" | "streamable_http"', "Extension transport type."),
      field("enabled", "boolean", "Whether the extension is enabled."),
      field("envs", "record<string, string>", "Environment variables."),
      field("timeout", "number", "Timeout in seconds."),
    ],
    notes: ["Servers are configured as entries under the extensions key (not mcpServers)."],
  },
  "github-copilot-cli": {
    displayName: "GitHub Copilot CLI",
    summary: "Configure MCP servers in JSON. Global uses mcpServers; project uses the VS Code servers key.",
    transports: ["stdio", "http", "sse"],
    auth: ["headers"],
    files: [
      {
        path: "~/.copilot/mcp-config.json",
        scope: "global",
        format: "json",
        key: "mcpServers",
        note: "Or $XDG_CONFIG_HOME/mcp-config.json.",
      },
      {
        path: ".vscode/mcp.json",
        scope: "project",
        format: "json",
        key: "servers",
        note: "Project config uses the VS Code servers key.",
      },
    ],
    fields: [
      field("type", '"stdio" | "http" | "sse"', "Server transport type."),
      F.command(),
      F.args(),
      F.env(),
      F.url(),
      F.headers(),
      field("tools", "string[]", 'Tool allow-list; global entries use ["*"] for all tools.'),
    ],
  },
  mcporter: {
    displayName: "MCPorter",
    summary: "Configure MCP servers in JSON under the mcpServers key.",
    transports: ["stdio", "http", "sse"],
    auth: ["headers"],
    files: [
      {
        path: "~/.mcporter/mcporter.json",
        scope: "global",
        format: "json",
        key: "mcpServers",
        note: "Also reads mcporter.jsonc.",
      },
      { path: "config/mcporter.json", scope: "project", format: "json", key: "mcpServers" },
    ],
    fields: [
      F.command(),
      F.args(),
      F.env(),
      field("type", '"http" | "sse"', "Remote transport type."),
      F.url(),
      F.headers(),
    ],
  },
  opencode: {
    displayName: "OpenCode",
    summary: "Configure MCP servers in JSON under the mcp key.",
    transports: ["stdio", "http", "sse"],
    auth: ["headers"],
    files: [
      { path: "~/.config/opencode/opencode.json", scope: "global", format: "json", key: "mcp" },
      { path: "opencode.json", scope: "project", format: "json", key: "mcp" },
    ],
    fields: [
      field("type", '"local" | "remote"', "Server type."),
      field("command", "string[]", "For local servers: [command, ...args]."),
      field("environment", "record<string, string>", "Environment variables for local servers."),
      F.url(),
      F.headers(),
      field("enabled", "boolean", "Whether the server is enabled."),
    ],
    notes: [
      "Local servers use type 'local' with command as an array; remote servers use type 'remote' with url.",
    ],
  },
  vscode: {
    displayName: "VS Code",
    summary: "Configure MCP servers in JSON under the servers key.",
    transports: ["stdio", "http", "sse"],
    auth: ["headers"],
    files: [
      {
        path: "<VS Code User>/mcp.json",
        scope: "global",
        format: "json",
        key: "servers",
        note: "e.g. ~/Library/Application Support/Code/User/mcp.json on macOS.",
      },
      { path: ".vscode/mcp.json", scope: "project", format: "json", key: "servers" },
    ],
    fields: [
      field("type", '"http" | "sse"', "Remote transport type."),
      F.command(),
      F.args(),
      F.env(),
      F.url(),
      F.headers(),
    ],
    notes: ["Servers live under the servers key (not mcpServers)."],
  },
  windsurf: {
    displayName: "Windsurf",
    summary: "Configure MCP servers in JSON under the mcpServers key.",
    transports: ["stdio", "http", "sse"],
    auth: ["headers"],
    files: [
      { path: "~/.codeium/windsurf/mcp_config.json", scope: "global", format: "json", key: "mcpServers" },
    ],
    fields: [
      F.command(),
      F.args(),
      F.env(),
      field("serverUrl", "string", "Endpoint URL for a remote server."),
      F.headers(),
    ],
    notes: ["Remote entries use serverUrl (no type field)."],
  },
  zed: {
    displayName: "Zed",
    summary: "Configure MCP servers in JSON under the context_servers key.",
    transports: ["stdio", "http", "sse"],
    auth: ["headers"],
    files: [
      {
        path: "<Zed config>/settings.json",
        scope: "global",
        format: "json",
        key: "context_servers",
        note: "macOS/Windows: .../Zed/settings.json; Linux: .../zed/settings.json.",
      },
      { path: ".zed/settings.json", scope: "project", format: "json", key: "context_servers" },
    ],
    fields: [
      field("source", '"custom"', "Set to 'custom' for user-defined servers."),
      F.command(),
      F.args(),
      F.env(),
      field("type", '"http" | "sse"', "Remote transport type."),
      F.url(),
      F.headers(),
    ],
    notes: ["Servers live under context_servers; entries set source: \"custom\"."],
  },
};

// ---------------------------------------------------------------------------
// Skills dataset — from vercel-labs/skills (src/agents.ts).
// project / global are skill directories; <name>/SKILL.md is appended.
// ---------------------------------------------------------------------------
type SkillEntry = {
  displayName: string;
  project: string;
  global?: string;
  note?: string;
};

const SKILLS: Record<string, SkillEntry> = {
  "aider-desk": { displayName: "AiderDesk", project: ".aider-desk/skills", global: "~/.aider-desk/skills" },
  amp: { displayName: "Amp", project: ".agents/skills", global: "~/.config/agents/skills" },
  antigravity: { displayName: "Antigravity", project: ".agents/skills", global: "~/.gemini/antigravity/skills" },
  "antigravity-cli": { displayName: "Antigravity CLI", project: ".agents/skills", global: "~/.gemini/antigravity-cli/skills" },
  astrbot: { displayName: "AstrBot", project: "data/skills", global: "~/.astrbot/data/skills" },
  "autohand-code": { displayName: "Autohand Code CLI", project: ".autohand/skills", global: "~/.autohand/skills" },
  augment: { displayName: "Augment", project: ".augment/skills", global: "~/.augment/skills" },
  bob: { displayName: "IBM Bob", project: ".bob/skills", global: "~/.bob/skills" },
  openclaw: {
    displayName: "OpenClaw",
    project: "skills",
    global: "~/.openclaw/skills",
    note: "Global path falls back to ~/.clawdbot/skills then ~/.moltbot/skills.",
  },
  cline: { displayName: "Cline", project: ".agents/skills", global: "~/.agents/skills" },
  "codearts-agent": { displayName: "CodeArts Agent", project: ".codeartsdoer/skills", global: "~/.codeartsdoer/skills" },
  codebuddy: { displayName: "CodeBuddy", project: ".codebuddy/skills", global: "~/.codebuddy/skills" },
  codemaker: { displayName: "Codemaker", project: ".codemaker/skills", global: "~/.codemaker/skills" },
  codestudio: { displayName: "Code Studio", project: ".codestudio/skills", global: "~/.codestudio/skills" },
  "command-code": { displayName: "Command Code", project: ".commandcode/skills", global: "~/.commandcode/skills" },
  continue: { displayName: "Continue", project: ".continue/skills", global: "~/.continue/skills" },
  cortex: { displayName: "Cortex Code", project: ".cortex/skills", global: "~/.snowflake/cortex/skills" },
  crush: { displayName: "Crush", project: ".crush/skills", global: "~/.config/crush/skills" },
  deepagents: { displayName: "Deep Agents", project: ".agents/skills", global: "~/.deepagents/agent/skills" },
  devin: { displayName: "Devin for Terminal", project: ".devin/skills", global: "~/.config/devin/skills" },
  dexto: { displayName: "Dexto", project: ".agents/skills", global: "~/.agents/skills" },
  droid: { displayName: "Droid", project: ".factory/skills", global: "~/.factory/skills" },
  eve: { displayName: "Eve", project: "agent/skills", note: "Project-only; skills are stored as flat <name>.md files." },
  firebender: { displayName: "Firebender", project: ".agents/skills", global: "~/.firebender/skills" },
  forgecode: { displayName: "ForgeCode", project: ".forge/skills", global: "~/.forge/skills" },
  "gemini-cli": { displayName: "Gemini CLI", project: ".agents/skills", global: "~/.gemini/skills" },
  "github-copilot": { displayName: "GitHub Copilot", project: ".agents/skills", global: "~/.copilot/skills" },
  goose: { displayName: "Goose", project: ".goose/skills", global: "~/.config/goose/skills" },
  "hermes-agent": { displayName: "Hermes Agent", project: ".hermes/skills", global: "~/.hermes/skills" },
  "inference-sh": { displayName: "inference.sh", project: ".inferencesh/skills", global: "~/.inferencesh/skills" },
  "iflow-cli": { displayName: "iFlow CLI", project: ".iflow/skills", global: "~/.iflow/skills" },
  jazz: { displayName: "Jazz", project: ".jazz/skills", global: "~/.jazz/skills" },
  junie: { displayName: "Junie", project: ".junie/skills", global: "~/.junie/skills" },
  kilo: { displayName: "Kilo Code", project: ".kilocode/skills", global: "~/.kilocode/skills" },
  "kimi-code-cli": { displayName: "Kimi Code CLI", project: ".agents/skills", global: "~/.agents/skills" },
  "kiro-cli": {
    displayName: "Kiro CLI",
    project: ".kiro/skills",
    global: "~/.kiro/skills",
    note: 'Custom agents must add "resources": ["skill://.kiro/skills/**/SKILL.md"] to .kiro/agents/<agent>.json.',
  },
  kode: { displayName: "Kode", project: ".kode/skills", global: "~/.kode/skills" },
  lingma: { displayName: "Lingma", project: ".lingma/skills", global: "~/.lingma/skills" },
  loaf: { displayName: "Loaf", project: ".agents/skills", global: "~/.agents/skills" },
  mcpjam: { displayName: "MCPJam", project: ".mcpjam/skills", global: "~/.mcpjam/skills" },
  "mistral-vibe": { displayName: "Mistral Vibe", project: ".vibe/skills", global: "~/.vibe/skills" },
  moxby: { displayName: "Moxby", project: ".moxby/skills", global: "~/.moxby/skills" },
  mux: { displayName: "Mux", project: ".mux/skills", global: "~/.mux/skills" },
  neovate: { displayName: "Neovate", project: ".neovate/skills", global: "~/.neovate/skills" },
  opencode: { displayName: "OpenCode", project: ".agents/skills", global: "~/.config/opencode/skills" },
  openhands: { displayName: "OpenHands", project: ".openhands/skills", global: "~/.openhands/skills" },
  ona: { displayName: "Ona", project: ".ona/skills", global: "~/.ona/skills" },
  pi: { displayName: "Pi", project: ".pi/skills", global: "~/.pi/agent/skills" },
  qoder: { displayName: "Qoder", project: ".qoder/skills", global: "~/.qoder/skills" },
  "qoder-cn": { displayName: "Qoder CN", project: ".qoder/skills", global: "~/.qoder-cn/skills" },
  "qwen-code": { displayName: "Qwen Code", project: ".qwen/skills", global: "~/.qwen/skills" },
  replit: { displayName: "Replit", project: ".agents/skills", global: "~/.config/agents/skills" },
  reasonix: { displayName: "Reasonix", project: ".reasonix/skills", global: "~/.reasonix/skills" },
  rovodev: { displayName: "Rovo Dev", project: ".rovodev/skills", global: "~/.rovodev/skills" },
  roo: { displayName: "Roo Code", project: ".roo/skills", global: "~/.roo/skills" },
  "tabnine-cli": { displayName: "Tabnine CLI", project: ".tabnine/agent/skills", global: "~/.tabnine/agent/skills" },
  terramind: { displayName: "Terramind", project: ".terramind/skills", global: "~/.terramind/skills" },
  tinycloud: { displayName: "Tinycloud", project: ".tinycloud/skills", global: "~/.tinycloud/skills" },
  trae: { displayName: "Trae", project: ".trae/skills", global: "~/.trae/skills" },
  "trae-cn": { displayName: "Trae CN", project: ".trae/skills", global: "~/.trae-cn/skills" },
  warp: { displayName: "Warp", project: ".agents/skills", global: "~/.agents/skills" },
  windsurf: { displayName: "Windsurf", project: ".windsurf/skills", global: "~/.codeium/windsurf/skills" },
  zed: { displayName: "Zed", project: ".agents/skills", global: "~/.agents/skills" },
  zencoder: { displayName: "Zencoder", project: ".zencoder/skills", global: "~/.zencoder/skills" },
  zenflow: { displayName: "Zenflow", project: ".zencoder/skills", global: "~/.zencoder/skills" },
  pochi: { displayName: "Pochi", project: ".pochi/skills", global: "~/.pochi/skills" },
  promptscript: { displayName: "PromptScript", project: ".agents/skills", note: "Global install not supported." },
  adal: { displayName: "AdaL", project: ".adal/skills", global: "~/.adal/skills" },
};

// Skill feature compatibility (vercel-labs/skills README matrix). Explicit Yes/No only.
const SKILL_CAPS: Record<string, Row[]> = {
  opencode: [cap("allowed-tools", "supported"), cap("context: fork", "unsupported"), cap("Hooks", "unsupported")],
  openhands: [cap("allowed-tools", "supported"), cap("context: fork", "unsupported"), cap("Hooks", "unsupported")],
  cline: [cap("allowed-tools", "supported"), cap("context: fork", "unsupported"), cap("Hooks", "supported")],
  codebuddy: [cap("allowed-tools", "supported"), cap("context: fork", "unsupported"), cap("Hooks", "unsupported")],
  "command-code": [cap("allowed-tools", "supported"), cap("context: fork", "unsupported"), cap("Hooks", "unsupported")],
  "kiro-cli": [cap("allowed-tools", "unsupported"), cap("context: fork", "unsupported"), cap("Hooks", "supported")],
  antigravity: [cap("allowed-tools", "supported"), cap("context: fork", "unsupported"), cap("Hooks", "unsupported")],
  roo: [cap("allowed-tools", "supported"), cap("context: fork", "unsupported"), cap("Hooks", "unsupported")],
  "github-copilot": [cap("allowed-tools", "supported"), cap("context: fork", "unsupported"), cap("Hooks", "unsupported")],
  amp: [cap("allowed-tools", "supported"), cap("context: fork", "unsupported"), cap("Hooks", "unsupported")],
  openclaw: [cap("allowed-tools", "supported"), cap("context: fork", "unsupported"), cap("Hooks", "unsupported")],
  neovate: [cap("allowed-tools", "supported"), cap("context: fork", "unsupported"), cap("Hooks", "unsupported")],
  pi: [cap("allowed-tools", "supported"), cap("context: fork", "unsupported"), cap("Hooks", "unsupported")],
  qoder: [cap("allowed-tools", "supported"), cap("context: fork", "unsupported"), cap("Hooks", "unsupported")],
  zencoder: [cap("allowed-tools", "unsupported"), cap("context: fork", "unsupported"), cap("Hooks", "unsupported")],
};

// Hand-authored clients we must never overwrite.
const HAND_AUTHORED = new Set(["cursor", "claude-code", "codex"]);

// ---------------------------------------------------------------------------
// Emit
// ---------------------------------------------------------------------------
function skillsSurface(entry: SkillEntry, id: string): Table {
  const files: Row[] = [
    { path: `${entry.project}/<name>/SKILL.md`, scope: "project", format: "markdown" },
  ];
  if (entry.global) {
    files.push({ path: `${entry.global}/<name>/SKILL.md`, scope: "global", format: "markdown" });
  }
  const notes = ["Skill discovery paths from the open skills CLI (vercel-labs/skills)."];
  if (entry.note) notes.push(entry.note);

  const table: Table = {
    status: "supported",
    summary: "SKILL.md skills following the open Agent Skills standard.",
    invocation: ["/skill-name"],
    notes,
    files,
    fields: [
      field("name", "string", "Skill identifier (required by the Agent Skills standard).", true),
      field("description", "string", "What the skill does and when to use it.", true),
    ],
  };
  const caps = SKILL_CAPS[id];
  if (caps) table.capabilities = caps;
  return table;
}

function mcpSurface(entry: McpEntry): Table {
  const table: Table = {
    status: "supported",
    summary: entry.summary,
  };
  if (entry.transports.length) table.transports = entry.transports;
  if (entry.auth.length) table.auth = entry.auth;
  if (entry.notes && entry.notes.length) table.notes = entry.notes;
  table.files = entry.files;
  table.fields = entry.fields;
  return table;
}

const ids = new Set<string>([...Object.keys(MCP), ...Object.keys(SKILLS)]);
let wrote = 0;
let skipped = 0;

for (const id of [...ids].sort()) {
  if (HAND_AUTHORED.has(id)) continue;

  const meta = META[id] ?? {};
  const name = meta.name ?? MCP[id]?.displayName ?? SKILLS[id]?.displayName ?? id;

  const clientTable: Table = { name };
  if (meta.type) clientTable.type = meta.type;
  if (meta.vendor) clientTable.vendor = meta.vendor;
  if (meta.description) clientTable.description = meta.description;
  if (meta.homepage) clientTable.homepage = meta.homepage;
  if (meta.docs) clientTable.docs = meta.docs;

  const tally = (result: "wrote" | "skip") => {
    if (result === "wrote") wrote++;
    else skipped++;
  };

  tally(writeIfAbsent(`${id}/client.toml`, clientTable));
  const mcp = MCP[id];
  if (mcp) tally(writeIfAbsent(`${id}/mcp.toml`, mcpSurface(mcp)));
  const skills = SKILLS[id];
  if (skills) tally(writeIfAbsent(`${id}/skills.toml`, skillsSurface(skills, id)));
}

console.log(`Import complete: wrote ${wrote} file(s), skipped ${skipped} existing file(s).`);
console.log(`Clients in datasets: ${ids.size} (MCP: ${Object.keys(MCP).length}, Skills: ${Object.keys(SKILLS).length}).`);
