"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useT } from "@/lib/i18n";

interface LogEntry {
  type: string;
  subtype?: string;
  textPreview?: string;
  toolName?: string;
  contentType?: string;
  durationMs?: number;
  costUsd?: number;
  resultPreview?: string;
}

const TYPE_COLORS: Record<string, string> = {
  system: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  assistant: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  user: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  result: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

export default function LogsPage() {
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [launchdLog, setLaunchdLog] = useState("");
  const [launchdSource, setLaunchdSource] = useState<"production" | "test">("test");
  const t = useT();

  useEffect(() => {
    fetch("/api/logs/raw")
      .then((r) => r.json())
      .then((data) => {
        setDates(data.dates || []);
        if (data.dates?.length > 0) setSelectedDate(data.dates[0]);
      });
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    const params = new URLSearchParams({ date: selectedDate, offset: String(offset), limit: "50" });
    if (typeFilter) params.set("types", typeFilter);
    fetch(`/api/logs/raw?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setEntries(data.entries || []);
        setTotal(data.total || 0);
      });
  }, [selectedDate, offset, typeFilter]);

  useEffect(() => {
    fetch(`/api/logs/launchd?source=${launchdSource}&stream=stdout`)
      .then((r) => r.json())
      .then((data) => setLaunchdLog(data.content || ""));
  }, [launchdSource]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("logs")}</h1>

      <Tabs defaultValue="raw">
        <TabsList>
          <TabsTrigger value="raw">{t("executionLogs")}</TabsTrigger>
          <TabsTrigger value="launchd">{t("launchdLogs")}</TabsTrigger>
        </TabsList>

        <TabsContent value="raw" className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <select
              className="border rounded px-3 py-1.5 text-sm bg-background"
              value={selectedDate}
              onChange={(e) => { setSelectedDate(e.target.value); setOffset(0); }}
            >
              {dates.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <div className="flex gap-1">
              {["", "assistant", "user", "system", "result"].map((tp) => (
                <Button
                  key={tp || "all"}
                  variant={typeFilter === tp ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setTypeFilter(tp); setOffset(0); }}
                >
                  {tp || t("all")}
                </Button>
              ))}
            </div>

            <span className="text-sm text-muted-foreground ml-auto">
              {total} {t("entries")}
            </span>
          </div>

          <Card>
            <CardContent className="pt-4">
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {entries.map((entry, i) => (
                    <div key={i} className="border rounded p-3 text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={TYPE_COLORS[entry.type] || ""} variant="outline">
                          {entry.type}
                        </Badge>
                        {entry.contentType === "tool_use" && (
                          <Badge variant="secondary">{entry.toolName}</Badge>
                        )}
                        {entry.subtype && (
                          <span className="text-xs text-muted-foreground">{entry.subtype}</span>
                        )}
                        {entry.durationMs && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            {(entry.durationMs / 1000).toFixed(1)}s
                          </span>
                        )}
                      </div>
                      {entry.textPreview && (
                        <p className="text-muted-foreground whitespace-pre-wrap break-words">
                          {entry.textPreview}
                        </p>
                      )}
                      {entry.resultPreview && (
                        <p className="text-muted-foreground whitespace-pre-wrap break-words">
                          {entry.resultPreview}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - 50))}
                >
                  {t("previous")}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {offset + 1} - {Math.min(offset + 50, total)} {t("of")} {total}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset + 50 >= total}
                  onClick={() => setOffset(offset + 50)}
                >
                  {t("next")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="launchd" className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={launchdSource === "test" ? "default" : "outline"}
              size="sm"
              onClick={() => setLaunchdSource("test")}
            >
              {t("test")}
            </Button>
            <Button
              variant={launchdSource === "production" ? "default" : "outline"}
              size="sm"
              onClick={() => setLaunchdSource("production")}
            >
              {t("production")}
            </Button>
          </div>
          <Card>
            <CardContent className="pt-4">
              <ScrollArea className="h-[600px]">
                <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                  {launchdLog || t("empty")}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
