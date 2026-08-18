import { NextRequest, NextResponse } from "next/server";

function getBaseUrl(): string {
  const url = process.env.API_BASE_URL;
  if (!url) {
    throw new Error("API_BASE_URL manquante.");
  }
  return url;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";

  const apiResponse = await fetch(`${getBaseUrl()}/admin/auth/me`, {
    headers: { Authorization: authHeader },
  });

  const data = await apiResponse.json();

  return NextResponse.json(data, { status: apiResponse.status });
}