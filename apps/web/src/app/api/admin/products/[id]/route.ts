// apps/web/src/app/api/admin/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

function getBaseUrl(): string {
  const url = process.env.API_BASE_URL;
  if (!url) {
    throw new Error("API_BASE_URL manquante.");
  }
  return url;
}

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json({ detail: "Non authentifié" }, { status: 401 });
  }

  const search = request.nextUrl.search; // conserve ?locale=
  const res = await fetch(`${getBaseUrl()}/admin/products/${id}${search}`, {
    headers: { Authorization: authorization, Accept: "application/json" },
    cache: "no-store",
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json({ detail: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json();
  const res = await fetch(`${getBaseUrl()}/admin/products/${id}`, {
    method: "PATCH",
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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json({ detail: "Non authentifié" }, { status: 401 });
  }

  const res = await fetch(`${getBaseUrl()}/admin/products/${id}`, {
    method: "DELETE",
    headers: { Authorization: authorization, Accept: "application/json" },
    cache: "no-store",
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}