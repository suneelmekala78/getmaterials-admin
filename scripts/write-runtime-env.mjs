/**
 * Write Amplify env vars into .env.production so Next.js can load them.
 * Values are quoted and $ is escaped — unquoted # would truncate the secret
 * (e.g. uK8@pL2#...) and $VAR would be expanded away.
 */
import fs from "node:fs";

const KEYS = [
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "AUTH_SECRET",
  "AUTH_URL",
  "JWT_SECRET",
  "API_INTERNAL_URL",
  "NODE_ENV",
];

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

for (const key of KEYS) add(key, process.env[key]);
for (const key of Object.keys(process.env).sort()) {
  if (key.startsWith("NEXT_PUBLIC_")) add(key, process.env[key]);
}

if (!seen.has("AUTH_SECRET") && process.env.NEXTAUTH_SECRET) {
  add("AUTH_SECRET", process.env.NEXTAUTH_SECRET);
}
if (!seen.has("AUTH_URL") && process.env.NEXTAUTH_URL) {
  add("AUTH_URL", process.env.NEXTAUTH_URL);
}
if (!seen.has("JWT_SECRET")) {
  add("JWT_SECRET", process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET);
}

fs.writeFileSync(".env.production", lines.join("\n") + "\n");
console.log(
  `Wrote .env.production (${lines.length} keys): ${[...seen].join(", ")}`,
);
