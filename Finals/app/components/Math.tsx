"use client";
import katex from "katex";
import "katex/dist/katex.min.css";
import { useMemo } from "react";

/** Renders text with inline $...$ maths via KaTeX plus **bold** / *italic* emphasis. Plain text otherwise (no raw HTML from content). */
export function Rich({ text, className }: { text: string; className?: string }) {
  const html = useMemo(() => {
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const emph = (s: string) =>
      s
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
    return text
      .split(/(\$[^$]+\$)/g)
      .map((part) => {
        if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
          try {
            return katex.renderToString(part.slice(1, -1), { throwOnError: false });
          } catch {
            return esc(part);
          }
        }
        return emph(esc(part));
      })
      .join("");
  }, [text]);
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
