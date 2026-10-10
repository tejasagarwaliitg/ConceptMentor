import { NextResponse } from "next/server";
import { z } from "zod";
import { Agent } from "@cline/sdk";
import { MODEL_PATTERN, PROVIDERS, PROVIDER_IDS } from "@/lib/ai-providers";
import { clientKey, rateLimit } from "@/lib/guards";

const Body = z.object({
  provider: z.enum(PROVIDER_IDS),
  apiKey: z.string().min(8).max(300),
  model: z.string().regex(MODEL_PATTERN),
});

/**
 * Settings -> "Test connection". One tiny Cline SDK call with the student's own key.
 * The base URL comes from the server allowlist (never from the client); the key is used for this
 * request only and is never logged, stored or echoed back.
 */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "bad request" }, { status: 400 });
  if (!rateLimit(`test:${clientKey(req.headers)}`, 10).ok) {
    return NextResponse.json({ ok: false, error: "Too many tests. Wait a few minutes." }, { status: 429 });
  }
  const { provider, apiKey, model } = parsed.data;
  const started = Date.now();
  try {
    const agent = new Agent({
      providerId: "openai-compatible",
      modelId: model,
      apiKey,
      baseUrl: PROVIDERS[provider].baseUrl,
      systemPrompt: "Reply with the single word OK.",
      tools: [],
      maxIterations: 1,
    });
    const run = agent.run("Reply with the single word OK.");
    const timeout = new Promise<"timeout">((r) => setTimeout(() => r("timeout"), 25_000));
    const winner = await Promise.race([run, timeout]);
    if (winner === "timeout") {
      agent.abort("timeout");
      return NextResponse.json({ ok: false, error: "The model took longer than 25 seconds to answer." });
    }
    const text = String((winner as { text?: string }).text ?? "").trim();
    return NextResponse.json({ ok: true, ms: Date.now() - started, sample: text.slice(0, 40) });
  } catch (e) {
    // Never echo the key; trim provider messages to something short and safe.
    const msg = (e as Error).message.split(apiKey).join("[key]").slice(0, 160);
    return NextResponse.json({ ok: false, error: msg });
  }
}
