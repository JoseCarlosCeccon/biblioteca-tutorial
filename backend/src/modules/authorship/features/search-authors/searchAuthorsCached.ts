import type { RedisClient } from "bun";
import { redis } from "../../../../infrastructure/redis";
import type { AuthorView } from "../../domain/Author";
import type { AuthorshipIntegration } from "../../domain/AuthorshipIntegration";
import { readCachedSearch, writeCachedSearch, type CacheStatus } from "../../infrastructure/searchCache";
import { searchAuthors } from "./searchAuthors";

/** Cache-aside em volta da busca original, que conserva suas consultas ao Postgres. */
export async function searchAuthorsCached(
  term: string,
  integration: AuthorshipIntegration,
  client: RedisClient | null = redis,
): Promise<{ authors: AuthorView[]; cache: CacheStatus }> {
  const cached = await readCachedSearch(term, client);
  if (cached?.authors) return { authors: cached.authors, cache: "HIT" };

  const authors = await searchAuthors(term, integration);
  if (!cached) return { authors, cache: "BYPASS" };

  await writeCachedSearch(term, cached.generation, authors, client);
  return { authors, cache: "MISS" };
}
