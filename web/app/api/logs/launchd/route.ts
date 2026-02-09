import { NextResponse } from "next/server";
import { readLaunchdLog } from "@/lib/logs";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const source = (url.searchParams.get("source") || "production") as
    | "production"
    | "test";
  const stream = (url.searchParams.get("stream") || "stdout") as
    | "stdout"
    | "stderr";

  const content = readLaunchdLog(source, stream);
  return NextResponse.json({ source, stream, content });
}
