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

  const apiResponse = await fetch(`${getBaseUrl()}/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await apiResponse.json();

  if (!apiResponse.ok) {
    return NextResponse.json(data, { status: apiResponse.status });
  }

  // On ne renvoie PAS refresh_token au navigateur : seul l'access_token
  // est utile côté client (mémoire React). Le refresh reste géré via
  // cookie httpOnly, reposé ci-dessous sur le domaine du site.
  const response = NextResponse.json({
    access_token: data.access_token,
    expires_in: data.expires_in,
  });

  const setCookieHeader = apiResponse.headers.get("set-cookie");
  if (setCookieHeader) {
    response.headers.set("set-cookie", setCookieHeader);
  }

  return response;
}