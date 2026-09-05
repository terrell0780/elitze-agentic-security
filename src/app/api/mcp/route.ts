import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

const TOKEN = process.env.ELITZE_MCP_TOKEN;

function unauthorized() {
  return new Response(JSON.stringify({ error: "MCP authentication is not configured or the supplied token is invalid." }), {
    status: TOKEN ? 401 : 503,
    headers: { "content-type": "application/json" },
  });
}

function authorized(request: Request) {
  if (!TOKEN) return false;
  return request.headers.get("authorization") === `Bearer ${TOKEN}`;
}

async function googleRequest(path: string, body: unknown) {
  const token = process.env.GOOGLE_ACCESS_TOKEN;
  if (!token) throw new Error("GOOGLE_ACCESS_TOKEN is required for live Google data.");
  const response = await fetch(`https://www.googleapis.com${path}`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Google API request failed (${response.status}).`);
  return text ? JSON.parse(text) : null;
}

function createServer() {
  const server = new McpServer({ name: "ELITZE REO SEO Web Analytics", version: "1.0.0" });

  server.registerTool(
    "search_performance",
    {
      title: "Search performance",
      description: "Query live Google Search Console Search Analytics data for an authorized property.",
      inputSchema: z.object({
        siteUrl: z.string().min(1),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        dimensions: z.array(z.enum(["date", "query", "page", "country", "device", "searchAppearance"])).default(["date"]),
        type: z.enum(["web", "image", "video", "news", "discover", "googleNews"]).default("web"),
        rowLimit: z.number().int().min(1).max(25000).default(1000),
      }),
    },
    async ({ siteUrl, startDate, endDate, dimensions, type, rowLimit }) => {
      try {
        const data = await googleRequest(`/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
          startDate, endDate, dimensions, type, rowLimit, dataState: "final",
        });
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      } catch (error) {
        return { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : "Search performance request failed." }] };
      }
    },
  );

  server.registerTool(
    "ga4_report",
    {
      title: "GA4 report",
      description: "Run a live Google Analytics Data API report for an authorized GA4 property. No synthetic metrics are generated.",
      inputSchema: z.object({
        propertyId: z.string().min(1),
        startDate: z.string().min(1),
        endDate: z.string().min(1),
        dimensions: z.array(z.string().min(1)).default([]),
        metrics: z.array(z.string().min(1)).min(1),
        limit: z.number().int().min(1).max(100000).default(1000),
      }),
    },
    async ({ propertyId, startDate, endDate, dimensions, metrics, limit }) => {
      try {
        const data = await googleRequest(`/analytics/data/v1beta/properties/${encodeURIComponent(propertyId)}:runReport`, {
          dateRanges: [{ startDate, endDate }],
          dimensions: dimensions.map((name) => ({ name })),
          metrics: metrics.map((name) => ({ name })),
          limit: String(limit),
        });
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      } catch (error) {
        return { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : "GA4 report request failed." }] };
      }
    },
  );

  server.registerTool(
    "seo_data_requirements",
    {
      title: "SEO data requirements",
      description: "Return the live-data requirements for ELITZE REO SEO Web Analytics. This tool never fabricates unavailable metrics.",
      inputSchema: z.object({}),
    },
    async () => ({
      content: [{ type: "text", text: JSON.stringify({
        search_console: ["GOOGLE_ACCESS_TOKEN", "authorized Search Console property"],
        ga4: ["GOOGLE_ACCESS_TOKEN", "authorized GA4 property"],
        policy: "Unavailable data is reported as unavailable; no synthetic or demo metrics are returned.",
        supported_search_console_dimensions: ["date", "query", "page", "country", "device", "searchAppearance"],
      }) }],
    }),
  );

  return server;
}

const handler = createMcpHandler(() => createServer(), { legacy: "stateless", responseMode: "auto" });

async function guarded(request: Request) {
  if (!authorized(request)) return unauthorized();
  return handler.fetch(request);
}

export const GET = guarded;
export const POST = guarded;
export const DELETE = guarded;
