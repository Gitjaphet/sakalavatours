import { NextRequest, NextResponse } from "next/server";

function getBaseUrl(): string {
  const url = process.env.API_BASE_URL;
  if (!url) {
    throw new Error("API_BASE_URL manquante.");
  }
  return url;
}

export async function POST(request: NextRequest) {
  const cookie = request.headers.get("cookie") ?? "";

  const apiResponse = await fetch(`${getBaseUrl()}/admin/auth/logout`, {
    method: "POST",
    headers: { Cookie: cookie },
  });

  const data = await apiResponse.json();

  const response = NextResponse.json(data, { status: apiResponse.status });

  const setCookieHeader = apiResponse.headers.get("set-cookie");
  if (setCookieHeader) {
    response.headers.set("set-cookie", setCookieHeader);
  }

  return response;
}