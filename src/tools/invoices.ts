import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FortnoxClient } from "../client/fortnox.js";
import { cacheGet, cacheSet } from "../cache/redis.js";

export function register(server: McpServer, client: FortnoxClient) {
  server.tool(
    "list_invoices",
    "Lista facturas de clientes. Filtros: cancelled, fullypaid, unpaid, unpaidoverdue, unbooked",
    {
      filter: z.enum(["cancelled", "fullypaid", "unpaid", "unpaidoverdue", "unbooked"]).optional().describe("Filtrar por estado"),
      customername: z.string().optional().describe("Filtrar por nombre de cliente"),
      customernumber: z.string().optional().describe("Filtrar por número de cliente"),
      fromdate: z.string().optional().describe("Desde fecha (YYYY-MM-DD)"),
      todate: z.string().optional().describe("Hasta fecha (YYYY-MM-DD)"),
      page: z.number().optional().describe("Página"),
      limit: z.number().optional().describe("Resultados por página"),
      sortby: z.string().optional().describe("Ordenar por campo"),
    },
    async (input) => {
      const cacheKey = `invoices:list:${input.filter || "all"}:${input.page || 1}`;
      const cached = await cacheGet(cacheKey);
      if (cached) return { content: [{ type: "text" as const, text: JSON.stringify(cached, null, 2) }] };

      const data = await client.get("/3/invoices", {
        filter: input.filter,
        customername: input.customername,
        customernumber: input.customernumber,
        fromdate: input.fromdate,
        todate: input.todate,
        page: input.page || 1,
        limit: input.limit || 100,
        sortby: input.sortby,
      });

      await cacheSet(cacheKey, data, 120);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_invoice",
    "Obtiene los detalles completos de una factura de cliente",
    {
      number: z.string().describe("Número de documento de la factura"),
    },
    async ({ number }) => {
      const cacheKey = `invoices:${number}`;
      const cached = await cacheGet(cacheKey);
      if (cached) return { content: [{ type: "text" as const, text: JSON.stringify(cached, null, 2) }] };

      const data = await client.get(`/3/invoices/${number}`);
      await cacheSet(cacheKey, data, 120);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );
}
