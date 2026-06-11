#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const envPath = path.resolve(process.argv[2] ?? ".env.local");
const target = process.argv[3] ?? "production";
const keys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_AUTH_GOOGLE_ENABLED",
  "NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN",
  "FIGMA_ACCESS_TOKEN",
];

if (!existsSync(envPath)) {
  console.error(`Missing env file: ${envPath}`);
  console.error("Create it from env.example, then fill in Supabase values.");
  process.exit(1);
}

const env = parseEnvFile(readFileSync(envPath, "utf8"));
const missing = keys.slice(0, 2).filter((key) => !env[key]);

if (missing.length > 0) {
  console.error(`Missing required keys in ${envPath}: ${missing.join(", ")}`);
  process.exit(1);
}

for (const key of keys) {
  const value = env[key];
  if (!value) continue;

  const result = spawnSync("vercel", ["env", "add", key, target], {
    input: `${value}\n`,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });

  const output = `${result.stdout}${result.stderr}`;
  if (result.status !== 0) {
    if (output.includes("already exists")) {
      console.log(`${key}: already exists for ${target}. Remove it in Vercel first if you need to replace it.`);
      continue;
    }

    console.error(output.trim());
    process.exit(result.status ?? 1);
  }

  console.log(`${key}: added to ${target}`);
}

console.log("Done. Run `vercel deploy --prod --yes` to redeploy with the new environment variables.");

function parseEnvFile(contents) {
  const result = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}
