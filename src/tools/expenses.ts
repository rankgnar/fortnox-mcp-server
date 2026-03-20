import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FortnoxClient } from "../client/fortnox.js";
import { cacheGet, cacheSet } from "../cache/redis.js";

export function register(server: McpServer, client: FortnoxClient) {
  server.tool(
    "list_expenses",
    "Lista todos los gastos/utlägg registrados",
    {
      page: z.number().optional().describe("Página"),
      limit: z.number().optional().describe("Resultados por página"),
    },
    async ({ page, limit }) => {
      const cacheKey = `expenses:list:${page || 1}`;
      const cached = await cacheGet(cacheKey);
      if (cached) return { content: [{ type: "text" as const, text: JSON.stringify(cached, null, 2) }] };

      const data = await client.get("/3/expenses", {
        page: page || 1,
        limit: limit || 100,
      });

      await cacheSet(cacheKey, data, 120);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_expense",
    "Obtiene los detalles de un gasto/utlägg específico por su código",
    {
      code: z.string().describe("Código del gasto (ExpenseCode)"),
    },
    async ({ code }) => {
      const cacheKey = `expenses:${code}`;
      const cached = await cacheGet(cacheKey);
      if (cached) return { content: [{ type: "text" as const, text: JSON.stringify(cached, null, 2) }] };

      const data = await client.get(`/3/expenses/${code}`);
      await cacheSet(cacheKey, data, 120);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );
}
