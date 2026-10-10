import { GRAPH, LIVE_NODES } from "@/content/graph";
import {
  ExtractionSchema,
  LEVEL_RUBRIC,
  SolutionSchema,
  type Extraction,
  type Solution,
} from "./types";

/**
 * Two Cline SDK agent jobs. Both are read-only and finish by calling ONE tool whose
 * output is only a SUGGESTION: code (pipeline.ts) re-checks anchors, re-derives the
 * level, and requires two independent blind solves before anything is "verified".
 */

/**
 * Backend selection. NVIDIA NIM is the default when NIM_API_KEY is set (QBANK_PROVIDER=nim);
 * QBANK_PROVIDER=gemini or =cline selects the others. All speak the OpenAI-compatible protocol.
 * A model list is comma-separated; a model whose quota is spent is skipped for the rest of the run.
 */
interface Backend { key?: string; baseUrl: string; models: string[] }
const list = (s?: string) => (s ?? "").split(",").map((m) => m.trim()).filter(Boolean);
const NIM_DEFAULT_MODELS = "nvidia/nemotron-3-super-120b-a12b,nvidia/nemotron-3-ultra-550b-a55b,openai/gpt-oss-20b";

export function backend(env: Record<string, string | undefined> = process.env): Backend & { name: string } {
  const want = env.QBANK_PROVIDER ?? (env.NIM_API_KEY ? "nim" : env.QBANK_API_KEY ? "gemini" : "cline");
  if (want === "nim") {
    return { name: "nim", key: env.NIM_API_KEY, baseUrl: env.NIM_BASE_URL ?? "https://integrate.api.nvidia.com/v1", models: list(env.NIM_MODEL ?? NIM_DEFAULT_MODELS) };
  }
  if (want === "gemini") {
    return { name: "gemini", key: env.QBANK_API_KEY, baseUrl: env.QBANK_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta/openai/", models: list(env.QBANK_MODEL) };
  }
  return { name: "cline", key: env.CLINE_API_KEY, baseUrl: env.CLINE_BASE_URL ?? "https://api.cline.bot/api/v1", models: list(env.MENTOR_MODEL) };
}

const dead = new Set<string>();
const apiKey = () => backend().key;
const baseUrl = () => backend().baseUrl;
const liveModels = () => backend().models.filter((m) => !dead.has(m));
/** `variant` spreads independent calls over different models so one model's blind spot cannot confirm itself. */
const model = (variant = 0) => {
  const l = liveModels();
  return l.length ? l[variant % l.length] : undefined;
};

export function isQbankAgentConfigured(): boolean {
  const b = backend();
  return Boolean(b.key && b.models.length);
}

const NODE_LIST = LIVE_NODES.map((n) => `- ${n}: ${GRAPH[n].name} (${GRAPH[n].blurb})`).join("\n");

const EXTRACT_PROMPT = `You build a JEE practice bank from OFFICIAL past-paper text. You only transcribe; you never invent.
Topic map (use ONLY these node ids):
${NODE_LIST}

Rules:
- Three kinds are allowed: "single" (4 options, one correct), "multi" (4-6 options, two or more correct — common in JEE Advanced) and "numeric" (no options; a number to enter, with a tolerance).
- Pick only questions that belong to one node above, are fully understandable from the text (no missing diagram) and whose text is not garbled.
- "anchor" MUST be copied character-for-character from the source (30-80 chars from the start of the question). If you cannot, skip the question.
- Write all maths in LaTeX between $...$ (for example $\\alpha^2$, $\\hat{x}$), not as unicode math letters.
- Fill only the answer field for the kind: answerIndex (single), answerIndices (multi), answerValue+tolerance (numeric).
- Work out the answer yourself and write the derivation. Do not guess; skip if unsure.
- Report conceptsUsed (distinct concepts) and steps honestly; the level is re-derived by code.
${LEVEL_RUBRIC}
Call submit_questions exactly once. An empty list is a valid answer.`;

const SOLVE_PROMPT = `You are a careful JEE tutor. Solve the question independently, step by step, then call submit_solution exactly once with the answer:
- kind "single": answerIndex (0-5) of the one correct option.
- kind "multi": answerIndices, every correct option.
- kind "numeric": answerValue, the number to enter.
If nothing fits, say so in the derivation and give your best value.`;

export interface AgentRun<T> {
  value: T | null;
  error?: string;
  usage?: { inputTokens: number; outputTokens: number };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const TRANSIENT = /too many requests|429|503|unavailable|overloaded|high demand|timeout|econnreset/i;

/** Retries only transient provider errors (rate limit / overload) with exponential backoff. */
async function runOnce<T>(
  system: string, toolName: string, toolDescription: string, schema: unknown, prompt: string,
  parse: (raw: unknown) => T | null, timeoutMs: number, attempts = 4, variant = 0
): Promise<AgentRun<T>> {
  let last: AgentRun<T> = { value: null, error: "not run" };
  for (let i = 0; i < attempts; i++) {
    const m = model(variant);
    if (!m) return { value: null, error: "all configured models are out of quota" };
    last = await runAttempt(m, system, toolName, toolDescription, schema, prompt, parse, timeoutMs);
    if (last.value || !last.error) return last;
    if (/quota/i.test(last.error)) { dead.add(m); i--; continue; }
    if (!TRANSIENT.test(last.error)) return last;
    await sleep(4000 * 2 ** i);
  }
  return last;
}

async function runAttempt<T>(
  modelId: string,
  system: string,
  toolName: string,
  toolDescription: string,
  schema: unknown,
  prompt: string,
  parse: (raw: unknown) => T | null,
  timeoutMs: number
): Promise<AgentRun<T>> {
  if (!isQbankAgentConfigured()) return { value: null, error: "agent not configured (set NIM_API_KEY, or QBANK_PROVIDER + keys)" };
  let captured: unknown = null;
  // Lazy import: the SDK is ESM-only, and this keeps offline code paths SDK-free.
  const { Agent, createTool } = await import("@cline/sdk");
  const finish = createTool({
    name: toolName,
    description: toolDescription,
    inputSchema: schema as never,
    lifecycle: { completesRun: true },
    async execute(input: unknown) {
      captured = input;
      return input;
    },
  } as never);
  try {
    const agent = new Agent({
      providerId: "openai-compatible",
      modelId,
      apiKey: apiKey()!,
      baseUrl: baseUrl(),
      systemPrompt: system,
      tools: [finish],
      maxIterations: 4,
    } as never);
    const run = agent.run(prompt as never);
    const timeout = new Promise<"timeout">((r) => setTimeout(() => r("timeout"), timeoutMs));
    const winner = await Promise.race([run, timeout]);
    if (winner === "timeout") {
      agent.abort("timeout");
      return { value: null, error: "agent timeout" };
    }
    const w = winner as { status?: string; error?: { message?: string } };
    if (w.status === "failed") {
      const msg = w.error?.message ?? "unknown";
      // The SDK reports a spent daily quota only as "Too Many Requests"; ask the API directly.
      if (/too many requests|429/i.test(msg) && (await quotaSpent(modelId))) return { value: null, error: `quota exhausted for ${modelId}` };
      return { value: null, error: `provider error: ${msg}` };
    }
    const usage = {
      inputTokens: (winner as { usage: { inputTokens: number } }).usage.inputTokens,
      outputTokens: (winner as { usage: { outputTokens: number } }).usage.outputTokens,
    };
    const value = parse(captured);
    if (value) return { value, usage };
    const why = captured === null ? "the model never called the finishing tool" : validationReason(schema, captured);
    return { value: null, error: `output rejected by validation: ${why}`, usage };
  } catch (e) {
    return { value: null, error: (e as Error).message.slice(0, 200) };
  }
}

export function extractQuestions(chunk: string, paperLabel: string): Promise<AgentRun<Extraction>> {
  return runOnce<Extraction>(
    EXTRACT_PROMPT,
    "submit_questions",
    "FINISH: submit the questions you transcribed from this chunk (possibly none).",
    ExtractionSchema,
    `Source: ${paperLabel}\n<source_text>\n${chunk.slice(0, 12000)}\n</source_text>`,
    (raw) => {
      const r = ExtractionSchema.safeParse(raw);
      return r.success ? r.data : null;
    },
    150_000
  );
}

/** Blind solve: the proposed answer is NOT shown, so agreement is real evidence. */
export function solveBlind(stem: string, options: string[], variant = 0): Promise<AgentRun<Solution>> {
  const body = `${stem}\n${options.map((o, i) => `(${String.fromCharCode(65 + i)}) ${o}`).join("\n")}`;
  return runOnce<Solution>(
    SOLVE_PROMPT,
    "submit_solution",
    "FINISH: submit the index (0-3) of the correct option and your derivation.",
    SolutionSchema,
    `<question>\n${body}\n</question>`,
    (raw) => {
      const r = SolutionSchema.safeParse(raw);
      return r.success ? r.data : null;
    },
    90_000,
    4,
    variant
  );
}

function validationReason(schema: unknown, raw: unknown): string {
  const s = schema as { safeParse?: (x: unknown) => { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } } };
  const r = s.safeParse?.(raw);
  const i = r && !r.success ? r.error?.issues[0] : undefined;
  return i ? `${i.path.join(".")}: ${i.message}`.slice(0, 160) : "unknown";
}

async function quotaSpent(modelId: string): Promise<boolean> {
  try {
    const r = await fetch(`${baseUrl().replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: modelId, messages: [{ role: "user", content: "ok" }], max_tokens: 1 }),
    });
    if (r.status !== 429) return false;
    return /quota/i.test(await r.text());
  } catch {
    return false;
  }
}

/** Plain OpenAI-compatible chat call, for vision requests that are not tool-calling jobs. */
export interface ChatMessage {
  role: "system" | "user";
  content: string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;
}
export async function chat(modelId: string, messages: ChatMessage[], maxTokens = 4000): Promise<{ text: string } | { error: string }> {
  const { name } = backend();
  if (name === "nim" && !process.env.NIM_API_KEY) return { error: "no NIM_API_KEY" };
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(`${baseUrl().replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: modelId, messages, max_tokens: maxTokens }),
      });
      if (r.status === 429) return { error: `quota exhausted for ${modelId}` };
      if (!r.ok) return { error: `provider error ${r.status}` };
      const j = (await r.json()) as { choices?: { message?: { content?: string } }[] };
      return { text: j.choices?.[0]?.message?.content ?? "" };
    } catch (e) {
      await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt));
    }
  }
  return { error: "provider unreachable" };
}

/** QBANK_VISION_MODEL is a comma-separated list; the first available is used. */
export function visionModel(): string | undefined {
  return (process.env.QBANK_VISION_MODEL ?? "").split(",").map((s) => s.trim()).filter(Boolean)[0];
}
