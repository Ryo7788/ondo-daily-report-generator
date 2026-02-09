import fs from "fs";

export interface PhaseInfo {
  content: string;
  status: "pending" | "in_progress" | "completed";
  activeForm: string;
}

export interface ProgressState {
  phases: PhaseInfo[];
  currentPhaseIndex: number;
  progress: number; // 0-100
  currentTool: string | null;
  currentToolDetail: string | null;
  done: boolean;
  success: boolean | null;
  durationMs: number | null;
  costUsd: number | null;
}

export function createInitialState(): ProgressState {
  return {
    phases: [],
    currentPhaseIndex: -1,
    progress: 0,
    currentTool: null,
    currentToolDetail: null,
    done: false,
    success: null,
    durationMs: null,
    costUsd: null,
  };
}

/**
 * Friendly display name for tools used during generation.
 */
function toolDisplayName(name: string): string {
  if (name.startsWith("mcp__playwright__")) {
    return "Playwright: " + name.replace("mcp__playwright__browser_", "");
  }
  const map: Record<string, string> = {
    Skill: "Skill",
    Bash: "Bash",
    Read: "Read",
    Write: "Write",
    Edit: "Edit",
    Grep: "Grep",
    Glob: "Glob",
    WebSearch: "Web Search",
    WebFetch: "Web Fetch",
    Task: "Sub-agent",
    TodoWrite: "Progress Update",
    ToolSearch: "Tool Search",
  };
  return map[name] || name;
}

/**
 * Extract a short description from tool input.
 */
function toolDetail(name: string, input: Record<string, unknown>): string {
  if (name === "Skill") {
    const skill = input.skill as string;
    const args = input.args as string | undefined;
    return args ? `${skill} ${args}` : skill;
  }
  if (name === "Bash") {
    return (input.description as string) || (input.command as string || "").slice(0, 60);
  }
  if (name === "WebSearch") {
    return (input.query as string) || "";
  }
  if (name === "Read") {
    const fp = input.file_path as string;
    return fp ? fp.split("/").pop() || fp : "";
  }
  if (name === "Write") {
    const fp = input.file_path as string;
    return fp ? fp.split("/").pop() || fp : "";
  }
  if (name.startsWith("mcp__playwright__browser_navigate")) {
    return (input.url as string) || "";
  }
  if (name === "TodoWrite") return "";
  return "";
}

export interface ParseResult {
  state: ProgressState;
  event: SSEEvent | null;
}

export type SSEEvent =
  | { type: "phase"; phases: PhaseInfo[]; currentPhaseIndex: number; progress: number }
  | { type: "activity"; tool: string; detail: string }
  | { type: "done"; success: boolean; durationMs: number | null; costUsd: number | null }
  | { type: "idle"; status: "idle" };

/**
 * Parse a single JSON line from raw log and update state.
 * Returns the updated state and an optional SSE event to send.
 */
export function parseLogLine(line: string, state: ProgressState): ParseResult {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(line);
  } catch {
    return { state, event: null };
  }

  const type = parsed.type as string;

  // Handle system init → new session started, reset state
  if (type === "system" && parsed.subtype === "init") {
    const fresh = createInitialState();
    return { state: fresh, event: null };
  }

  // Handle result entries (session end)
  if (type === "result") {
    const durationMs = (parsed.duration_ms as number) || null;
    const costUsd = (parsed.total_cost_usd as number) || null;
    const isError = parsed.is_error as boolean;
    const newState: ProgressState = {
      ...state,
      done: true,
      success: !isError,
      durationMs,
      costUsd,
      currentTool: null,
      currentToolDetail: null,
      progress: isError ? state.progress : 100,
    };
    return {
      state: newState,
      event: { type: "done", success: !isError, durationMs, costUsd },
    };
  }

  // Handle assistant messages with tool_use content
  if (type === "assistant") {
    const message = parsed.message as Record<string, unknown> | undefined;
    if (!message) return { state, event: null };

    const content = message.content as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(content)) return { state, event: null };

    let newState = { ...state };
    let lastEvent: SSEEvent | null = null;

    for (const block of content) {
      if (block.type !== "tool_use") continue;
      const name = block.name as string;
      const input = (block.input as Record<string, unknown>) || {};

      // TodoWrite → update phases
      if (name === "TodoWrite") {
        const todos = input.todos as Array<Record<string, unknown>> | undefined;
        if (!Array.isArray(todos)) continue;

        const phases: PhaseInfo[] = todos.map((t) => ({
          content: (t.content as string) || "",
          status: (t.status as PhaseInfo["status"]) || "pending",
          activeForm: (t.activeForm as string) || "",
        }));

        const completedCount = phases.filter((p) => p.status === "completed").length;
        const inProgressIdx = phases.findIndex((p) => p.status === "in_progress");
        const currentIdx = inProgressIdx >= 0 ? inProgressIdx : (completedCount > 0 ? completedCount - 1 : 0);
        const progress = Math.round((completedCount / phases.length) * 100);

        newState = {
          ...newState,
          phases,
          currentPhaseIndex: currentIdx,
          progress,
        };
        lastEvent = { type: "phase", phases, currentPhaseIndex: currentIdx, progress };
        continue;
      }

      // Other tool_use → activity event
      const display = toolDisplayName(name);
      const detail = toolDetail(name, input);
      newState = {
        ...newState,
        currentTool: display,
        currentToolDetail: detail,
      };
      lastEvent = { type: "activity", tool: display, detail };
    }

    return { state: newState, event: lastEvent };
  }

  return { state, event: null };
}

/**
 * Read existing log file and rebuild current progress state.
 */
export function getInitialState(logPath: string): ProgressState {
  let state = createInitialState();
  if (!fs.existsSync(logPath)) return state;

  const content = fs.readFileSync(logPath, "utf-8");
  const lines = content.split("\n");
  for (const line of lines) {
    if (!line.trim()) continue;
    const { state: newState } = parseLogLine(line, state);
    state = newState;
  }
  return state;
}

/**
 * Get today's raw log file path.
 */
export function getTodayLogPath(logsDir: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return `${logsDir}/${today}_raw.log`;
}
