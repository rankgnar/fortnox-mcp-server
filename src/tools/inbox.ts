import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FortnoxClient } from "../client/fortnox.js";
import { cacheGet, cacheSet } from "../cache/redis.js";

export function register(server: McpServer, client: FortnoxClient) {
  server.tool(
    "list_inbox",
    `List files and folders in the Fortnox inbox (inkomna fakturor).
This is where invoices received by email (via arkivplats) land.

WORKFLOW to find incoming invoices:
1. Call list_inbox WITHOUT folderId → shows root folders (Leverantörsfakturor, Kvitton, etc.)
2. Call list_inbox WITH folderId "inbox_s" → lists all received supplier invoices (PDFs)
3. Use download_inbox_file with the file Id to download a specific PDF

Known folder IDs: inbox_s (Leverantörsfakturor), inbox_kf (Kundfakturor), inbox_ku (Kvitto & Utlägg), inbox_v (Verifikationer), inbox_d (Dagskassor), inbox_b (Bankfiler), inbox_l (Lön), inbox_a (Anläggningsregister), inbox_o (Ordrar), inbox_of (Offerter), inbox_lm (Enkel Lön).`,
    {
      folderId: z.string().optional().describe("Folder ID to browse. Use 'inbox_s' for supplier invoices (Leverantörsfakturor). Omit to see all folders."),
    },
    async ({ folderId }) => {
      const path = folderId ? `/3/inbox/${folderId}` : "/3/inbox";
      const cacheKey = `inbox:${folderId || "root"}`;
      const cached = await cacheGet(cacheKey);
      if (cached) return { content: [{ type: "text" as const, text: JSON.stringify(cached, null, 2) }] };

      const data = await client.get(path);
      await cacheSet(cacheKey, data, 60);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_inbox_file",
    "Get metadata (name, size, path) of a specific file in the inbox. Does NOT download the file — use download_inbox_file for that.",
    {
      id: z.string().describe("File ID from list_inbox results"),
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

  server.tool(
    "download_inbox_file",
    "Download a file (PDF/image) from the Fortnox inbox. Returns the file as base64. Use this to read/view incoming invoices. First use list_inbox to find the file ID.",
    {
      fileId: z.string().describe("File ID to download (the 'Id' field from list_inbox results)"),
    },
    async ({ fileId }) => {
      const { data, contentType } = await client.getFile(`/3/inbox/${fileId}`);
      return {
        content: [
          {
            type: "resource" as const,
            resource: {
              uri: `fortnox://inbox/${fileId}`,
              mimeType: contentType,
              blob: data,
            },
          },
        ],
      };
    }
  );
}
