import { NextResponse } from "next/server";
import { getScheduleInfo } from "@/lib/launchd";

export const dynamic = "force-dynamic";

export async function GET() {
  const info = getScheduleInfo();
  return NextResponse.json(info);
}
