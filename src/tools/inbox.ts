import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FortnoxClient } from "../client/fortnox.js";
import { cacheGet, cacheSet } from "../cache/redis.js";

export function register(server: McpServer, client: FortnoxClient) {
  server.tool(
    "list_inbox",
    "List files and folders in the Fortnox inbox. Without folderId shows the root (subfolders like Leverantörsfakturor, Kvitton, etc.). With folderId browses into a subfolder to see incoming invoices (inkomna fakturor).",
    {
      folderId: z.string().optional().describe("Subfolder ID to list (e.g. the Leverantörsfakturor folder). If omitted, shows the root."),
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
    "Get details of a specific file or folder in the inbox",
    {
      id: z.string().describe("File or folder ID in the inbox"),
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
    "Download a file (PDF) from the Fortnox inbox. Returns the file as base64-encoded data.",
    {
      fileId: z.string().describe("File ID to download (from list_inbox results)"),
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
