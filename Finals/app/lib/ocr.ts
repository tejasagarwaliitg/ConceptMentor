import { spawnSync } from "node:child_process";
import path from "node:path";

/** Local OCR via the macOS Vision framework. No API key, no image leaves the device. */
export interface OcrLine { text: string; conf: number; x: number; y: number; w: number; h: number }
export interface OcrResult { text: string; lines: OcrLine[]; count: number; error?: string }

const BIN = path.join(process.cwd(), "scripts", "ocrbin");

export function runOcr(file: string): OcrResult {
  const r = spawnSync(BIN, [file], { encoding: "utf8", timeout: 20_000, maxBuffer: 8 * 1024 * 1024 });
  if (r.error || r.status !== 0) return { text: "", lines: [], count: 0, error: "ocr-unavailable" };
  try {
    const parsed = JSON.parse(r.stdout || "{}") as OcrResult;
    return { text: parsed.text ?? "", lines: parsed.lines ?? [], count: parsed.count ?? 0 };
  } catch {
    return { text: "", lines: [], count: 0, error: "ocr-bad-output" };
  }
}
