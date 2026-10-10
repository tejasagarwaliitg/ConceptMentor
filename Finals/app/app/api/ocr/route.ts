import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { z } from "zod";
import { runOcr } from "@/lib/ocr";


const Body = z.object({
  /** data URL: data:image/png;base64,... */
  image: z.string().min(100).max(4_500_000),
});

/**
 * Local OCR. The image is written to a temp file on this machine only and deleted
 * after recognition: no image is sent to any model provider.
 */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });

  const m = /^data:image\/(png|jpe?g|webp);base64,(.+)$/.exec(parsed.data.image);
  if (!m) return NextResponse.json({ error: "unsupported image" }, { status: 415 });

  const dir = path.join(tmpdir(), "ocr-jobs");
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${randomUUID()}.${m[1] === "jpeg" ? "jpg" : m[1]}`);
  try {
    writeFileSync(file, Buffer.from(m[2], "base64"));
    const result = runOcr(file);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 503 });
    return NextResponse.json(
      { text: result.text, count: result.count, lines: result.lines.slice(0, 60) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ error: "ocr-failed" }, { status: 500 });
  } finally {
    rmSync(file, { force: true });
  }
}
