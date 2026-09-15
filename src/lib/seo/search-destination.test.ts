import { getCanonicalSearchDestination } from "./search-destination";

const result = getCanonicalSearchDestination("MCP agent runtime security");
if (!result.url.startsWith("https://elitze.ca/")) {
  throw new Error("Canonical search destination must remain on elitze.ca");
}
