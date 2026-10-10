import { createTool } from "@cline/sdk";
import { z } from "zod";
import { GRAPH, connectedLaterCount } from "@/content/graph";
import type { NodeId } from "@/lib/types";
import { NodeIdSchema, ProbeOrderSchema, ProposeEntrySchema, RepairOrderSchema, StuckChoiceSchema } from "./schemas";

/**
 * Tools for the mentor agent. Rules (idea.md 11.2):
 *  - lookup tools are READ-ONLY and return reviewed content only
 *  - ONE completion tool per job (lifecycle.completesRun) returns a *suggestion*
 *  - there is NO tool that grades, changes a student's progress, or returns a URL
 */

export interface MentorContext {
  /** minimal, structured, non-identifying summary (11.4) */
  summary: {
    entry: NodeId;
    probedStates: Partial<Record<NodeId, string>>;
    tone: { mentor: string; register: string; language: string };
  };
}

export function lookupTools(ctx: MentorContext) {
  const getNode = createTool({
    name: "get_node",
    description:
      "Look up one topic on the learning map: its name, prerequisites (in the builder's suspect order) and how many later topics it connects to. Read-only.",
    inputSchema: z.object({ nodeId: NodeIdSchema }),
    async execute({ nodeId }) {
      const n = GRAPH[nodeId];
      return {
        id: n.id,
        name: n.name,
        keystone: n.keystone,
        prerequisites: n.prereqs,
        connectedLaterTopics: connectedLaterCount(n.id),
      };
    },
  });

  const getStudentSummary = createTool({
    name: "get_student_summary",
    description:
      "Minimal structured summary of this session: the topic the student started from and what has been probed so far. No personal data. Read-only.",
    inputSchema: z.object({}),
    async execute() {
      return ctx.summary;
    },
  });

  return [getNode, getStudentSummary];
}

/** Completion tools. Each returns its own arguments; the CALLER validates them in code. */
export const proposeEntryNode = createTool({
  name: "propose_entry_node",
  description:
    "FINISH the job: say which single topic on the learning map this real exam question belongs to. nodeId must be one of the offered candidates. This is only a suggestion; code validates it.",
  inputSchema: ProposeEntrySchema,
  lifecycle: { completesRun: true },
  async execute(input) {
    return input;
  },
});

export const proposeProbeOrder = createTool({
  name: "propose_probe_order",
  description:
    "FINISH the job: propose the order in which to probe a topic's prerequisites. prereqOrder must contain exactly the topic's prerequisites, each once. This is only a suggestion; code validates it.",
  inputSchema: ProbeOrderSchema,
  lifecycle: { completesRun: true },
  async execute(input) {
    return input;
  },
});

export const chooseStuckCard = createTool({
  name: "choose_stuck_card",
  description:
    "FINISH the job: choose which 'where did you get stuck' card to show first (setup, calculation, interpretation). Suggestion only; code validates it.",
  inputSchema: StuckChoiceSchema,
  lifecycle: { completesRun: true },
  async execute(input) {
    return input;
  },
});

export const composeRepair = createTool({
  name: "compose_repair",
  description:
    "FINISH the job: order the repair options for this student from contrast, check, read, video. 'check' must be included. Suggestion only; code validates it.",
  inputSchema: RepairOrderSchema,
  lifecycle: { completesRun: true },
  async execute(input) {
    return input;
  },
});

export { z };
