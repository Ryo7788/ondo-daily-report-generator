"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";

interface Status {
  status: "idle" | "generating";
  pid: number | null;
}

export default function TriggerPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [scheduleTime, setScheduleTime] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState("");
  const t = useT();

  useEffect(() => {
    const poll = () => fetch("/api/status").then((r) => r.json()).then(setStatus);
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, []);

  const trigger = async (mode: string, time?: string) => {
    setLoading(mode);
    setMessage("");
    try {
      const res = await fetch("/api/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, time }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage(
          mode === "now"
            ? `Started! PID: ${data.pid}`
            : `Scheduled at ${data.time}`
        );
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (e) {
      setMessage(`Error: ${(e as Error).message}`);
    }
    setLoading("");
    fetch("/api/status").then((r) => r.json()).then(setStatus);
  };

  const cancel = async () => {
    setLoading("cancel");
    await fetch("/api/trigger/cancel", { method: "POST" });
    setMessage("Test schedule cancelled");
    setLoading("");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("trigger")}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {t("currentStatus")}
            {status?.status === "generating" ? (
              <Badge className="bg-green-500">{t("generating")} (PID: {status.pid})</Badge>
            ) : (
              <Badge variant="secondary">{t("idle")}</Badge>
            )}
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("instantTrigger")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t("instantTriggerDesc")}
            </p>
            <Button
              onClick={() => trigger("now")}
              disabled={loading === "now" || status?.status === "generating"}
              className="w-full"
            >
              {loading === "now" ? t("starting") : t("generateNow")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("scheduledTrigger")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t("scheduledTriggerDesc")}
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="+5 or 21:30"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
              />
              <Button
                onClick={() => trigger("schedule", scheduleTime)}
                disabled={!scheduleTime || loading === "schedule"}
              >
                {loading === "schedule" ? "..." : t("schedule")}
              </Button>
            </div>
            <Button variant="outline" onClick={cancel} disabled={loading === "cancel"} className="w-full">
              {t("cancelPendingTest")}
            </Button>
          </CardContent>
        </Card>
      </div>

      {message && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-mono">{message}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
