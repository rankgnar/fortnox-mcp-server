import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FortnoxClient } from "../client/fortnox.js";
import { cacheGet, cacheSet } from "../cache/redis.js";

export function register(server: McpServer, client: FortnoxClient) {
  server.tool(
    "list_vouchers",
    "Lista todos los verifikationer (asientos contables). Puedes filtrar por año fiscal",
    {
      financialyear: z.number().optional().describe("ID del año fiscal (si no se indica, usa el actual)"),
      page: z.number().optional().describe("Página"),
      limit: z.number().optional().describe("Resultados por página"),
    },
    async ({ financialyear, page, limit }) => {
      const cacheKey = `vouchers:list:${financialyear || "current"}:${page || 1}`;
      const cached = await cacheGet(cacheKey);
      if (cached) return { content: [{ type: "text" as const, text: JSON.stringify(cached, null, 2) }] };

      const data = await client.get("/3/vouchers", {
        financialyear,
        page: page || 1,
        limit: limit || 100,
      });

      await cacheSet(cacheKey, data, 120);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "list_vouchers_by_series",
    "Lista verifikationer de una serie específica (ej: A, B, etc.)",
    {
      series: z.string().describe("Serie del verifikat (ej: A, B, C)"),
      financialyear: z.number().optional().describe("ID del año fiscal"),
      page: z.number().optional().describe("Página"),
      limit: z.number().optional().describe("Resultados por página"),
    },
    async ({ series, financialyear, page, limit }) => {
      const cacheKey = `vouchers:series:${series}:${financialyear || "current"}:${page || 1}`;
      const cached = await cacheGet(cacheKey);
      if (cached) return { content: [{ type: "text" as const, text: JSON.stringify(cached, null, 2) }] };

      const data = await client.get(`/3/vouchers/sublist/${series}`, {
        financialyear,
        page: page || 1,
        limit: limit || 100,
      });

      await cacheSet(cacheKey, data, 120);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_voucher",
    "Obtiene los detalles de un verifikat específico por serie y número",
    {
      series: z.string().describe("Serie del verifikat (ej: A)"),
      number: z.number().describe("Número del verifikat"),
      financialyear: z.number().optional().describe("ID del año fiscal"),
    },
    async ({ series, number, financialyear }) => {
      const cacheKey = `vouchers:${series}:${number}`;
      const cached = await cacheGet(cacheKey);
      if (cached) return { content: [{ type: "text" as const, text: JSON.stringify(cached, null, 2) }] };

      const data = await client.get(`/3/vouchers/${series}/${number}`, { financialyear });
      await cacheSet(cacheKey, data, 120);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );
}
