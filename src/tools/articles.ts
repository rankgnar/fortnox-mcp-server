import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FortnoxClient } from "../client/fortnox.js";
import { cacheGet, cacheSet } from "../cache/redis.js";

export function register(server: McpServer, client: FortnoxClient) {
  server.tool(
    "list_articles",
    "List articles/products. Can search by description, EAN, supplier or manufacturer",
    {
      description: z.string().optional().describe("Filter by description"),
      articlenumber: z.string().optional().describe("Filter by article number"),
      ean: z.string().optional().describe("Filter by EAN code"),
      suppliernumber: z.string().optional().describe("Filter by supplier number"),
      manufacturer: z.string().optional().describe("Filter by manufacturer"),
      page: z.number().optional().describe("Page number"),
      limit: z.number().optional().describe("Results per page"),
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
    "Get full details of an article/product by its number",
    {
      number: z.string().describe("Article number"),
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
