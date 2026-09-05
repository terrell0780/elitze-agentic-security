import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";

const server = new McpServer({
  name: "elitze-reo-seo-analytics",
  version: "1.0.0",
});

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.");

server.registerTool(
  "google_search_console_search_analytics",
  {
    title: "ELITZE REO Google Search Console Analytics",
    description: "Query tenant-authorized Google Search Console Search Analytics data. No synthetic SEO metrics are generated.",
    inputSchema: z.object({
      siteUrl: z.string().min(1),
      startDate: date,
      endDate: date,
      dimensions: z.array(z.enum(["query", "page", "country", "device", "searchAppearance", "date"])).min(1).max(5),
      rowLimit: z.number().int().min(1).max(25000).default(1000),
    }),
  },
  async ({ siteUrl, startDate, endDate, dimensions, rowLimit }) => {
    const token = process.env.GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN;
    if (!token) {
      return {
        isError: true,
        content: [{ type: "text", text: "UNAVAILABLE: GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN is not configured for this runtime." }],
      };
    }

    const encodedSite = encodeURIComponent(siteUrl);
    const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ startDate, endDate, dimensions, rowLimit }),
    });

    const body = await response.text();
    if (!response.ok) {
      return {
        isError: true,
        content: [{ type: "text", text: `Google Search Console returned HTTP ${response.status}: ${body}` }],
      };
    }

    return {
      content: [{ type: "text", text: body }],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("ELITZE REO SEO Analytics MCP server running on stdio");
