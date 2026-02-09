import { readReport, listReports } from "@/lib/reports";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ReportViewer } from "@/components/report-viewer";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const content = readReport(date);
  if (!content) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/reports">&larr; Back</Link>
        </Button>
        <h1 className="text-2xl font-bold">{date}</h1>
      </div>
      <ReportViewer content={content} />
    </div>
  );
}
