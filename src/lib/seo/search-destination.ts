export const CANONICAL_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://elitze.ca";

export const SEARCH_DESTINATIONS = [
  { path: "/", keywords: ["elitze", "agentic security", "security control plane", "security"], title: "ELITZE Agentic Security" },
  { path: "/platform", keywords: ["platform", "ai security", "agent security", "mcp", "api security", "runtime security"], title: "ELITZE Platform" },
  { path: "/security", keywords: ["policy", "guardrails", "enforcement", "vulnerability", "soc", "runtime", "threat"], title: "ELITZE Security" },
  { path: "/use-cases", keywords: ["use case", "agent reach", "identity", "exposure", "governance", "secops"], title: "ELITZE Use Cases" },
  { path: "/reo", keywords: ["reo", "search", "seo", "content", "search analytics", "publishing"], title: "ELITZE REO" },
  { path: "/compare", keywords: ["compare", "evaluation", "benchmark", "category"], title: "ELITZE Compare" },
  { path: "/sales", keywords: ["acquisition", "buy", "sale", "enterprise", "acquire"], title: "ELITZE Acquisition / Enterprise" },
] as const;

export function getCanonicalSearchDestination(query: string) {
  const normalized = query.toLowerCase();
  let best = SEARCH_DESTINATIONS[0];
  let bestScore = 0;

  for (const destination of SEARCH_DESTINATIONS) {
    const score = destination.keywords.reduce((total, keyword) => total + (normalized.includes(keyword) ? 1 : 0), 0);
    if (score > bestScore) {
      best = destination;
      bestScore = score;
    }
  }

  return {
    ...best,
    score: bestScore,
    url: `${CANONICAL_SITE_URL}${best.path}`,
  };
}
