import type { Hono } from "hono";
import { catalogIntegration } from "../../../../integration/catalogIntegration";
import { parseId } from "../../../../shared/validation";
import { bookJson } from "../../infrastructure/json";
import { getBook } from "./getBook";
import { listBooksCached } from "./listBooksCached";

/** UC02: lista livros por ISBN, título ou autor, com cache no Redis. */
export function registerRoutes(api: Hono): void {
  api.get("/livros", async (c) => {
    const { books, cache } = await listBooksCached(c.req.query("q") ?? "", catalogIntegration);
    c.header("X-Cache", cache);
    return c.json(books.map(bookJson));
  });
  api.get("/livros/id/:id", async (c) => c.json(bookJson(await getBook(parseId(c.req.param("id")), catalogIntegration))));
  api.get("/livros/:q", async (c) => {
    const { books, cache } = await listBooksCached(c.req.param("q"), catalogIntegration);
    c.header("X-Cache", cache);
    return c.json(books.map(bookJson));
  });
}
