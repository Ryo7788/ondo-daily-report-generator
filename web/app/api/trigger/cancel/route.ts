import { NextResponse } from "next/server";
import { execSync } from "child_process";
import fs from "fs";
import { TEST_PLIST_LABEL, TEST_PLIST_PATH } from "@/lib/constants";

export async function POST() {
  try {
    execSync(
      `launchctl bootout gui/$(id -u)/${TEST_PLIST_LABEL} 2>/dev/null`,
      { timeout: 5000 }
    );
  } catch {
    // might not be loaded
  }

  if (fs.existsSync(TEST_PLIST_PATH)) {
    fs.unlinkSync(TEST_PLIST_PATH);
  }

  return NextResponse.json({ ok: true });
}
