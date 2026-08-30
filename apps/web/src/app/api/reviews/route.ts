// apps/web/src/app/api/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";

function getBaseUrl(): string {
  const url = process.env.API_BASE_URL;
  if (!url) {
    throw new Error("API_BASE_URL manquante.");
  }
  return url;
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  // L'IP du visiteur doit atteindre le backend : c'est elle qui porte le
  // quota anti-spam. Sans ce relais, toutes les soumissions partageraient
  // l'adresse du serveur Vercel.
  const forwarded =
    request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip");

  const res = await fetch(`${getBaseUrl()}/public/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(forwarded ? { "X-Forwarded-For": forwarded } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}