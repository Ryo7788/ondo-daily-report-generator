import { readReport, listReports } from "@/lib/reports";
import { notFound } from "next/navigation";
import { ReportDetail } from "@/components/report-detail";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const content = readReport(date);
  if (!content) notFound();

  const allReports = listReports();
  const dates = allReports.map((r) => r.date);
  const idx = dates.indexOf(date);
  // Reports are sorted newest first, so "next" is older (idx+1) and "prev" is newer (idx-1)
  const nextDate = idx >= 0 && idx < dates.length - 1 ? dates[idx + 1] : null;
  const prevDate = idx > 0 ? dates[idx - 1] : null;

  return (
    <ReportDetail
      date={date}
      content={content}
      prevDate={prevDate}
      nextDate={nextDate}
    />
  );
}
