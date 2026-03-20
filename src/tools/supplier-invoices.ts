import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FortnoxClient } from "../client/fortnox.js";
import { cacheGet, cacheSet } from "../cache/redis.js";

export function register(server: McpServer, client: FortnoxClient) {
  server.tool(
    "list_supplier_invoices",
    "Lista facturas de proveedores. Filtros: cancelled, fullypaid, unpaid, unpaidoverdue, unbooked, pendingpayment, authorizepending",
    {
      filter: z.enum([
        "cancelled",
        "fullypaid",
        "unpaid",
        "unpaidoverdue",
        "unbooked",
        "pendingpayment",
        "authorizepending",
      ]).optional().describe("Filtrar por estado"),
      page: z.number().optional().describe("Página (default: 1)"),
      limit: z.number().optional().describe("Resultados por página (default: 100)"),
      lastmodified: z.string().optional().describe("Filtrar desde fecha modificación (YYYY-MM-DD)"),
    },
    async ({ filter, page, limit, lastmodified }) => {
      const cacheKey = `supplier-invoices:list:${filter || "all"}:${page || 1}`;
      const cached = await cacheGet(cacheKey);
      if (cached) return { content: [{ type: "text" as const, text: JSON.stringify(cached, null, 2) }] };

      const data = await client.get("/3/supplierinvoices", {
        filter,
        page: page || 1,
        limit: limit || 100,
        lastmodified,
      });

      await cacheSet(cacheKey, data, 120);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_supplier_invoice",
    "Obtiene los detalles completos de una factura de proveedor por su número",
    {
      number: z.string().describe("Número de la factura del proveedor (GivenNumber)"),
    },
    async ({ number }) => {
      const cacheKey = `supplier-invoices:${number}`;
      const cached = await cacheGet(cacheKey);
      if (cached) return { content: [{ type: "text" as const, text: JSON.stringify(cached, null, 2) }] };

      const data = await client.get(`/3/supplierinvoices/${number}`);
      await cacheSet(cacheKey, data, 120);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );
}
