"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface TocItem {
  level: number;
  text: string;
  id: string;
}

function parseHeadings(markdown: string): TocItem[] {
  const items: TocItem[] = [];
  for (const line of markdown.split("\n")) {
    const match = line.match(/^(#{1,3}) (.+)/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fff\s-]/g, "")
        .replace(/\s+/g, "-");
      items.push({ level, text, id });
    }
  }
  return items;
}

export function ReportToc({ content }: { content: string }) {
  const headings = parseHeadings(content);
  const t = useT();
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-80px 0px -70% 0px" }
    );

    // Observe all heading elements in the article
    const article = document.querySelector("article");
    if (article) {
      const els = article.querySelectorAll("h1, h2, h3");
      els.forEach((el) => observer.observe(el));
    }

    return () => observer.disconnect();
  }, [content]);

  const scrollTo = (id: string) => {
    const article = document.querySelector("article");
    if (!article) return;
    const els = article.querySelectorAll("h1, h2, h3");
    for (const el of els) {
      const elId = el.textContent
        ?.toLowerCase()
        .replace(/[^\w\u4e00-\u9fff\s-]/g, "")
        .replace(/\s+/g, "-");
      if (elId === id) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        break;
      }
    }
  };

  // Skip the first h1 (title) in the TOC
  const tocItems = headings.filter((_, i) => i > 0);

  if (tocItems.length === 0) return null;

  return (
    <nav className="space-y-1">
      <h4 className="font-medium text-sm mb-3">{t("tableOfContents")}</h4>
      {tocItems.map((item, i) => (
        <button
          key={i}
          onClick={() => scrollTo(item.id)}
          className={cn(
            "block w-full text-left text-xs py-1 transition-colors hover:text-foreground truncate",
            item.level === 2 ? "pl-0 font-medium" : "pl-3",
            activeId === item.id
              ? "text-foreground"
              : "text-muted-foreground"
          )}
        >
          {item.text}
        </button>
      ))}
    </nav>
  );
}
