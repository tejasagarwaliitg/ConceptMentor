import { chunkPages, looksOnMap, readPdf } from "./extract";
import { processChunk, type Agents, type ChunkReport } from "./pipeline";
import { readFile } from "node:fs/promises";
import { ocrPages } from "./ocr";
import { discoverPapers, downloadPdf } from "./sources";
import type { Bank, PaperRef, Tier } from "./types";

export interface HarvestOptions {
  maxChunks: number;
  /** chunks processed in parallel (default 4) */
  concurrency?: number;
  /** run OCR on scanned papers instead of skipping them (needs QBANK_VISION_MODEL) */
  ocr?: boolean;
  /** choose which page numbers to OCR (default: all) */
  ocrPages?: (pages: number[]) => number[];
  fromYear?: number;
  /** only harvest from this tier (main feeds Level A; advanced feeds B and C) */
  tier?: Tier;
  rand?: () => number;
  agents: Agents;
  papers?: PaperRef[];
  download?: (url: string) => Promise<Uint8Array>;
  log?: (msg: string) => void;
  /** called after every chunk so progress survives a crash or Ctrl-C */
  onChunk?: (bank: Bank) => void;
}

export interface HarvestReport {
  chunksTried: number;
  added: number;
  skippedScanned: string[];
  reports: ChunkReport[];
}

function shuffled<T>(xs: T[], rand: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Picks UNPROCESSED chunks at random across the official archive, so each run explores
 * new material. Processed chunks are never re-read, which keeps the bank growing
 * instead of re-serving the same questions.
 */
export async function harvest(bank: Bank, opts: HarvestOptions): Promise<HarvestReport> {
  const rand = opts.rand ?? Math.random;
  const log = opts.log ?? (() => {});
  const papers = (opts.papers ?? (await discoverPapers()))
    .filter((p) => !opts.fromYear || p.year >= opts.fromYear)
    .filter((p) => !opts.tier || p.tier === opts.tier);
  const local = new Map(papers.filter((p) => p.localPath).map((p) => [p.url, p.localPath!]));
  const download =
    opts.download ?? (async (url: string) => (local.has(url) ? new Uint8Array(await readFile(local.get(url)!)) : downloadPdf(url)));
  const done = new Set(bank.processed);
  const out: HarvestReport = { chunksTried: 0, added: 0, skippedScanned: [], reports: [] };

  for (const paper of shuffled(papers, rand)) {
    if (out.chunksTried >= opts.maxChunks) break;
    let text;
    try {
      text = await readPdf(await download(paper.url));
    } catch (e) {
      log(`skip ${paper.url}: ${(e as Error).message}`);
      continue;
    }
    let ocrText = false;
    // A paper can be effectively image-only even with a text layer: JEE Main PDFs
    // carry just question IDs and "Question Number :" boilerplate in the text layer.
    const usableChars = text.pages.reduce((n, p) => n + p.replace(/[^A-Za-z]/g, "").length, 0);
    const imageOnly = text.scanned || usableChars < 250 * Math.max(1, text.pages.length);
    if (imageOnly) {
      if (!opts.ocr) {
        out.skippedScanned.push(paper.url);
        log(`skip ${paper.year} ${paper.paper}: no usable text layer (${usableChars} letters in ${text.pages.length} pages); pass --ocr to read it as images`);
        continue;
      }
      // Read the pages as images; the transcription becomes the source text.
      const raw = await download(paper.url);
      // Read only the physics pages: OCR is the slow path and most of a JEE paper is not on the map.
      const n = text.pages.length || 20;
      const pages = Array.from({ length: n }, (_, i) => i + 1);
      const picked = opts.ocrPages ? opts.ocrPages(pages) : pages;
      const all = await ocrPages(raw, picked, opts.log);
      text = { pages: all, scanned: false };
      ocrText = true;
    }
    const todo = chunkPages(text.pages)
      .map((c, i) => ({ c, i }))
      .filter(({ i }) => !done.has(`${paper.url}#${i}`))
      .filter(({ c }) => looksOnMap(c));
    const queue = shuffled(todo, rand).slice(0, Math.max(0, opts.maxChunks - out.chunksTried));
    out.chunksTried += queue.length;
    // Chunks run concurrently (bank mutation is synchronous between awaits, so this is safe).
    let next = 0;
    const worker = async () => {
      while (next < queue.length) {
        const { c, i } = queue[next++];
        const r = await processChunk(bank, paper, i, c, opts.agents, undefined, ocrText);
        out.reports.push(r);
        out.added += r.added;
        opts.onChunk?.(bank);
        log(`${paper.year} ${paper.paper} chunk ${i}: found ${r.found}, added ${r.added}, rejected ${r.rejected.length}${r.rejected[0] ? " (" + r.rejected[0].reason.slice(0, 70) + ")" : ""}`);
      }
    };
    await Promise.all(Array.from({ length: Math.min(opts.concurrency ?? 4, queue.length) }, worker));
  }
  return out;
}
