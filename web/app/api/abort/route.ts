import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { isGenerating } from "@/lib/launchd";

export const dynamic = "force-dynamic";

export async function POST() {
  const { running, pid } = isGenerating();

  if (!running || !pid) {
    return NextResponse.json({ ok: false, error: "No generation in progress" });
  }

  try {
    const killed: number[] = [];

    // 1. Find the process group of auto_ondo_report.sh and kill the entire group.
    //    This cleanly kills the shell script, claude -p, and all child processes.
    try {
      const pgid = execSync(`ps -o pgid= -p ${pid}`, {
        encoding: "utf-8",
        timeout: 3000,
      }).trim();
      if (pgid && /^\d+$/.test(pgid)) {
        // Kill the entire process group
        try {
          process.kill(-parseInt(pgid), "SIGTERM");
          killed.push(pid);
        } catch { /* group already dead */ }
      }
    } catch {
      // Fallback: kill by PID directly
      try { process.kill(pid, "SIGTERM"); killed.push(pid); } catch { /* already dead */ }
    }

    // 2. Also kill Playwright browser if running (separate process group)
    try {
      execSync('pkill -f "Google Chrome for Testing" 2>/dev/null', { timeout: 3000 });
    } catch { /* no match */ }

    // 3. Brief wait then SIGKILL any survivors
    await new Promise((r) => setTimeout(r, 1500));
    for (const p of killed) {
      try { process.kill(p, "SIGKILL"); } catch { /* already dead */ }
    }

    return NextResponse.json({ ok: true, killed });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message });
  }
}
