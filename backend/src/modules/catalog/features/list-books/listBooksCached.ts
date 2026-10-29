import type { RedisClient } from "bun";
import { redis } from "../../../../infrastructure/redis";
import type { BookView } from "../../domain/Book";
import type { CatalogIntegration } from "../../domain/CatalogIntegration";
import { readCachedBookList, writeCachedBookList, type BookCacheStatus } from "../../infrastructure/listBooksCache";
import { listBooks } from "./listBooks";

/** Cache-aside da listagem de livros. */
export async function listBooksCached(term: string, integration: CatalogIntegration, client: RedisClient | null = redis): Promise<{ books: BookView[]; cache: BookCacheStatus }> {
  const cached = await readCachedBookList(term, client);
  if (cached?.books) return { books: cached.books, cache: "HIT" };
  const books = await listBooks(term, integration);
  if (!cached) return { books, cache: "BYPASS" };
  await writeCachedBookList(term, cached.generation, books, client);
  return { books, cache: "MISS" };
}
