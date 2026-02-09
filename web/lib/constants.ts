import path from "path";

export const PROJECT_DIR = "/path/to/ondo-daily-report-generator";
export const REPORTS_DIR = path.join(PROJECT_DIR, "reports");
export const LOGS_DIR = path.join(PROJECT_DIR, "logs");
export const SCRIPTS_DIR = path.join(PROJECT_DIR, "scripts");
export const ENV_FILE = path.join(PROJECT_DIR, ".env");

export const LAUNCHD_LOG_DIR = "/tmp/ondo-daily-report";
export const MAIN_PLIST_PATH = path.join(
  process.env.HOME || "$HOME",
  "Library/LaunchAgents/com.ondo.daily-report.plist"
);
export const TEST_PLIST_PATH = path.join(
  process.env.HOME || "$HOME",
  "Library/LaunchAgents/com.ondo.daily-report-test.plist"
);

export const MAIN_PLIST_LABEL = "com.ondo.daily-report";
export const TEST_PLIST_LABEL = "com.ondo.daily-report-test";
