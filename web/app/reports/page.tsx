"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ReportMeta {
  date: string;
  filename: string;
  sizeBytes: number;
  modifiedAt: string;
  location: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportMeta[]>([]);

  useEffect(() => {
    fetch("/api/reports").then((r) => r.json()).then(setReports);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Generated Reports ({reports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Modified</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((r) => (
                <TableRow key={r.date + r.filename} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/reports/${r.date}`} className="font-medium hover:underline">
                      {r.date}
                    </Link>
                  </TableCell>
                  <TableCell>{(r.sizeBytes / 1024).toFixed(1)} KB</TableCell>
                  <TableCell>
                    <Badge variant="outline">{r.location}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(r.modifiedAt).toLocaleString("zh-CN")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
