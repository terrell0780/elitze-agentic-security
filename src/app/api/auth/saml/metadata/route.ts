import { NextResponse } from "next/server";
import { isSamlConfigured, samlMetadata } from "@/lib/saml";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    if (!isSamlConfigured()) return NextResponse.json({ error: "saml_not_configured" }, { status: 503 });
    return new NextResponse(samlMetadata(), {
      status: 200,
      headers: {
        "content-type": "application/xml; charset=utf-8",
        "cache-control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error("ELITZE SAML metadata failed", error);
    return NextResponse.json({ error: "saml_metadata_unavailable" }, { status: 503 });
  }
}
