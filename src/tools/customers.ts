import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FortnoxClient } from "../client/fortnox.js";
import { cacheGet, cacheSet } from "../cache/redis.js";

export function register(server: McpServer, client: FortnoxClient) {
  server.tool(
    "list_customers",
    "Lista todos los clientes. Puedes buscar por nombre",
    {
      name: z.string().optional().describe("Filtrar por nombre del cliente"),
      city: z.string().optional().describe("Filtrar por ciudad"),
      email: z.string().optional().describe("Filtrar por email"),
      page: z.number().optional().describe("Página"),
      limit: z.number().optional().describe("Resultados por página"),
    },
    async (input) => {
      const cacheKey = `customers:list:${input.name || "all"}:${input.page || 1}`;
      const cached = await cacheGet(cacheKey);
      if (cached) return { content: [{ type: "text" as const, text: JSON.stringify(cached, null, 2) }] };

      const data = await client.get("/3/customers", {
        name: input.name,
        city: input.city,
        email: input.email,
        page: input.page || 1,
        limit: input.limit || 100,
      });

      await cacheSet(cacheKey, data, 300);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_customer",
    "Obtiene los detalles completos de un cliente por su número",
    {
      number: z.string().describe("Número del cliente (CustomerNumber)"),
    },
    async ({ number }) => {
      const cacheKey = `customers:${number}`;
      const cached = await cacheGet(cacheKey);
      if (cached) return { content: [{ type: "text" as const, text: JSON.stringify(cached, null, 2) }] };

      const data = await client.get(`/3/customers/${number}`);
      await cacheSet(cacheKey, data, 300);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );
}
