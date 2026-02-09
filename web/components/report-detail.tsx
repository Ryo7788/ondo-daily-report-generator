"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ReportViewer } from "@/components/report-viewer";
import { ReportToc } from "@/components/report-toc";
import { useT } from "@/lib/i18n";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  date: string;
  content: string;
  prevDate: string | null;
  nextDate: string | null;
}

export function ReportDetail({ date, content, prevDate, nextDate }: Props) {
  const t = useT();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/reports">&larr; {t("back")}</Link>
          </Button>
          <h1 className="text-2xl font-bold">{date}</h1>
        </div>
        <div className="flex items-center gap-2">
          {prevDate ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/reports/${prevDate}`}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t("prevReport")}
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t("prevReport")}
            </Button>
          )}
          {nextDate ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/reports/${nextDate}`}>
                {t("nextReport")}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              {t("nextReport")}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* Body with TOC sidebar */}
      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          <ReportViewer content={content} />
        </div>
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-6">
            <ReportToc content={content} />
          </div>
        </aside>
      </div>
    </div>
  );
}
