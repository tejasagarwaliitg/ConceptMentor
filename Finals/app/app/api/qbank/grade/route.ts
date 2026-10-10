import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { loadBank } from "@/lib/qbank/store";
import { readToken } from "@/lib/qbank/token";

const Body = z.object({
  token: z.string().max(600),
  /** single/multi: index into the SHUFFLED options (-1 = I do not know). numeric: null. */
  chosen: z.array(z.number().int().min(-1).max(5)).max(6).optional(),
  /** numeric: the value the student entered */
  numeric: z.number().optional(),
});

/** Grades on the server. The browser never sees the answer before grading. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const t = readToken(parsed.data.token);
  if (!t) return NextResponse.json({ error: "invalid or expired" }, { status: 400 });
  const q = loadBank().questions.find((x) => x.id === t.id);
  if (!q) return NextResponse.json({ error: "unknown question" }, { status: 400 });

  const { chosen = [], numeric } = parsed.data;
  const picked = chosen.filter((c) => c >= 0);
  const dontKnow = chosen.length > 0 && chosen.every((c) => c === -1);

  let correct = false;
  let correctText = "";
  let correctIndex: number | null = null;

  let right: number[] = [];
  if (q.kind === "numeric") {
    const want = q.answerValue ?? 0;
    const tol = q.tolerance ?? Math.abs(want) * 0.02 + 1e-6;
    correct = numeric !== undefined && Math.abs(numeric - want) <= tol;
    correctText = `${want}${q.unit ? " " + q.unit : ""} (±${Number(tol.toFixed(6))})`;
  } else {
    right = q.kind === "multi" ? q.answerIndices ?? [] : q.answer !== null ? [q.answer] : [];
    const mine = new Set(picked.map((p) => t.order[p]).filter((x) => x >= 0));
    correct = mine.size === right.length && right.every((r) => mine.has(r));
    correctText = right.map((r) => q.options[r]).join(" | ");
    if (q.kind === "single") correctIndex = t.order.indexOf(q.answer ?? 0);
  }

  return NextResponse.json(
    {
      correct,
      dontKnow,
      correctText,
      correctIndexes: q.kind === "numeric" ? [] : right.map((r) => t.order.indexOf(r)).filter((i) => i >= 0),
      kind: q.kind,
      derivation: q.derivation,
      verified: q.status === "approved" ? "approved" : "ai-checked",
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
