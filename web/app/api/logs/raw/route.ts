import { NextResponse } from "next/server";
import { readRawLog, listLogDates } from "@/lib/logs";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const date = url.searchParams.get("date");

  if (!date) {
    const dates = listLogDates();
    return NextResponse.json({ dates });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  const types = url.searchParams.get("types")?.split(",").filter(Boolean);
  const offset = parseInt(url.searchParams.get("offset") || "0");
  const limit = parseInt(url.searchParams.get("limit") || "50");

  const result = readRawLog(date, { types, offset, limit });
  return NextResponse.json({ date, ...result });
}
