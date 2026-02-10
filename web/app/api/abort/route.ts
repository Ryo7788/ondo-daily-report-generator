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
    // Kill the entire process group tree:
    // auto_ondo_report.sh → claude -p → child tools (playwright, etc.)
    // Use pkill to find and kill all related processes
    const killed: number[] = [];

    // 1. Kill claude processes spawned by auto_ondo_report.sh
    try {
      const claudePids = execSync('pgrep -f "claude.*-p" 2>/dev/null', {
        encoding: "utf-8",
        timeout: 3000,
      }).trim().split("\n").filter(Boolean).map(Number);
      for (const p of claudePids) {
        try { process.kill(p, "SIGTERM"); killed.push(p); } catch { /* already dead */ }
      }
    } catch { /* no match */ }

    // 2. Kill auto_ondo_report.sh
    try {
      const shPids = execSync('pgrep -f "auto_ondo_report\\.sh" 2>/dev/null', {
        encoding: "utf-8",
        timeout: 3000,
      }).trim().split("\n").filter(Boolean).map(Number);
      for (const p of shPids) {
        try { process.kill(p, "SIGTERM"); killed.push(p); } catch { /* already dead */ }
      }
    } catch { /* no match */ }

    // 3. Kill any remaining Chrome for Testing (Playwright browser)
    try {
      execSync('pkill -f "Google Chrome for Testing" 2>/dev/null', { timeout: 3000 });
    } catch { /* no match */ }

    // 4. If nothing was killed above, try killing by the detected PID directly
    if (killed.length === 0) {
      try { process.kill(pid, "SIGTERM"); killed.push(pid); } catch { /* already dead */ }
    }

    // Brief wait then SIGKILL any survivors
    await new Promise((r) => setTimeout(r, 1000));
    for (const p of killed) {
      try { process.kill(p, "SIGKILL"); } catch { /* already dead */ }
    }

    return NextResponse.json({ ok: true, killed });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message });
  }
}
