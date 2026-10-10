import type { PaperRef } from "./types";

/**
 * Official sources only. A URL is fetched only if its host is on this list, so the
 * agent pipeline can never be pointed at a coaching site or a random mirror.
 */
export const OFFICIAL_HOSTS = ["jeeadv.ac.in", "nta.ac.in", "jeemain.nta.ac.in", "jeemain.nta.nic.in", "cdnbbsr.s3waas.gov.in"];

export const JEEADV_ARCHIVE = "https://jeeadv.ac.in/archive.html";

export function isOfficialUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && OFFICIAL_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

/**
 * Parse the JEE Advanced archive page. File names differ between years
 * (`2014_1.pdf` vs `2019_1_English.pdf`), so links are DISCOVERED, never constructed.
 * Hindi editions, answer-key-less AAT papers and duplicates are skipped.
 */
export function parseJeeAdvancedArchive(html: string, base = JEEADV_ARCHIVE): PaperRef[] {
  const seen = new Set<string>();
  const out: PaperRef[] = [];
  const re = /href="([^"]*past_qps\/(\d{4})_([12])(?:_English)?\.pdf)"/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const url = new URL(m[1], base).toString();
    if (seen.has(url) || !isOfficialUrl(url)) continue;
    seen.add(url);
    out.push({ exam: "JEE Advanced", tier: "advanced", year: Number(m[2]), paper: `Paper ${m[3]}`, url });
  }
  return out.sort((a, b) => b.year - a.year || a.paper.localeCompare(b.paper));
}

export async function discoverPapers(fetchImpl: typeof fetch = fetch): Promise<PaperRef[]> {
  const res = await fetchImpl(JEEADV_ARCHIVE, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`archive fetch failed: ${res.status}`);
  return parseJeeAdvancedArchive(await res.text());
}

/**
 * NTA serves `nta.ac.in` behind a certificate that only lists `nta.gov.in`, so Node's
 * TLS check rejects it (ERR_TLS_CERT_ALTNAME_INVALID) while browsers and curl follow along.
 * For that one host we relax the TLS check and use the same URL and hostname we validated
 * in `isOfficialUrl`. Nothing else about the request changes.
 */
async function fetchOfficial(url: string): Promise<Response> {
  if (new URL(url).hostname !== "nta.ac.in") return fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const old = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  try {
    return await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  } finally {
    if (old === undefined) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    else process.env.NODE_TLS_REJECT_UNAUTHORIZED = old;
  }
}

export async function downloadPdf(url: string, fetchImpl: typeof fetch = fetch): Promise<Uint8Array> {
  if (!isOfficialUrl(url)) throw new Error(`refusing non-official url: ${url}`);
  const res = fetchImpl === fetch ? await fetchOfficial(url) : await fetchImpl(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const type = res.headers.get("content-type") ?? "";
  if (!res.ok || !type.includes("pdf")) throw new Error(`not a pdf (${res.status} ${type})`);
  return new Uint8Array(await res.arrayBuffer());
}

/** main = JEE Main level (feeds Level A); advanced = JEE Advanced / Irodov-class (feeds B and C). */
export interface ConfiguredSource {
  exam: string;
  tier: "main" | "advanced";
  year: number;
  paper: string;
  url?: string;
  localPath?: string;
}

/**
 * Extra sources you maintain in content/qbank-sources.json (NTA does not publish a
 * crawlable list of JEE Main papers, so those URLs are added by hand). Each entry is
 * either an official https URL or a local PDF you own (e.g. an Irodov scan with a text layer).
 */
export function configuredPapers(list: ConfiguredSource[]): PaperRef[] {
  const out: PaperRef[] = [];
  for (const s of list) {
    if (s.localPath) out.push({ exam: s.exam, tier: s.tier, year: s.year, paper: s.paper, url: `file://${s.localPath}`, localPath: s.localPath });
    else if (s.url && isOfficialUrl(s.url)) out.push({ exam: s.exam, tier: s.tier, year: s.year, paper: s.paper, url: s.url });
  }
  return out;
}
