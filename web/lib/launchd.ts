import { execSync } from "child_process";
import fs from "fs";
import { MAIN_PLIST_PATH, TEST_PLIST_PATH, MAIN_PLIST_LABEL, TEST_PLIST_LABEL } from "./constants";

export interface ServiceStatus {
  loaded: boolean;
  lastExitStatus: number | null;
  pid: number | null;
}

export interface ScheduleInfo {
  hour: number;
  minute: number;
}

function parseLaunchctlList(label: string): ServiceStatus {
  try {
    const output = execSync(`launchctl list ${label} 2>/dev/null`, {
      encoding: "utf-8",
      timeout: 5000,
    });
    const exitMatch = output.match(/"LastExitStatus"\s*=\s*(\d+)/);
    const pidMatch = output.match(/"PID"\s*=\s*(\d+)/);
    return {
      loaded: true,
      lastExitStatus: exitMatch ? parseInt(exitMatch[1]) : null,
      pid: pidMatch ? parseInt(pidMatch[1]) : null,
    };
  } catch {
    return { loaded: false, lastExitStatus: null, pid: null };
  }
}

function parseScheduleFromPlist(plistPath: string): ScheduleInfo | null {
  if (!fs.existsSync(plistPath)) return null;
  try {
    const content = fs.readFileSync(plistPath, "utf-8");
    const hourMatch = content.match(
      /<key>Hour<\/key>\s*<integer>(\d+)<\/integer>/
    );
    const minuteMatch = content.match(
      /<key>Minute<\/key>\s*<integer>(\d+)<\/integer>/
    );
    if (hourMatch && minuteMatch) {
      return { hour: parseInt(hourMatch[1]), minute: parseInt(minuteMatch[1]) };
    }
    return null;
  } catch {
    return null;
  }
}

export function getScheduleInfo() {
  return {
    schedule: parseScheduleFromPlist(MAIN_PLIST_PATH),
    mainService: parseLaunchctlList(MAIN_PLIST_LABEL),
    testService: parseLaunchctlList(TEST_PLIST_LABEL),
    testSchedule: parseScheduleFromPlist(TEST_PLIST_PATH),
  };
}

export function isGenerating(): {
  running: boolean;
  pid: number | null;
} {
  try {
    const output = execSync('pgrep -f "auto_ondo_report\\.sh" 2>/dev/null', {
      encoding: "utf-8",
      timeout: 5000,
    });
    const pid = parseInt(output.trim().split("\n")[0]);
    return { running: true, pid };
  } catch {
    // no process found
  }
  try {
    const output = execSync('pgrep -f "claude.*-p" 2>/dev/null', {
      encoding: "utf-8",
      timeout: 5000,
    });
    const pid = parseInt(output.trim().split("\n")[0]);
    return { running: true, pid };
  } catch {
    // no process found
  }
  return { running: false, pid: null };
}
