// apps/web/src/app/api/admin/media/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

function getBaseUrl(): string {
  const url = process.env.API_BASE_URL;
  if (!url) {
    throw new Error("API_BASE_URL manquante.");
  }
  return url;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json({ detail: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;

  const res = await fetch(`${getBaseUrl()}/admin/media/${id}`, {
    method: "DELETE",
    headers: { Authorization: authorization, Accept: "application/json" },
    cache: "no-store",
  });

  // Une suppression renvoie souvent 204 sans corps : res.json() leverait
  // alors une exception et masquerait un succes derriere une fausse erreur.
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return new NextResponse(null, { status: res.status });
  }

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
