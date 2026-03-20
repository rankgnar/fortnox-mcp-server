import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FortnoxClient } from "../client/fortnox.js";
import { cacheGet, cacheSet } from "../cache/redis.js";

export function register(server: McpServer, client: FortnoxClient) {
  server.tool(
    "list_suppliers",
    "Lista todos los proveedores. Puedes buscar por nombre",
    {
      name: z.string().optional().describe("Filtrar por nombre del proveedor"),
      page: z.number().optional().describe("Página"),
      limit: z.number().optional().describe("Resultados por página"),
    },
    async ({ name, page, limit }) => {
      const cacheKey = `suppliers:list:${name || "all"}:${page || 1}`;
      const cached = await cacheGet(cacheKey);
      if (cached) return { content: [{ type: "text" as const, text: JSON.stringify(cached, null, 2) }] };

      const data = await client.get("/3/suppliers", { name, page: page || 1, limit: limit || 100 });
      await cacheSet(cacheKey, data, 300);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_supplier",
    "Obtiene los detalles completos de un proveedor por su número",
    {
      number: z.string().describe("Número del proveedor (SupplierNumber)"),
    },
    async ({ number }) => {
      const cacheKey = `suppliers:${number}`;
      const cached = await cacheGet(cacheKey);
      if (cached) return { content: [{ type: "text" as const, text: JSON.stringify(cached, null, 2) }] };

      const data = await client.get(`/3/suppliers/${number}`);
      await cacheSet(cacheKey, data, 300);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );
}
