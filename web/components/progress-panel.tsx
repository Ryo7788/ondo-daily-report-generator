"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useT } from "@/lib/i18n";
import Link from "next/link";

interface PhaseInfo {
  content: string;
  status: "pending" | "in_progress" | "completed";
  activeForm: string;
}

interface ProgressData {
  phases: PhaseInfo[];
  currentPhaseIndex: number;
  progress: number;
  currentTool: string | null;
  currentToolDetail: string | null;
  done: boolean;
  success: boolean | null;
  durationMs: number | null;
  costUsd: number | null;
}

const PHASE_KEYS = [
  "phaseCheckApi",
  "phaseConfirmDate",
  "phaseDataCollection",
  "phaseGenerateDraft",
  "phaseQueryGrok",
  "phaseQueryChatGPT",
  "phaseIntegrate",
  "phaseVerify",
] as const;

export function ProgressPanel() {
  const t = useT();
  const [data, setData] = useState<ProgressData>({
    phases: [],
    currentPhaseIndex: -1,
    progress: 0,
    currentTool: null,
    currentToolDetail: null,
    done: false,
    success: null,
    durationMs: null,
    costUsd: null,
  });
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/progress");
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload.type === "phase") {
          setData((prev) => ({
            ...prev,
            phases: payload.phases,
            currentPhaseIndex: payload.currentPhaseIndex,
            progress: payload.progress,
          }));
        } else if (payload.type === "activity") {
          setData((prev) => ({
            ...prev,
            currentTool: payload.tool,
            currentToolDetail: payload.detail,
          }));
        } else if (payload.type === "done") {
          setData((prev) => ({
            ...prev,
            done: true,
            success: payload.success,
            durationMs: payload.durationMs,
            costUsd: payload.costUsd,
            progress: payload.success ? 100 : prev.progress,
            currentTool: null,
            currentToolDetail: null,
          }));
          es.close();
        } else if (payload.type === "idle") {
          es.close();
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
  }, []);

  const phases = data.phases;
  const completedCount = phases.filter((p) => p.status === "completed").length;

  function formatDuration(ms: number): string {
    const totalSec = Math.round(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    if (min === 0) return `${sec}s`;
    return `${min}m ${sec}s`;
  }

  // Use translated phase names if we have 8 phases, otherwise fall back to log content
  function phaseName(phase: PhaseInfo, index: number): string {
    if (phases.length === PHASE_KEYS.length && PHASE_KEYS[index]) {
      return t(PHASE_KEYS[index]);
    }
    return phase.content;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
          <span>{t("generationProgress")}</span>
          {phases.length > 0 && (
            <span className="text-xs tabular-nums">
              {completedCount}/{phases.length} {t("stepsCompleted")}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${data.progress}%` }}
          />
        </div>

        {/* Vertical step list */}
        {phases.length > 0 && (
          <div className="space-y-1">
            {phases.map((phase, i) => (
              <div key={i} className="flex items-start gap-3 py-1.5">
                {/* Step icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {phase.status === "completed" ? (
                    <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                      <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  ) : phase.status === "in_progress" ? (
                    <div className="h-5 w-5 rounded-full border-2 border-green-500 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    </div>
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                  )}
                </div>

                {/* Step content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm leading-5 ${
                      phase.status === "completed"
                        ? "text-muted-foreground line-through"
                        : phase.status === "in_progress"
                          ? "text-foreground font-medium"
                          : "text-muted-foreground/60"
                    }`}
                  >
                    {phaseName(phase, i)}
                  </p>
                  {/* Show current tool activity under active phase */}
                  {phase.status === "in_progress" && data.currentTool && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {data.currentTool}
                      {data.currentToolDetail ? `: ${data.currentToolDetail}` : ""}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Loading state when no phases yet */}
        {phases.length === 0 && !data.done && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-4 w-4 border-2 border-muted-foreground/30 border-t-green-500 rounded-full animate-spin" />
            <span>{t("generating")}</span>
          </div>
        )}

        {/* Completion summary */}
        {data.done && (
          <div className={`rounded-lg p-3 text-sm ${data.success ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-red-500/10 text-red-700 dark:text-red-400"}`}>
            <p className="font-medium">
              {data.success ? t("generationComplete") : t("generationFailed")}
            </p>
            <div className="flex gap-4 mt-1 text-xs opacity-80">
              {data.durationMs != null && (
                <span>{formatDuration(data.durationMs)}</span>
              )}
              {data.costUsd != null && (
                <span>${data.costUsd.toFixed(2)}</span>
              )}
            </div>
            {data.success && (
              <Link
                href={`/reports/${new Date().toISOString().slice(0, 10)}`}
                className="inline-block mt-2 text-xs underline hover:no-underline"
              >
                {t("latestReport")} →
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
