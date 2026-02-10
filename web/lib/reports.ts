import fs from "fs";
import path from "path";
import { REPORTS_DIR, PROJECT_DIR } from "./constants";

export interface ReportMeta {
  date: string;
  filename: string;
  sizeBytes: number;
  modifiedAt: string;
  location: "reports" | "root";
  title?: string;
  highlights?: string[];
}

export function listReports(): ReportMeta[] {
  const reports: ReportMeta[] = [];
  const seen = new Set<string>();
  const pattern = /^ondo_daily_report_(\d{4}-\d{2}-\d{2}).*\.md$/;

  // Scan reports/ directory
  if (fs.existsSync(REPORTS_DIR)) {
    for (const file of fs.readdirSync(REPORTS_DIR)) {
      const match = file.match(pattern);
      if (match) {
        const stat = fs.statSync(path.join(REPORTS_DIR, file));
        reports.push({
          date: match[1],
          filename: file,
          sizeBytes: stat.size,
          modifiedAt: stat.mtime.toISOString(),
          location: "reports",
        });
        seen.add(match[1]);
      }
    }
  }

  // Scan project root for older reports
  for (const file of fs.readdirSync(PROJECT_DIR)) {
    const match = file.match(pattern);
    if (match && !seen.has(match[1])) {
      const stat = fs.statSync(path.join(PROJECT_DIR, file));
      reports.push({
        date: match[1],
        filename: file,
        sizeBytes: stat.size,
        modifiedAt: stat.mtime.toISOString(),
        location: "root",
      });
    }
  }

  const sorted = reports.sort((a, b) => b.date.localeCompare(a.date));

  // Extract title and highlights from each report
  for (const report of sorted) {
    const filePath = report.location === "reports"
      ? path.join(REPORTS_DIR, report.filename)
      : path.join(PROJECT_DIR, report.filename);
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const meta = extractReportMeta(content);
      report.title = meta.title;
      report.highlights = meta.highlights;
    } catch (e) {
      console.error(`Failed to read report ${report.filename}:`, (e as Error).message);
    }
  }

  return sorted;
}

function extractReportMeta(content: string): { title: string; highlights: string[] } {
  const lines = content.split("\n");
  let title = "";
  const highlights: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // First h1 is the title
    if (!title && /^# /.test(trimmed)) {
      title = trimmed.replace(/^# /, "");
      continue;
    }
    // Collect h3 highlights from 宣发点 section (🔥 lines)
    if (/^### 🔥/.test(trimmed)) {
      highlights.push(trimmed.replace(/^### /, ""));
    }
    // Stop after we hit the first ## that isn't 宣发点
    if (/^## /.test(trimmed) && !trimmed.includes("宣发点") && title) {
      break;
    }
  }

  return { title, highlights };
}

export function readReport(date: string): string | null {
  // Validate date format to prevent path traversal
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  const exactName = `ondo_daily_report_${date}.md`;

  // Try reports/ directory first
  if (fs.existsSync(REPORTS_DIR)) {
    const filePath = path.join(REPORTS_DIR, exactName);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, "utf-8");
    }
  }

  // Try project root
  const rootPath = path.join(PROJECT_DIR, exactName);
  if (fs.existsSync(rootPath)) {
    return fs.readFileSync(rootPath, "utf-8");
  }

  // Fallback: loose match for non-standard filenames
  const rootFiles = fs.readdirSync(PROJECT_DIR).filter(
    (f) => f.startsWith(`ondo_daily_report_${date}`) && f.endsWith(".md")
  );
  if (rootFiles.length > 0) {
    return fs.readFileSync(path.join(PROJECT_DIR, rootFiles[0]), "utf-8");
  }

  return null;
}
