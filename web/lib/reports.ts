import fs from "fs";
import path from "path";
import { REPORTS_DIR, PROJECT_DIR } from "./constants";

export interface ReportMeta {
  date: string;
  filename: string;
  sizeBytes: number;
  modifiedAt: string;
  location: "reports" | "root";
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

  return reports.sort((a, b) => b.date.localeCompare(a.date));
}

export function readReport(date: string): string | null {
  // Try reports/ directory first
  if (fs.existsSync(REPORTS_DIR)) {
    const files = fs.readdirSync(REPORTS_DIR).filter((f) => f.includes(date));
    if (files.length > 0) {
      return fs.readFileSync(path.join(REPORTS_DIR, files[0]), "utf-8");
    }
  }

  // Try project root
  const rootFiles = fs.readdirSync(PROJECT_DIR).filter(
    (f) => f.includes(date) && f.endsWith(".md") && f.startsWith("ondo_daily_report_")
  );
  if (rootFiles.length > 0) {
    return fs.readFileSync(path.join(PROJECT_DIR, rootFiles[0]), "utf-8");
  }

  return null;
}
