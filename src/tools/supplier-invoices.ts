import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FortnoxClient } from "../client/fortnox.js";
import { cacheGet, cacheSet } from "../cache/redis.js";

export function register(server: McpServer, client: FortnoxClient) {
  server.tool(
    "list_supplier_invoices",
    "List registered/booked supplier invoices (leverantörsfakturor). These are invoices already entered into the accounting system. NOT the same as incoming invoices (inkomna fakturor) — for those, use list_inbox with folderId 'inbox_s'. Filters: cancelled, fullypaid, unpaid, unpaidoverdue, unbooked, pendingpayment, authorizepending",
    {
      filter: z.enum([
        "cancelled",
        "fullypaid",
        "unpaid",
        "unpaidoverdue",
        "unbooked",
        "pendingpayment",
        "authorizepending",
      ]).optional().describe("Filter by status"),
      page: z.number().optional().describe("Page number (default: 1)"),
      limit: z.number().optional().describe("Results per page (default: 100)"),
      lastmodified: z.string().optional().describe("Filter from modification date (YYYY-MM-DD)"),
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
    "Get full details of a registered supplier invoice by its number. For the actual PDF of an incoming invoice, use list_inbox + download_inbox_file instead.",
    {
      number: z.string().describe("Supplier invoice number (GivenNumber)"),
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
