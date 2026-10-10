/**
 * Question-bank CLI.   npx tsx scripts/qbank.mts <command>
 *   harvest [maxChunks=4] [fromYear|-] [main|advanced]   find new questions (needs NIM_API_KEY)
 *   coverage                           servable questions per node and level
 *   review                             list questions waiting for a human
 *   approve <id> <your-name>           mark a question approved after YOU re-solved it
 */
import { readFileSync, existsSync } from "node:fs";
import { LIVE_NODES } from "../content/graph";
import { extractQuestions, isQbankAgentConfigured, solveBlind } from "../lib/qbank/agent";
import { harvest } from "../lib/qbank/harvest";
import { configuredPapers, discoverPapers, type ConfiguredSource } from "../lib/qbank/sources";
import type { Tier } from "../lib/qbank/types";
import { coverage } from "../lib/qbank/select";
import { loadBank, saveBank } from "../lib/qbank/store";

// Load app/.env.local without adding a dependency.
if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

async function main() {
  const [cmd, a, b, c, d] = process.argv.slice(2);
  const ocr = process.argv.includes("--ocr") || process.env.QBANK_OCR === "true";
  const bank = loadBank();
  if (cmd === "harvest") {
    if (!isQbankAgentConfigured()) {
      console.error("Set NIM_API_KEY (NVIDIA NIM) in app/.env.local first.");
      process.exit(1);
    }
    const extra: ConfiguredSource[] = existsSync("content/qbank-sources.json")
      ? JSON.parse(readFileSync("content/qbank-sources.json", "utf8"))
      : [];
    const discovered = await discoverPapers().catch(() => []);
    const rep = await harvest(bank, {
      maxChunks: Number(a) || 4,
      fromYear: b && b !== "-" ? Number(b) : undefined,
      tier: c as Tier | undefined,
      concurrency: Number(process.env.QBANK_CONCURRENCY) || 6,
      ocr,
      ocrPages: (pages: number[]) => pages.filter((p) => p > 25 && p < 60).slice(0, 12),
      papers: [...discovered, ...configuredPapers(extra)],
      agents: { extract: extractQuestions, solve: solveBlind },
      log: (m) => console.log(m),
      onChunk: (b) => saveBank(b),
    });
    saveBank(bank);
    console.log(`\nadded ${rep.added} from ${rep.chunksTried} chunks; scanned PDFs skipped: ${rep.skippedScanned.length}`);
  } else if (cmd === "coverage") {
    const t = coverage(bank, { SERVE_UNAPPROVED: "true" });
    for (const n of LIVE_NODES) console.log(n.padEnd(14), JSON.stringify(t[n] ?? { A: 0, B: 0, C: 0 }));
    console.log("(counts include `verified`; only `approved` is served in production)");
  } else if (cmd === "review") {
    for (const q of bank.questions.filter((x) => x.status !== "approved")) {
      console.log(`\n[${q.status}] ${q.id} ${q.node} level ${q.level} (${q.source.year} ${q.source.paper})`);
      console.log(q.stem);
      q.options.forEach((o, i) => console.log(`  (${String.fromCharCode(65 + i)}) ${o}`));
      console.log(`  agent answer: ${q.kind === "numeric" ? String(q.answerValue) + (q.unit ?? "") : q.kind === "multi" ? (q.answerIndices ?? []).map((i) => String.fromCharCode(65 + i)).join(",") : q.answer !== null ? String.fromCharCode(65 + q.answer) : "?"}  flags: ${q.flags.join("; ")}`);
    }
  } else if (cmd === "approve") {
    const q = bank.questions.find((x) => x.id === a);
    if (!q || !b) return console.error("usage: approve <id> <your-name>");
    q.status = "approved";
    q.approvedBy = b;
    saveBank(bank);
    console.log(`approved ${q.id}`);
  } else {
    console.log("commands: harvest [maxChunks] [fromYear] | coverage | review | approve <id> <name>");
  }
}
main();
