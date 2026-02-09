import { NextResponse } from "next/server";
import fs from "fs";
import { isGenerating } from "@/lib/launchd";
import { REPORTS_DIR, PROJECT_DIR } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  const { running, pid } = isGenerating();
  const today = new Date().toISOString().slice(0, 10);

  const todayReportExists =
    fs.existsSync(`${REPORTS_DIR}/ondo_daily_report_${today}.md`) ||
    fs.existsSync(`${PROJECT_DIR}/ondo_daily_report_${today}.md`);

  return NextResponse.json({
    status: running ? "generating" : "idle",
    pid,
    todayReportExists,
  });
}
