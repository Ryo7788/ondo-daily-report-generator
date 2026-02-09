import fs from "fs";
import path from "path";
import { LOGS_DIR, LAUNCHD_LOG_DIR } from "./constants";

export interface LogEntry {
  type: string;
  subtype?: string;
  textPreview?: string;
  toolName?: string;
  contentType?: string;
  uuid?: string;
  durationMs?: number;
  costUsd?: number;
  resultPreview?: string;
}

function summarizeLogEntry(entry: Record<string, unknown>): LogEntry {
  const type = entry.type as string;

  if (type === "assistant") {
    const msg = entry.message as Record<string, unknown> | undefined;
    const content = (msg?.content as Array<Record<string, unknown>>) || [];
    const first = content[0];
    if (first?.type === "text") {
      return {
        type: "assistant",
        contentType: "text",
        textPreview: (first.text as string)?.slice(0, 300),
        uuid: entry.uuid as string,
      };
    }
    if (first?.type === "tool_use") {
      return {
        type: "assistant",
        contentType: "tool_use",
        toolName: first.name as string,
        uuid: entry.uuid as string,
      };
    }
    return { type: "assistant", uuid: entry.uuid as string };
  }

  if (type === "result") {
    return {
      type: "result",
      subtype: entry.subtype as string,
      durationMs: entry.duration_ms as number,
      costUsd: entry.total_cost_usd as number,
      resultPreview: (entry.result as string)?.slice(0, 300),
    };
  }

  return { type, subtype: entry.subtype as string };
}

export function listLogDates(): string[] {
  if (!fs.existsSync(LOGS_DIR)) return [];
  return fs
    .readdirSync(LOGS_DIR)
    .filter((f) => f.endsWith("_raw.log"))
    .map((f) => f.replace("_raw.log", ""))
    .sort()
    .reverse();
}

export function readRawLog(
  date: string,
  filters?: { types?: string[]; offset?: number; limit?: number }
): { entries: LogEntry[]; total: number; hasMore: boolean } {
  const logPath = path.join(LOGS_DIR, `${date}_raw.log`);
  if (!fs.existsSync(logPath)) return { entries: [], total: 0, hasMore: false };

  const lines = fs.readFileSync(logPath, "utf-8").split("\n").filter(Boolean);
  let entries = lines
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  if (filters?.types && filters.types.length > 0) {
    entries = entries.filter((e: Record<string, unknown>) =>
      filters.types!.includes(e.type as string)
    );
  }

  const total = entries.length;
  const offset = filters?.offset || 0;
  const limit = filters?.limit || 50;
  const sliced = entries.slice(offset, offset + limit);

  return {
    entries: sliced.map(summarizeLogEntry),
    total,
    hasMore: offset + limit < total,
  };
}

export function readLaunchdLog(
  source: "production" | "test",
  stream: "stdout" | "stderr"
): string {
  const dir = LAUNCHD_LOG_DIR;
  const prefix = source === "test" ? "test" : "launchd";
  const filename = `${prefix}_${stream}.log`;
  const filePath = path.join(dir, filename);

  if (!fs.existsSync(filePath)) return "";
  return fs.readFileSync(filePath, "utf-8");
}
