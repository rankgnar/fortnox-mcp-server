import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FortnoxClient } from "../client/fortnox.js";
import { cacheGet, cacheSet } from "../cache/redis.js";

export function register(server: McpServer, client: FortnoxClient) {
  server.tool(
    "list_invoices",
    "List customer invoices. Filters: cancelled, fullypaid, unpaid, unpaidoverdue, unbooked",
    {
      filter: z.enum(["cancelled", "fullypaid", "unpaid", "unpaidoverdue", "unbooked"]).optional().describe("Filter by status"),
      customername: z.string().optional().describe("Filter by customer name"),
      customernumber: z.string().optional().describe("Filter by customer number"),
      fromdate: z.string().optional().describe("From date (YYYY-MM-DD)"),
      todate: z.string().optional().describe("To date (YYYY-MM-DD)"),
      page: z.number().optional().describe("Page number"),
      limit: z.number().optional().describe("Results per page"),
      sortby: z.string().optional().describe("Sort by field"),
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
    "Get full details of a customer invoice",
    {
      number: z.string().describe("Invoice document number"),
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
