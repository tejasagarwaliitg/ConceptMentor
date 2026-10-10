import { renderPageAsImage } from "unpdf";
import { chat, visionModel } from "./agent";

/**
 * Reads papers whose text lives in images (most JEE Main PDFs and older scanned
 * Advanced papers). Pages are rendered to PNG and transcribed by a vision model.
 * WARNING: this text is machine-generated, so an "anchor found in the source"
 * check here means "found in the transcription", not "verified against the paper".
 * Questions harvested this way carry a `ocr` flag and still need human review.
 */

export type PageText = { page: number; text: string };

export async function ocrPage(data: Uint8Array, pageNumber: number, model: string): Promise<PageText> {
  const canvas = await import("@napi-rs/canvas");
  const png = await renderPageAsImage(data, pageNumber, { canvasImport: () => Promise.resolve(canvas), scale: 1.6 });
  const url = `data:image/png;base64,${Buffer.from(png).toString("base64")}`;
  const r = await chat(
    model,
    [
      { role: "system", content: "You are a careful transcriber of exam papers. Output plain text only." },
      {
        role: "user",
        content: [
          { type: "text", text: "Transcribe every exam question and its options on this page, in order, including question numbers. Transcribe BOTH languages when present (English first). Do not translate, do not solve, do not add anything." },
          { type: "image_url", image_url: { url } },
        ],
      },
    ],
    4000
  );
  return { page: pageNumber, text: "text" in r ? r.text : "" };
}

/** OCR a page range, two pages per call to keep images small. */
export async function ocrPages(data: Uint8Array, pages: number[], onProgress?: (msg: string) => void): Promise<string[]> {
  const model = visionModel();
  if (!model) throw new Error("set QBANK_VISION_MODEL to use OCR");
  const out: string[] = [];
  for (let i = 0; i < pages.length; i += 2) {
    const pair = pages.slice(i, i + 2);
    const texts: string[] = [];
    for (const p of pair) {
      const t = await ocrPage(data, p, model);
      texts.push(t.text);
      onProgress?.(`ocr page ${p}: ${t.text.length} chars`);
    }
    out.push(texts.join("\n\n"));
  }
  return out;
}
