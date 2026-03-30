import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FortnoxClient } from "../client/fortnox.js";
import { cacheGet, cacheSet } from "../cache/redis.js";

export function register(server: McpServer, client: FortnoxClient) {
  server.tool(
    "list_invoice_payments",
    "List customer invoice payments",
    {
      invoicenumber: z.string().optional().describe("Filter by invoice number"),
      page: z.number().optional().describe("Page number"),
      limit: z.number().optional().describe("Results per page"),
    },
    async ({ invoicenumber, page, limit }) => {
      const cacheKey = `invoice-payments:list:${invoicenumber || "all"}:${page || 1}`;
      const cached = await cacheGet(cacheKey);
      if (cached) return { content: [{ type: "text" as const, text: JSON.stringify(cached, null, 2) }] };

      const data = await client.get("/3/invoicepayments", {
        invoicenumber,
        page: page || 1,
        limit: limit || 100,
      });

      await cacheSet(cacheKey, data, 120);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_invoice_payment",
    "Get details of a customer invoice payment",
    {
      number: z.number().describe("Payment number"),
    },
    async ({ number }) => {
      const data = await client.get(`/3/invoicepayments/${number}`);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );
}
