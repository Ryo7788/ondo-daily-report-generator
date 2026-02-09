"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

interface ReportMeta {
  date: string;
  sizeBytes: number;
}

interface Status {
  status: "idle" | "generating";
  todayReportExists: boolean;
}

interface Schedule {
  schedule: { hour: number; minute: number } | null;
  mainService: { loaded: boolean; lastExitStatus: number | null };
}

interface ApiStatus {
  fmp: { valid: boolean; keyPresent: boolean };
  polygon: { valid: boolean; keyPresent: boolean };
}

export default function Dashboard() {
  const [reports, setReports] = useState<ReportMeta[]>([]);
  const [status, setStatus] = useState<Status | null>(null);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [triggering, setTriggering] = useState(false);
  const t = useT();

  useEffect(() => {
    fetch("/api/reports").then((r) => r.json()).then(setReports);
    fetch("/api/schedule").then((r) => r.json()).then(setSchedule);
    fetch("/api/api-status").then((r) => r.json()).then(setApiStatus);

    const pollStatus = () =>
      fetch("/api/status").then((r) => r.json()).then(setStatus);
    pollStatus();
    const interval = setInterval(pollStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleTrigger = async () => {
    setTriggering(true);
    await fetch("/api/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "now" }),
    });
    setTriggering(false);
    fetch("/api/status").then((r) => r.json()).then(setStatus);
  };

  const latest = reports[0];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("dashboard")}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("status")}</CardTitle>
          </CardHeader>
          <CardContent>
            {status?.status === "generating" ? (
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                </span>
                <span className="font-semibold">{t("generating")}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-muted-foreground/30" />
                <span className="font-semibold">{t("idle")}</span>
              </div>
            )}
            {status?.todayReportExists && (
              <p className="text-xs text-muted-foreground mt-1">{t("todayReportReady")}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("latestReport")}</CardTitle>
          </CardHeader>
          <CardContent>
            {latest ? (
              <Link href={`/reports/${latest.date}`} className="hover:underline">
                <p className="font-semibold">{latest.date}</p>
                <p className="text-xs text-muted-foreground">{(latest.sizeBytes / 1024).toFixed(1)} KB</p>
              </Link>
            ) : (
              <p className="text-muted-foreground">{t("noReports")}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("schedule")}</CardTitle>
          </CardHeader>
          <CardContent>
            {schedule?.schedule ? (
              <>
                <p className="font-semibold">
                  Daily {String(schedule.schedule.hour).padStart(2, "0")}:
                  {String(schedule.schedule.minute).padStart(2, "0")}
                </p>
                <Badge variant={schedule.mainService.loaded ? "default" : "destructive"} className="mt-1">
                  {schedule.mainService.loaded ? t("active") : t("notLoaded")}
                </Badge>
              </>
            ) : (
              <p className="text-muted-foreground">{t("notConfigured")}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("apiHealth")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {apiStatus ? (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <span className={`h-2 w-2 rounded-full ${apiStatus.fmp.valid ? "bg-green-500" : "bg-red-500"}`} />
                  FMP {apiStatus.fmp.valid ? "OK" : "Error"}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className={`h-2 w-2 rounded-full ${apiStatus.polygon.valid ? "bg-green-500" : "bg-red-500"}`} />
                  Polygon {apiStatus.polygon.valid ? "OK" : "Error"}
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">{t("checking")}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">{t("quickActions")}</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button onClick={handleTrigger} disabled={triggering || status?.status === "generating"}>
            {triggering ? t("starting") : t("generateNow")}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/logs">{t("viewLogs")}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/reports">{t("allReports")}</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">{t("recentReports")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {reports.slice(0, 7).map((r) => (
              <Link
                key={r.date}
                href={`/reports/${r.date}`}
                className="flex items-center justify-between py-1 hover:bg-accent rounded px-2 -mx-2 transition-colors"
              >
                <span className="font-medium">{r.date}</span>
                <span className="text-sm text-muted-foreground">{(r.sizeBytes / 1024).toFixed(1)} KB</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
