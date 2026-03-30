import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FortnoxClient } from "../client/fortnox.js";
import { cacheGet, cacheSet } from "../cache/redis.js";

export function register(server: McpServer, client: FortnoxClient) {
  server.tool(
    "list_vouchers",
    "List all vouchers (verifikationer). Can filter by financial year",
    {
      financialyear: z.number().optional().describe("Financial year ID (defaults to current if omitted)"),
      page: z.number().optional().describe("Page number"),
      limit: z.number().optional().describe("Results per page"),
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
    "List vouchers from a specific series (e.g. A, B, etc.)",
    {
      series: z.string().describe("Voucher series (e.g. A, B, C)"),
      financialyear: z.number().optional().describe("Financial year ID"),
      page: z.number().optional().describe("Page number"),
      limit: z.number().optional().describe("Results per page"),
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
    "Get details of a specific voucher by series and number",
    {
      series: z.string().describe("Voucher series (e.g. A)"),
      number: z.number().describe("Voucher number"),
      financialyear: z.number().optional().describe("Financial year ID"),
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
