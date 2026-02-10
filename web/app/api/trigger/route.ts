import { NextResponse } from "next/server";
import { spawn, execSync } from "child_process";
import os from "os";
import fs from "fs";
import path from "path";
import {
  SCRIPTS_DIR,
  PROJECT_DIR,
  TEST_PLIST_LABEL,
  TEST_PLIST_PATH,
  LAUNCHD_LOG_DIR,
} from "@/lib/constants";

export async function POST(req: Request) {
  const body = await req.json();
  const { mode, time } = body as { mode: string; time?: string };

  if (mode === "now") {
    const child = spawn(
      "/bin/bash",
      [path.join(SCRIPTS_DIR, "auto_ondo_report.sh"), "--test"],
      {
        cwd: PROJECT_DIR,
        detached: true,
        stdio: "ignore",
        env: {
          ...process.env,
          PATH: "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin",
          HOME: os.homedir(),
        },
      }
    );
    child.unref();
    return NextResponse.json({ ok: true, mode: "now", pid: child.pid });
  }

  if (mode === "schedule" && time) {
    // Validate time format: +N (minutes) or HH:MM (24h)
    if (!/^(\+\d+|\d{1,2}:\d{2})$/.test(time)) {
      return NextResponse.json(
        { error: "Invalid time format. Use +N or HH:MM" },
        { status: 400 }
      );
    }

    let hour: number, minute: number;
    if (time.startsWith("+")) {
      const minutes = parseInt(time.slice(1));
      if (minutes <= 0 || minutes > 1440) {
        return NextResponse.json(
          { error: "Minutes must be between 1 and 1440" },
          { status: 400 }
        );
      }
      const target = new Date(Date.now() + minutes * 60 * 1000);
      hour = target.getHours();
      minute = target.getMinutes();
    } else {
      const parts = time.split(":");
      hour = parseInt(parts[0]);
      minute = parseInt(parts[1]);
      if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        return NextResponse.json(
          { error: "Invalid time. Hour: 0-23, Minute: 0-59" },
          { status: 400 }
        );
      }
    }

    // Unload existing test job
    try {
      execSync(
        `launchctl bootout gui/$(id -u)/${TEST_PLIST_LABEL} 2>/dev/null`,
        { timeout: 5000 }
      );
    } catch {
      // ignore
    }

    // Create plist
    fs.mkdirSync(LAUNCHD_LOG_DIR, { recursive: true });
    fs.writeFileSync(
      TEST_PLIST_PATH,
      `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${TEST_PLIST_LABEL}</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>${SCRIPTS_DIR}/auto_ondo_report.sh</string>
        <string>--test</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>${hour}</integer>
        <key>Minute</key>
        <integer>${minute}</integer>
    </dict>
    <key>WorkingDirectory</key>
    <string>${PROJECT_DIR}</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
        <key>HOME</key>
        <string>${os.homedir()}</string>
    </dict>
    <key>StandardOutPath</key>
    <string>${LAUNCHD_LOG_DIR}/test_stdout.log</string>
    <key>StandardErrorPath</key>
    <string>${LAUNCHD_LOG_DIR}/test_stderr.log</string>
    <key>KeepAlive</key>
    <false/>
</dict>
</plist>`
    );

    // Load plist
    execSync(`launchctl bootstrap gui/$(id -u) "${TEST_PLIST_PATH}"`, {
      timeout: 5000,
    });

    return NextResponse.json({
      ok: true,
      mode: "schedule",
      time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    });
  }

  return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
}
