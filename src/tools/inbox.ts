import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FortnoxClient } from "../client/fortnox.js";
import { cacheGet, cacheSet } from "../cache/redis.js";

export function register(server: McpServer, client: FortnoxClient) {
  server.tool(
    "list_inbox",
    "Lista los archivos y carpetas del inbox de Fortnox (kvitton, facturas subidas, etc.)",
    {},
    async () => {
      const cacheKey = "inbox:root";
      const cached = await cacheGet(cacheKey);
      if (cached) return { content: [{ type: "text" as const, text: JSON.stringify(cached, null, 2) }] };

      const data = await client.get("/3/inbox");
      await cacheSet(cacheKey, data, 60);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_inbox_file",
    "Obtiene información de un archivo o carpeta específica del inbox",
    {
      id: z.string().describe("ID del archivo o carpeta en el inbox"),
    },
    async ({ id }) => {
      const cacheKey = `inbox:${id}`;
      const cached = await cacheGet(cacheKey);
      if (cached) return { content: [{ type: "text" as const, text: JSON.stringify(cached, null, 2) }] };

      const data = await client.get(`/3/inbox/${id}`);
      await cacheSet(cacheKey, data, 60);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );
}
