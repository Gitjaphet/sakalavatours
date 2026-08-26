// apps/web/src/app/api/revalidate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-revalidate-secret");
  const expected = process.env.NEXTJS_REVALIDATE_SECRET;

  if (!expected) {
    return NextResponse.json(
      { detail: "NEXTJS_REVALIDATE_SECRET manquante côté frontend" },
      { status: 500 },
    );
  }

  if (secret !== expected) {
    return NextResponse.json({ detail: "Secret invalide" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const slug = body?.slug as string | undefined;

  if (!slug || typeof slug !== "string") {
    return NextResponse.json({ detail: "slug manquant" }, { status: 400 });
  }

  revalidateTag(`product:${slug}`, "max");
  revalidateTag("products", "max");

  return NextResponse.json({ revalidated: true, slug });
}