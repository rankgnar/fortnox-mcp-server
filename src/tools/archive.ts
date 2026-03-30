import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FortnoxClient } from "../client/fortnox.js";
import { cacheGet, cacheSet } from "../cache/redis.js";

export function register(server: McpServer, client: FortnoxClient) {
  server.tool(
    "list_archive",
    "List files and folders in the Fortnox archive (arkivplats). Without folderId shows the root. With folderId browses into a subfolder.",
    {
      folderId: z.string().optional().describe("Subfolder ID to list. If omitted, shows the root."),
    },
    async ({ folderId }) => {
      const path = folderId ? `/3/archive/${folderId}` : "/3/archive";
      const cacheKey = `archive:${folderId || "root"}`;
      const cached = await cacheGet(cacheKey);
      if (cached) return { content: [{ type: "text" as const, text: JSON.stringify(cached, null, 2) }] };

      const data = await client.get(path);
      await cacheSet(cacheKey, data, 60);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_archive_file",
    "Get details of a specific file in the Fortnox archive by its ID",
    {
      id: z.string().describe("Archive file ID"),
      fileid: z.string().optional().describe("File attachment ID (if retrieving from file attachments)"),
    },
    async ({ id, fileid }) => {
      const cacheKey = `archive:file:${id}:${fileid || ""}`;
      const cached = await cacheGet(cacheKey);
      if (cached) return { content: [{ type: "text" as const, text: JSON.stringify(cached, null, 2) }] };

      const data = await client.get(`/3/archive/${id}`, fileid ? { fileid } : undefined);
      await cacheSet(cacheKey, data, 60);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );
}
