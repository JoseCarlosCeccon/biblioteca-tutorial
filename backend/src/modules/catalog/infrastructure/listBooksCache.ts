import type { RedisClient } from "bun";
import { ready, redis, redisKey } from "../../../infrastructure/redis";
import type { BookView } from "../domain/Book";

export type BookCacheStatus = "HIT" | "MISS" | "BYPASS";

const TTL_SECONDS = 60;
const GENERATION = redisKey("acervo", "livros", "geracao");

function generationHash(generation: number): string {
  return redisKey("acervo", "livros", String(generation));
}

function field(term: string): string {
  return `q:${term.trim().toLocaleLowerCase("pt-BR")}`;
}

export async function readCachedBookList(term: string, client: RedisClient | null = redis): Promise<{ generation: number; books: BookView[] | null } | null> {
  if (!client) return null;
  try {
    await ready(client);
    const generation = Number((await client.get(GENERATION)) ?? 0);
    const cached = await client.hget(generationHash(generation), field(term));
    return { generation, books: cached === null ? null : JSON.parse(cached) as BookView[] };
  } catch (error) {
    console.warn("Cache de livros indisponível:", (error as Error).message);
    return null;
  }
}

export async function writeCachedBookList(term: string, generation: number, books: BookView[], client: RedisClient | null = redis): Promise<void> {
  if (!client) return;
  try {
    await ready(client);
    await client.send("HSETEX", [generationHash(generation), "EX", String(TTL_SECONDS), "FIELDS", "1", field(term), JSON.stringify(books)]);
  } catch (error) {
    console.warn("Cache de livros indisponível:", (error as Error).message);
  }
}

/** Avança a geração depois do commit de uma escrita que altera a lista. */
export async function invalidateBookList(client: RedisClient | null = redis): Promise<void> {
  if (!client) return;
  try {
    await ready(client);
    await client.incr(GENERATION);
  } catch (error) {
    console.warn("Cache de livros indisponível:", (error as Error).message);
  }
}
