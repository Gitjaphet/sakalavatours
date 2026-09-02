// apps/web/src/app/api/admin/messages/route.ts
import { NextRequest, NextResponse } from "next/server";

function getBaseUrl(): string {
  const url = process.env.API_BASE_URL;
  if (!url) {
    throw new Error("API_BASE_URL manquante.");
  }
  return url;
}

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json({ detail: "Non authentifié" }, { status: 401 });
  }

  const search = request.nextUrl.search;
  const res = await fetch(`${getBaseUrl()}/admin/messages${search}`, {
    headers: { Authorization: authorization, Accept: "application/json" },
    cache: "no-store",
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}