import { Agent } from "@cline/sdk";

import type { NodeId } from "@/lib/types";
import { chooseStuckCard, composeRepair, lookupTools, proposeEntryNode, proposeProbeOrder, type MentorContext } from "./tools";
import {
  validateEntry,
  validateProbeOrder,
  validateRepairOrder,
  validateStuckChoice,
  type ProbeOrder,
  type ProposeEntry,
  type RepairOrder,
  type StuckChoice,
} from "./schemas";

/** Photo intake is interactive and multimodal, and free-tier hosted models are slow and variable, so it gets a longer budget than the 10s text jobs. */
export const INTAKE_TIMEOUT_MS = 45_000;

export type Job = "entry_node" | "probe_order" | "stuck_card" | "repair_order";

export interface TraceStep {
  at: number;
  kind: "tool_call" | "tool_result" | "validation" | "fallback" | "usage";
  tool?: string;
  detail: string;
}

export interface MentorResult<T> {
  ok: boolean;
  value: T | null;
  /** what the engine/UI did as a result: accepted | rejected-by-validation | fallback */
  consequence: "accepted" | "rejected_by_validation" | "fallback";
  trace: TraceStep[];
  usage?: { inputTokens: number; outputTokens: number; totalCost?: number };
}

const SYSTEM_PROMPT = `You calibrate a study path for a JEE student. You NEVER talk to the student.
You only look things up with the read-only tools and then call exactly ONE finishing tool with a structured suggestion.
Rules: you cannot grade, cannot change progress, cannot produce links. Pick only from what the tools return.
Keep every "reason" under 160 characters, neutral and kind. Never use the words weak, fail, dumb, stupid.`;

/** Credentials + model for one agent run. Comes from the student's own key, or from the server env. */
export interface AgentConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  vision: boolean;
}

/** Server-side default (env). Used by /api/mentor; the photo intake uses the student's own key instead. */
export function envAgentConfig(): AgentConfig | null {
  if (!process.env.CLINE_API_KEY || !process.env.MENTOR_MODEL || process.env.MENTOR_DISABLED === "true") return null;
  return {
    apiKey: process.env.CLINE_API_KEY,
    baseUrl: process.env.CLINE_BASE_URL ?? "https://api.cline.bot/api/v1",
    model: process.env.MENTOR_MODEL,
    vision: process.env.MENTOR_VISION === "true",
  };
}

export function isAgentConfigured(): boolean {
  return envAgentConfig() !== null;
}

type MentorTool = ReturnType<typeof lookupTools>[number] | typeof proposeEntryNode | typeof proposeProbeOrder | typeof chooseStuckCard | typeof composeRepair;

function buildAgent(tools: MentorTool[], cfg: AgentConfig): Agent {
  return new Agent({
    providerId: "openai-compatible",
    modelId: cfg.model,
    apiKey: cfg.apiKey,
    baseUrl: cfg.baseUrl,
    systemPrompt: SYSTEM_PROMPT,
    tools,
    maxIterations: 6,
  });
}

/**
 * Cline SDK multimodal input: an AgentMessage whose content parts are
 * `{type:"text"}` and `{type:"image", image, mediaType}` (not OpenAI `image_url`).
 * Falls back to plain text when there is no usable image or vision is off.
 */
export function withImage(prompt: string, image: string | undefined, vision: boolean): string | Array<Record<string, unknown>> {
  if (!image || !vision) return prompt;
  const m = /^data:(image\/(?:png|jpeg|webp|gif));base64,(.+)$/.exec(image);
  if (!m) return prompt;
  return [
    {
      id: `intake-${Date.now()}`,
      role: "user",
      createdAt: Date.now(),
      content: [
        { type: "text", text: prompt },
        { type: "image", image: m[2], mediaType: m[1] },
      ],
    },
  ];
}

