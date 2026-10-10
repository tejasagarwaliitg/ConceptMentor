import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import type { Bank } from "./types";

/** The bank is a reviewable JSON file next to the other content. Override for tests. */
export function bankPath(): string {
  return process.env.QBANK_PATH ?? path.join(process.cwd(), "content", "qbank.json");
}

export function emptyBank(): Bank {
  return { version: 1, questions: [], processed: [] };
}

export function loadBank(file = bankPath()): Bank {
  if (!existsSync(/* turbopackIgnore: true */ file)) return emptyBank();
  const parsed = JSON.parse(readFileSync(/* turbopackIgnore: true */ file, "utf8")) as Bank;
  return parsed.version === 1 ? parsed : emptyBank();
}

export function saveBank(bank: Bank, file = bankPath()): void {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(bank, null, 2) + "\n");
}
