import type { SearchRequest, SearchResponse } from "../types";

const API_URL = (import.meta as any).env.VITE_API_URL as string;

export async function searchCompanies(req: SearchRequest): Promise<SearchResponse> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${t || "fetch failed"}`);
  }
  return res.json();
}
