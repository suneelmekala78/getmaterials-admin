/**
 * Write Amplify env vars into .env.production so Next.js can load them.
 * Values are quoted and $ is escaped — unquoted # would truncate the secret
 * (e.g. uK8@pL2#...) and $VAR would be expanded away.
 *
 * Optional argument: path to a KEY=VALUE file (Docker build secret). When the
 * file exists it is used instead of process.env.
 */
import fs from "node:fs";

const KEYS = [
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "AUTH_SECRET",
  "AUTH_URL",
  "JWT_SECRET",
  "INTERNAL_API_SECRET",
  "API_INTERNAL_URL",
  "NODE_ENV",
];

function readEnvFile(file) {
  const env = {};
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim().replace(/^export\s+/, "");
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const at = line.indexOf("=");
    const key = line.slice(0, at).trim();
    let value = line.slice(at + 1).trim();
    if (value.length >= 2 && value[0] === value.at(-1) && `"'`.includes(value[0])) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const source = process.argv[2];
const env = source && fs.existsSync(source) ? readEnvFile(source) : process.env;

function encode(value) {
  return `"${String(value)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\$/g, "\\$")}"`;
}

const seen = new Set();
const lines = [];

function add(key, value) {
  if (!key || value == null || value === "" || seen.has(key)) return;
  seen.add(key);
  lines.push(`${key}=${encode(value)}`);
}

for (const key of KEYS) add(key, env[key]);
for (const key of Object.keys(env).sort()) {
  if (key.startsWith("NEXT_PUBLIC_")) add(key, env[key]);
}

if (!seen.has("AUTH_SECRET") && env.NEXTAUTH_SECRET) {
  add("AUTH_SECRET", env.NEXTAUTH_SECRET);
}
if (!seen.has("AUTH_URL") && env.NEXTAUTH_URL) {
  add("AUTH_URL", env.NEXTAUTH_URL);
}
if (!seen.has("JWT_SECRET")) {
  add("JWT_SECRET", env.AUTH_SECRET || env.NEXTAUTH_SECRET);
}

fs.writeFileSync(".env.production", lines.join("\n") + "\n");
console.log(
  `Wrote .env.production (${lines.length} keys): ${[...seen].join(", ")}`,
);
