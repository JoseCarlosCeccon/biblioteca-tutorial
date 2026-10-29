import { expect, test } from "bun:test";
import { api, testAuthor, testIsbn, testName } from "#tests/api";

test("UC02: list-books devolve MISS e depois HIT para a mesma busca", async () => {
  const author = await testAuthor();
  const input = { isbn: testIsbn(), titulo: testName("Listagem"), autorId: author.id };
  expect((await api("POST", "/livros", input)).status).toBe(201);

  const first = await api("GET", `/livros?q=${encodeURIComponent(input.titulo)}`);
  expect(first.status).toBe(200);
  expect(first.headers.get("X-Cache")).toBe("MISS");
  expect((await first.json()).some((book: { isbn: string }) => book.isbn === input.isbn)).toBe(true);

  const second = await api("GET", `/livros?q=${encodeURIComponent(input.titulo)}`);
  expect(second.headers.get("X-Cache")).toBe("HIT");
});

test("UC02: criar livro invalida a listagem em cache", async () => {
  const author = await testAuthor();
  expect((await api("GET", "/livros?q=")).headers.get("X-Cache")).toBe("MISS");
  expect((await api("GET", "/livros?q=")).headers.get("X-Cache")).toBe("HIT");

  expect((await api("POST", "/livros", { isbn: testIsbn(), titulo: testName("Novo"), autorId: author.id })).status).toBe(201);
  expect((await api("GET", "/livros?q=")).headers.get("X-Cache")).toBe("MISS");
});
