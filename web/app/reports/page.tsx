"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { FileText } from "lucide-react";

interface ReportMeta {
  date: string;
  filename: string;
  sizeBytes: number;
  modifiedAt: string;
  location: string;
  title?: string;
  highlights?: string[];
}

const WEEKDAYS_ZH = ["日", "一", "二", "三", "四", "五", "六"];
const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatWeekday(dateStr: string, lang: string) {
  const d = new Date(dateStr + "T00:00:00");
  return lang === "zh" ? `周${WEEKDAYS_ZH[d.getDay()]}` : WEEKDAYS_EN[d.getDay()];
}

function isToday(dateStr: string) {
  return dateStr === new Date().toISOString().slice(0, 10);
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportMeta[] | null>(null);
  const t = useT();

  useEffect(() => {
    fetch("/api/reports").then((r) => r.json()).then(setReports);
  }, []);

  if (reports === null) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t("reports")}</h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="py-4 px-5">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-10 bg-muted rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center gap-4">
        <FileText className="h-16 w-16 text-muted-foreground/30" />
        <h1 className="text-2xl font-bold">{t("noReportsYet")}</h1>
        <p className="text-muted-foreground max-w-md">{t("noReportsYetDesc")}</p>
        <Button asChild>
          <Link href="/">{t("goToDashboard")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("reports")}</h1>
        <span className="text-sm text-muted-foreground">{reports.length} {t("entries")}</span>
      </div>

      <div className="space-y-3">
        {reports.map((r) => (
          <Link key={r.date + r.filename} href={`/reports/${r.date}`} className="block">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardContent className="py-4 px-5">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center shrink-0 w-14 pt-0.5">
                    <span className="text-lg font-bold">{r.date.slice(8)}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatWeekday(r.date, "zh")}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">
                        {r.title || `Ondo 日报 ${r.date}`}
                      </h3>
                      {isToday(r.date) && (
                        <Badge className="shrink-0">Today</Badge>
                      )}
                    </div>

                    {r.highlights && r.highlights.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {r.highlights.map((h, i) => (
                          <span key={i} className="text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5 truncate max-w-[280px]">
                            {h}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground shrink-0 text-right space-y-1 pt-0.5">
                    <div>{(r.sizeBytes / 1024).toFixed(1)} KB</div>
                    <div>{r.date.slice(0, 7)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
