/**
 * Gate G1 check: does the Cline SDK agent make a REAL model call through the real route?
 *
 *   AI_KEY=<your key> [AI_PROVIDER=nvidia|cline] [AI_MODEL=...] npx tsx scripts/sdk-smoke.mts [photo.jpg]
 *
 * Needs `npm run dev` running. It POSTs to /api/analyze exactly like the photo screen does, with the
 * key supplied the same way the app supplies it (the student's own key). The key is read from the
 * environment, never from a file, and is never printed.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { PROVIDERS, type ProviderId } from "../lib/ai-providers";

const base = process.env.APP_URL ?? "http://localhost:3000";
const provider = (process.env.AI_PROVIDER ?? "nvidia") as ProviderId;
if (!(provider in PROVIDERS)) { console.error(`FAIL: AI_PROVIDER must be one of ${Object.keys(PROVIDERS).join(", ")}`); process.exit(1); }
const apiKey = process.env.AI_KEY;
if (!apiKey) { console.error("FAIL: set AI_KEY=<your API key> (or add it in the app under Settings)."); process.exit(1); }
const model = process.env.AI_MODEL ?? PROVIDERS[provider].defaultModel;
const vision = process.env.AI_VISION ? process.env.AI_VISION === "true" : PROVIDERS[provider].defaultVision;
console.log(`provider=${provider} model=${model} vision=${vision} target=${base}`);

let image: string | undefined;
const file = process.argv[2];
if (file) {
  const ext = path.extname(file).toLowerCase().replace(".", "");
  image = `data:image/${ext === "jpg" ? "jpeg" : ext};base64,${readFileSync(file).toString("base64")}`;
  console.log(`photo=${file} (${Math.round(image.length / 1024)} KB base64)`);
}
const text = file ? "" : "A ball is thrown at 30 degrees above the horizontal with speed 20 m/s. Find the maximum height reached.";

const res = await fetch(`${base}/api/analyze`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ text, image, ai: { provider, apiKey, model, vision } }),
});
if (!res.ok) { console.error(`FAIL: HTTP ${res.status}`); process.exit(1); }
const j = await res.json();
for (const s of j.trace ?? []) console.log(`  [${s.at}ms] ${s.kind}${s.tool ? ` ${s.tool}` : ""}: ${s.detail}`);
console.log("aiStatus:", j.aiStatus, "| usage:", JSON.stringify(j.usage), "| keyword match:", j.match?.node);
console.log("agent:", JSON.stringify(j.agent));
if (j.aiStatus !== "used") { console.error(`FAIL: no validated answer (aiStatus=${j.aiStatus}). Read the trace above.`); process.exit(1); }
console.log("PASS: real model call, tool call captured, output validated by code.");
