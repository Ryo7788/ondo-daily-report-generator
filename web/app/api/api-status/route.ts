import { NextResponse } from "next/server";
import { checkApiKeys } from "@/lib/api-keys";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await checkApiKeys();
  return NextResponse.json(status);
}
