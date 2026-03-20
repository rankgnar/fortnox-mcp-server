import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FortnoxClient } from "../client/fortnox.js";
import { cacheGet, cacheSet } from "../cache/redis.js";

export function register(server: McpServer, client: FortnoxClient) {
  server.tool(
    "list_articles",
    "Lista artículos/productos. Puedes buscar por descripción, EAN, proveedor o fabricante",
    {
      description: z.string().optional().describe("Filtrar por descripción"),
      articlenumber: z.string().optional().describe("Filtrar por número de artículo"),
      ean: z.string().optional().describe("Filtrar por código EAN"),
      suppliernumber: z.string().optional().describe("Filtrar por número de proveedor"),
      manufacturer: z.string().optional().describe("Filtrar por fabricante"),
      page: z.number().optional().describe("Página"),
      limit: z.number().optional().describe("Resultados por página"),
    },
    async (input) => {
      const cacheKey = `articles:list:${input.description || input.articlenumber || "all"}:${input.page || 1}`;
      const cached = await cacheGet(cacheKey);
      if (cached) return { content: [{ type: "text" as const, text: JSON.stringify(cached, null, 2) }] };

      const data = await client.get("/3/articles", {
        description: input.description,
        articlenumber: input.articlenumber,
        ean: input.ean,
        suppliernumber: input.suppliernumber,
        manufacturer: input.manufacturer,
        page: input.page || 1,
        limit: input.limit || 100,
      });

      await cacheSet(cacheKey, data, 600);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_article",
    "Obtiene los detalles de un artículo/producto por su número",
    {
      number: z.string().describe("Número de artículo"),
    },
    async ({ number }) => {
      const cacheKey = `articles:${number}`;
      const cached = await cacheGet(cacheKey);
      if (cached) return { content: [{ type: "text" as const, text: JSON.stringify(cached, null, 2) }] };

      const data = await client.get(`/3/articles/${number}`);
      await cacheSet(cacheKey, data, 600);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );
}
