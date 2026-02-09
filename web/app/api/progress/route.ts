import { isGenerating } from "@/lib/launchd";
import { LOGS_DIR } from "@/lib/constants";
import {
  getInitialState,
  getTodayLogPath,
  parseLogLine,
  type ProgressState,
  type SSEEvent,
} from "@/lib/progress";
import fs from "fs";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: SSEEvent) {
        const data = JSON.stringify(event);
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      }

      const { running } = isGenerating();

      if (!running) {
        send({ type: "idle", status: "idle" });
        controller.close();
        return;
      }

      const logPath = getTodayLogPath(LOGS_DIR);

      // Rebuild current state from existing log
      let state: ProgressState = getInitialState(logPath);

      // Send initial state if we have phases
      if (state.phases.length > 0) {
        send({
          type: "phase",
          phases: state.phases,
          currentPhaseIndex: state.currentPhaseIndex,
          progress: state.progress,
        });
      }
      if (state.currentTool) {
        send({
          type: "activity",
          tool: state.currentTool,
          detail: state.currentToolDetail || "",
        });
      }
      if (state.done) {
        send({
          type: "done",
          success: state.success ?? false,
          durationMs: state.durationMs,
          costUsd: state.costUsd,
        });
        controller.close();
        return;
      }

      // Tail the log file for new entries
      let fileSize = 0;
      try {
        const stat = fs.statSync(logPath);
        fileSize = stat.size;
      } catch {
        // file may not exist yet
      }

      let closed = false;
      let consecutiveIdleChecks = 0;
      const maxIdleChecks = 150; // 150 * 2s = 5 minutes max idle

      const interval = setInterval(() => {
        if (closed) return;

        try {
          // Check if still generating
          const { running: stillRunning } = isGenerating();

          if (!fs.existsSync(logPath)) {
            if (!stillRunning) {
              consecutiveIdleChecks++;
              if (consecutiveIdleChecks > 3) {
                send({ type: "idle", status: "idle" });
                cleanup();
              }
            }
            return;
          }

          const stat = fs.statSync(logPath);
          const currentSize = stat.size;

          if (currentSize > fileSize) {
            // Read new content
            const fd = fs.openSync(logPath, "r");
            const buffer = Buffer.alloc(currentSize - fileSize);
            fs.readSync(fd, buffer, 0, buffer.length, fileSize);
            fs.closeSync(fd);
            fileSize = currentSize;
            consecutiveIdleChecks = 0;

            const newContent = buffer.toString("utf-8");
            const lines = newContent.split("\n");

            for (const line of lines) {
              if (!line.trim()) continue;
              const { state: newState, event } = parseLogLine(line, state);
              state = newState;
              if (event) {
                send(event);
                if (event.type === "done") {
                  cleanup();
                  return;
                }
              }
            }
          } else {
            // No new content
            if (!stillRunning) {
              consecutiveIdleChecks++;
              if (consecutiveIdleChecks > 3) {
                // Process ended without result entry
                send({
                  type: "done",
                  success: state.progress >= 90,
                  durationMs: null,
                  costUsd: null,
                });
                cleanup();
              }
            } else {
              consecutiveIdleChecks = 0;
            }
          }

          if (consecutiveIdleChecks >= maxIdleChecks) {
            cleanup();
          }
        } catch {
          // Ignore read errors, retry on next tick
        }
      }, 2000);

      function cleanup() {
        if (closed) return;
        closed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // already closed
        }
      }

      // Safety: close after 60 minutes max
      setTimeout(cleanup, 60 * 60 * 1000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
