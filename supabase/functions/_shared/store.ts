import { createClient, type SupabaseClient } from "@supabase/supabase-js";
export type Row = Record<string, any>;
export type Env = {
  SUPABASE_URL: string;
  PUBLIC_SUPABASE_URL?: string;
  SUPABASE_SECRET_KEY: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  OPENROUTER_API_KEY?: string;
  APP_ORIGIN: string;
  WORKER_SECRET: string;
};
export function admin(env: Env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          signal: init?.signal
            ? AbortSignal.any([init.signal, AbortSignal.timeout(30000)])
            : AbortSignal.timeout(30000),
        }),
    },
  });
}
export class Store {
  constructor(
    public db: SupabaseClient,
    public owner: string,
  ) {}
  async list(
    table: string,
    filter: Row = {},
    limit = 100,
    options: { order?: string; ascending?: boolean; offset?: number } = {},
  ) {
    let q = this.db
      .from(table)
      .select("*")
      .eq(table === "profiles" ? "id" : "owner_id", this.owner);
    for (const [k, v] of Object.entries(filter)) q = q.eq(k, v);
    if (options.order)
      q = q.order(options.order, { ascending: options.ascending ?? false });
    const offset = options.offset ?? 0;
    const { data, error } = await q.range(offset, offset + limit - 1);
    if (error) throw Error(error.message);
    return data as Row[];
  }
  async all(table: string, filter: Row = {}, order = "id") {
    const rows: Row[] = [];
    for (let offset = 0; ; offset += 1000) {
      const page = await this.list(table, filter, 1000, {
        order,
        ascending: true,
        offset,
      });
      rows.push(...page);
      if (page.length < 1000) return rows;
    }
  }
  async byIds(table: string, ids: string[]) {
    const rows: Row[] = [];
    for (let offset = 0; offset < ids.length; offset += 200) {
      const { data, error } = await this.db
        .from(table)
        .select("*")
        .eq("owner_id", this.owner)
        .in("id", ids.slice(offset, offset + 200));
      if (error) throw Error(error.message);
      rows.push(...data);
    }
    return rows;
  }
  async one(table: string, id: string) {
    const { data, error } = await this.db
      .from(table)
      .select("*")
      .eq("id", id)
      .eq("owner_id", this.owner)
      .single();
    if (error || !data) throw Error("NOT_FOUND");
    return data as Row;
  }
  async insert(table: string, row: Row) {
    const { data, error } = await this.db
      .from(table)
      .insert({ ...row, owner_id: this.owner })
      .select()
      .single();
    if (error) throw Error(error.message);
    return data as Row;
  }
  async put(table: string, row: Row, conflict = "id") {
    const { data, error } = await this.db
      .from(table)
      .upsert({ ...row, owner_id: this.owner }, { onConflict: conflict })
      .select()
      .single();
    if (error) throw Error(error.message);
    return data as Row;
  }
  async update(table: string, id: string, patch: Row) {
    const { data, error } = await this.db
      .from(table)
      .update(patch)
      .eq("id", id)
      .eq("owner_id", this.owner)
      .select()
      .single();
    if (error) throw Error(error.message);
    return data as Row;
  }
  async rpc(name: string, args: Row) {
    const { data, error } = await this.db.rpc(name, args);
    if (error) throw Error(error.message);
    return data;
  }
  async enqueue(
    type: string,
    key: string,
    payload: Row,
    run: string | null = null,
  ) {
    return this.rpc("center_enqueue", {
      p_owner: this.owner,
      p_type: type,
      p_key: key,
      p_payload: payload,
      p_run: run,
    });
  }
}
