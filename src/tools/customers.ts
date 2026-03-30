import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FortnoxClient } from "../client/fortnox.js";
import { cacheGet, cacheSet } from "../cache/redis.js";

export function register(server: McpServer, client: FortnoxClient) {
  server.tool(
    "list_customers",
    "List all customers. Can search by name",
    {
      name: z.string().optional().describe("Filter by customer name"),
      city: z.string().optional().describe("Filter by city"),
      email: z.string().optional().describe("Filter by email"),
      page: z.number().optional().describe("Page number"),
      limit: z.number().optional().describe("Results per page"),
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
    "Get full details of a customer by its number",
    {
      number: z.string().describe("Customer number (CustomerNumber)"),
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
