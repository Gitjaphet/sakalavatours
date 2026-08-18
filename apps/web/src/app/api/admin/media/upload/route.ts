// apps/web/src/app/api/admin/media/upload/route.ts
import { NextRequest, NextResponse } from "next/server";

function getBaseUrl(): string {
  const url = process.env.API_BASE_URL;
  if (!url) {
    throw new Error("API_BASE_URL manquante.");
  }
  return url;
}

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json({ detail: "Non authentifié" }, { status: 401 });
  }

  // Relais direct du FormData reçu — pas de reparsing, pour préserver
  // le fichier binaire tel quel.
  const formData = await request.formData();

  const res = await fetch(`${getBaseUrl()}/admin/media`, {
    method: "POST",
    headers: { Authorization: authorization },
    body: formData,
    cache: "no-store",
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}