async function runJob<T>(
  job: Job,
  ctx: MentorContext,
  finishing: MentorTool,
  prompt: string,
  validate: (raw: unknown) => T | null,
  image: string | undefined,
  timeoutMs: number,
  cfg: AgentConfig | null
): Promise<MentorResult<T>> {
  const trace: TraceStep[] = [];
  const t0 = Date.now();
  const log = (kind: TraceStep["kind"], detail: string, tool?: string) =>
    trace.push({ at: Date.now() - t0, kind, tool, detail });

  if (!cfg) {
    log("fallback", "no API key configured: using the deterministic default");
    return { ok: false, value: null, consequence: "fallback", trace };
  }

  let captured: unknown = null;
  try {
    const agent = buildAgent([...lookupTools(ctx), finishing], cfg);
    agent.subscribe((event) => {
      if (event.type === "tool-started") {
        log("tool_call", JSON.stringify(event.toolCall.input ?? {}).slice(0, 300), event.toolCall.toolName);
        if (event.toolCall.toolName === finishing.name) captured = event.toolCall.input;
      }
      if (event.type === "usage-updated") {
        log("usage", `in=${event.usage.inputTokens} out=${event.usage.outputTokens}`);
      }
    });

    const input = withImage(prompt, image, cfg.vision);
    if (image && !cfg.vision) log("fallback", "image ignored: vision is off for this model (turn it on in Settings if the model accepts images)");
    else if (image) log("tool_call", "image attached to the request (vision model)");
    const run = agent.run(input as never);
    const timeout = new Promise<"timeout">((r) => setTimeout(() => r("timeout"), timeoutMs));
    const winner = await Promise.race([run, timeout]);
    if (winner === "timeout") {
      agent.abort("timeout");
      log("fallback", `agent exceeded ${Math.round(timeoutMs / 1000)}s: using the deterministic default`);
      return { ok: false, value: null, consequence: "fallback", trace };
    }
    const usage = {
      inputTokens: winner.usage.inputTokens,
      outputTokens: winner.usage.outputTokens,
      totalCost: (winner.usage as { totalCost?: number }).totalCost,
    };

    const value = validate(captured);
    if (!value) {
      log("validation", `rejected: ${JSON.stringify(captured)?.slice(0, 200)}`);
      return { ok: false, value: null, consequence: "rejected_by_validation", trace, usage };
    }
    log("validation", `accepted ${job}`);
    return { ok: true, value, consequence: "accepted", trace, usage };
  } catch (e) {
    log("fallback", `agent error: ${(e as Error).message.slice(0, 160)}`);
    return { ok: false, value: null, consequence: "fallback", trace };
  }
}

/**
 * Job 0: map a real exam question (text, optionally with its photo) to a graph node.
 * The candidate list comes from the deterministic matcher, so the model can only
 * pick among nodes the engine already believes are plausible. If the model has no
 * image support the text alone is used, and `imageUsed` reports which path ran.
 */
export function suggestEntryNode(
  ctx: MentorContext,
  questionText: string,
  image?: string,
  candidates: string[] = [],
  cfg: AgentConfig | null = envAgentConfig()
): Promise<MentorResult<ProposeEntry>> {
  const list = candidates.length ? candidates.join(", ") : "(no candidates given: use get_node to look up a topic)";
  const photoNote = image ? "A photo of the question is attached: read it, the text below is only an OCR guess and may be wrong or empty.\n" : "";
  const prompt = `A student got this exam question wrong. Call propose_entry_node right away with the ONE topic it belongs to (no other tool call is needed).\n${photoNote}Candidates: ${list}.\nQuestion: <student_text>${questionText.slice(0, 1800)}</student_text>`;
  return runJob<ProposeEntry>(
    "entry_node",
    ctx,
    proposeEntryNode,
    prompt,
    (raw) => validateEntry(raw, candidates.length ? (candidates as NodeId[]) : null),
    image,
    // A student is waiting on the photo screen and a vision/reasoning model is slower than the text jobs.
    INTAKE_TIMEOUT_MS,
    cfg
  );
}

export function suggestProbeOrder(ctx: MentorContext, nodeId: string, attempt: string | null) {
  const prompt = `Topic ${nodeId}. Call get_node for it, then propose_probe_order with its prerequisites in the order they should be checked.${
    attempt ? ` The student's note about their attempt: <student_text>${attempt.slice(0, 500)}</student_text>` : ""
  }`;
  return runJob<ProbeOrder>("probe_order", ctx, proposeProbeOrder, prompt, validateProbeOrder, undefined, 10_000, envAgentConfig());
}

export function suggestStuckCard(ctx: MentorContext, nodeId: string, attempt: string | null) {
  const prompt = `The student finished the prerequisite check for ${nodeId} with no older weakness found. Call get_student_summary, then choose_stuck_card.${
    attempt ? ` Their note: <student_text>${attempt.slice(0, 500)}</student_text>` : ""
  }`;
  return runJob<StuckChoice>("stuck_card", ctx, chooseStuckCard, prompt, validateStuckChoice, undefined, 10_000, envAgentConfig());
}

export function suggestRepairOrder(ctx: MentorContext, nodeId: string, lowData: boolean) {
  const prompt = `Order the repair options for topic ${nodeId}. Low data mode: ${lowData}. If low data is true, do not include video. Call compose_repair.`;
  return runJob<RepairOrder>("repair_order", ctx, composeRepair, prompt, validateRepairOrder, undefined, 10_000, envAgentConfig());
}
