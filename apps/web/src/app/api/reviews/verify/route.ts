// apps/web/src/app/api/reviews/verify/route.ts
import { NextRequest, NextResponse } from "next/server";

function getBaseUrl(): string {
  const url = process.env.API_BASE_URL;
  if (!url) {
    throw new Error("API_BASE_URL manquante.");
  }
  return url;
}

export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ detail: "Jeton manquant" }, { status: 400 });
  }

  const res = await fetch(
    `${getBaseUrl()}/public/reviews/verify?token=${encodeURIComponent(token)}`,
    { method: "POST", headers: { Accept: "application/json" }, cache: "no-store" },
  );

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}