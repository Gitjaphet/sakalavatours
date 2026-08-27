// apps/web/src/app/api/admin/taxonomies/[type]/route.ts
import { NextRequest, NextResponse } from "next/server";

function getBaseUrl(): string {
  const url = process.env.API_BASE_URL;
  if (!url) {
    throw new Error("API_BASE_URL manquante.");
  }
  return url;
}

type RouteParams = { params: Promise<{ type: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { type } = await params;
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json({ detail: "Non authentifié" }, { status: 401 });
  }

  const res = await fetch(`${getBaseUrl()}/admin/taxonomies/${type}`, {
    headers: { Authorization: authorization, Accept: "application/json" },
    cache: "no-store",
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { type } = await params;
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json({ detail: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json();
  const res = await fetch(`${getBaseUrl()}/admin/taxonomies/${type}`, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}