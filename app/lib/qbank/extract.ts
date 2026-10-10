import { extractText, getDocumentProxy } from "unpdf";

export interface PdfText {
  pages: string[];
  /** true when the PDF is an image scan with no usable text layer */
  scanned: boolean;
}

export async function readPdf(data: Uint8Array): Promise<PdfText> {
  const pdf = await getDocumentProxy(data);
  const { text } = await extractText(pdf, { mergePages: false });
  const pages = (text as string[]).map((t) => t.trim());
  const chars = pages.reduce((n, p) => n + p.length, 0);
  return { pages, scanned: chars < 200 * Math.max(1, pages.length) * 0.1 };
}

/** Group pages into chunks small enough for one agent call. */
export function chunkPages(pages: string[], pagesPerChunk = 2): string[] {
  const out: string[] = [];
  for (let i = 0; i < pages.length; i += pagesPerChunk) {
    const t = pages.slice(i, i + pagesPerChunk).join("\n\n").trim();
    if (t.length > 300) out.push(t);
  }
  return out;
}

/** Lower-case alphanumerics only: robust to line breaks and PDF spacing quirks. */
export function normalise(s: string): string {
  // NFKC folds PDF "mathematical italic" letters (𝑚, 𝛼) to plain m, α so anchors still match.
  return s.normalize("NFKC").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/** The anchor must literally occur in the source chunk (guards against invented questions). */
export function anchorInSource(anchor: string, chunk: string): boolean {
  const a = normalise(anchor);
  return a.length >= 15 && normalise(chunk).includes(a);
}

/**
 * Free, local relevance filter so no model request is spent on chunks that cannot hold a
 * question for one of the map topics (kinematics, vectors, projectiles, graphs, derivatives).
 * Deliberately generous: a false positive costs one request, a false negative loses a question.
 */
const ON_MAP = /projectile|trajectory|velocity|acceleration|displacement|kinematic|vector|component|resultant|speed|uniform(ly)? accelerat|free fall|thrown|launch|incline|slope|gradient|derivative|rate of change|d[xyv]\s*\/\s*dt|v\s*-\s*t|x\s*-\s*t|graph|trigonometr|sin\s*θ|cos\s*θ|tan\s*θ|axes|coordinate/i;
export function looksOnMap(chunk: string): boolean {
  return ON_MAP.test(chunk) && /\(A\)|\(a\)|^A\./m.test(chunk);
}
