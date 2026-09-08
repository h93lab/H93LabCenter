import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
const url = import.meta.env.VITE_SUPABASE_URL,
  key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key)
  throw Error("Supabase environment is missing. Configure .env.local.");
export const supabase = createClient<Database>(url, key);
export type Row = Record<string, any>;
export async function api<T = Row>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const response = await fetch(
    (import.meta.env.VITE_API_URL || "/api") + path,
    {
      method,
      headers: {
        Authorization: "Bearer " + session?.access_token,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
  );
  const result = await response.json();
  if (!response.ok || !result.ok)
    throw Error(
      result.error?.message || result.error?.code || "Request failed",
    );
  return result.data;
}
export const money = (v: number | undefined) =>
  v === undefined
    ? "Unknown"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 3,
      }).format(v);
export const human = (s: unknown) =>
  String(s ?? "Unknown")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
export const date = (s: string | undefined) =>
  s
    ? new Date(s).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Not yet";
