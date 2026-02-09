import { NextResponse } from "next/server";
import { listReports } from "@/lib/reports";

export async function GET() {
  const reports = listReports();
  return NextResponse.json(reports);
}
