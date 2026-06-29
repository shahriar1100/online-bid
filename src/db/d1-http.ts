export const runtime = "edge";

import { ENV } from "../util/env";

type Params = (string | number | null)[];

export async function d1Query<T>(sql: string, params: Params = []): Promise<T[]> {
  const { CF_ACCOUNT_ID, CF_D1_DATABASE_ID, CF_API_TOKEN } = ENV;
  if (!CF_ACCOUNT_ID || !CF_D1_DATABASE_ID || !CF_API_TOKEN) {
    throw new Error("D1 HTTP credentials not set");
  }
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DATABASE_ID}/query`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CF_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, params }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`D1 error: ${res.status} ${text}`);
  }
  const data: { result?: { results?: T[] }[] } = await res.json();
  const rows: T[] = data?.result?.[0]?.results ?? [];
  return rows;
}
