import path from "path";
import os from "os";

// PROJECT_DIR: web/ is cwd in Next.js, project root is one level up.
// Can be overridden via ONDO_PROJECT_DIR env var.
export const PROJECT_DIR =
  process.env.ONDO_PROJECT_DIR ||
  path.resolve(process.cwd(), "..");

export const REPORTS_DIR = path.join(PROJECT_DIR, "reports");
export const LOGS_DIR = path.join(PROJECT_DIR, "logs");
export const SCRIPTS_DIR = path.join(PROJECT_DIR, "scripts");
export const ENV_FILE = path.join(PROJECT_DIR, ".env");

const HOME = os.homedir();

export const LAUNCHD_LOG_DIR = "/tmp/ondo-daily-report";
export const MAIN_PLIST_PATH = path.join(
  HOME,
  "Library/LaunchAgents/com.ondo.daily-report.plist"
);
export const TEST_PLIST_PATH = path.join(
  HOME,
  "Library/LaunchAgents/com.ondo.daily-report-test.plist"
);

export const MAIN_PLIST_LABEL = "com.ondo.daily-report";
export const TEST_PLIST_LABEL = "com.ondo.daily-report-test";
