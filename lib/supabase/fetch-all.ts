import type { PostgrestError } from "@supabase/supabase-js";

const DEFAULT_PAGE_SIZE = 1000;

type PageResult<T> = {
  data: T[] | null;
  error: PostgrestError | null;
};

/** Fetch all rows from a Supabase query that may exceed PostgREST's default row limit. */
export async function fetchAllRows<T>(
  fetchPage: (from: number, to: number) => PromiseLike<PageResult<T>>,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await fetchPage(from, from + pageSize - 1);
    if (error) throw error;

    const batch = data ?? [];
    all.push(...batch);
    if (batch.length < pageSize) break;
    from += pageSize;
  }

  return all;
}
