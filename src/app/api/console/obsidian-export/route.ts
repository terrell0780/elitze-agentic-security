import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPgPool } from "@/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function markdownEscape(value: unknown, max = 320) {
  return String(value ?? "UNKNOWN").replace(/[\r\n|]/g, " ").trim().slice(0, max);
}

function obsidianNote(events: Array<Record<string, unknown>>, tenantLabel: string, exportedAt: string) {
  const lines = [
    "---",
    "title: ELITZE Security Evidence Export",
    "kind: security-evidence",
    "evidence_state: OBSERVED",
    "exported_at: " + JSON.stringify(exportedAt),
    "source: ELITZE tenant security fabric",
    "---",
    "",
    "# ELITZE Security Evidence",
    "",
    "> [!info] Evidence boundary",
    "> This note contains only tenant-scoped records explicitly marked OBSERVED. It is not a complete incident record, and missing evidence does not mean clean posture.",
    "",
    "- Tenant reference: " + JSON.stringify(tenantLabel),
    "- Exported: " + exportedAt,
    "- Observed records: " + events.length,
    "",
    "## Observations",
    "",
  ];
  if (!events.length) {
    lines.push("> [!warning] UNMEASURABLE", "No observed security-fabric records were available in this export window.", "");
  }
  for (const event of events) {
    const eventId = markdownEscape(event.id, 120);
    const connector = markdownEscape(event.connector_id, 80);
    const eventType = markdownEscape(event.event_type, 140);
    const subject = markdownEscape(event.subject_key, 220) || "Unattributed";
    const severity = markdownEscape(event.severity, 20);
    const observedAt = markdownEscape(event.observed_at, 80);
    const sourceRef = markdownEscape(event.source_ref, 320);
    const payload = event.payload && typeof event.payload === "object" ? event.payload as Record<string, unknown> : {};
    const cve = markdownEscape(payload.cveId ?? payload.cve ?? "");
    const technique = Array.isArray(payload.techniqueIds)
      ? payload.techniqueIds.filter((value): value is string => typeof value === "string").slice(0, 8).map(markdownEscape).join(", ")
      : markdownEscape(payload.techniqueId ?? "");
    lines.push(
      "### " + eventType,
      "",
      "- Record ID: " + eventId,
      "- Evidence: OBSERVED",
      "- Severity: " + severity,
      "- Subject: " + subject,
      "- Source connector: " + connector,
      "- Observed at: " + observedAt,
      "- Source reference: " + (sourceRef || "Not recorded"),
      ...(cve && cve !== "UNKNOWN" ? ["- CVE: " + cve] : []),
      ...(technique && technique !== "UNKNOWN" ? ["- ATT&CK techniques: " + technique.split(", ").map((id) => "[[" + id + "]]").join(", ")] : []),
      "",
    );
  }
  lines.push(
    "## Analyst follow-up",
    "",
    "- Review original source records before containment or remediation.",
    "- Preserve the source record and timestamp for each finding.",
    "- Keep absent asset reachability as UNMEASURABLE until a real inventory and authorization exist.",
    "",
    "## Reproducibility",
    "",
    "This note was generated from the ELITZE authenticated tenant boundary. It is a bounded export of the most recent source-observed records, not a substitute for the protected system-of-record.",
    "",
  );
  return lines.join("\n");
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const format = (request.nextUrl.searchParams.get("format") ?? "markdown").toLowerCase();
  if (!["markdown", "json", "obsidian"].includes(format)) {
    return NextResponse.json({ ok: false, error: "unsupported_export_format" }, { status: 400 });
  }

  try {
    const result = await getPgPool().query(
      `SELECT id,connector_id,event_type,subject_key,evidence_state,severity,observed_at,source_ref,payload
       FROM security_fabric_events
       WHERE tenant_id=$1 AND evidence_state='OBSERVED'
       ORDER BY observed_at DESC
       LIMIT 30`,
      [user.tenantId],
    );
    const exportedAt = new Date().toISOString();
    const events = result.rows as Array<Record<string, unknown>>;
    const title = "ELITZE Security Evidence " + exportedAt.slice(0, 10);
    const markdown = obsidianNote(events, user.tenantId, exportedAt);
    const obsidianUri = "obsidian://new?name=" + encodeURIComponent(title)
      + "&content=" + encodeURIComponent(markdown.slice(0, 5000));

    if (format === "json" || format === "obsidian") {
      return NextResponse.json({
        ok: true,
        evidenceState: events.length ? "OBSERVED" : "UNMEASURABLE",
        source: "tenant-scoped security_fabric_events",
        exportedAt,
        recordCount: events.length,
        fileName: title.replaceAll(" ", "-") + ".md",
        markdown,
        obsidianUri,
        uriNote: "The obsidian:// URI is a convenience import for the bounded note content. Download the full Markdown file for the complete exported note.",
      }, { headers: { "cache-control": "no-store" } });
    }

    return new NextResponse(markdown, {
      status: 200,
      headers: {
        "content-type": "text/markdown; charset=utf-8",
        "content-disposition": `attachment; filename="${title.replaceAll(" ", "-")}.md"`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    console.error("ELITZE Obsidian evidence export failed", error);
    return NextResponse.json({ ok: false, error: "obsidian_export_unavailable", evidenceState: "UNMEASURABLE" }, { status: 503 });
  }
}
