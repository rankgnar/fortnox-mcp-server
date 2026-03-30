import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FortnoxClient } from "../client/fortnox.js";
import { cacheGet, cacheSet } from "../cache/redis.js";

export function register(server: McpServer, client: FortnoxClient) {
  server.tool(
    "get_company_info",
    "Get company information (name, address, organization number, etc.)",
    {},
    async () => {
      const cacheKey = "company:info";
      const cached = await cacheGet(cacheKey);
      if (cached) return { content: [{ type: "text" as const, text: JSON.stringify(cached, null, 2) }] };

      const data = await client.get("/3/companyinformation");
      await cacheSet(cacheKey, data, 3600);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_company_settings",
    "Get company settings in Fortnox",
    {},
    async () => {
      const cacheKey = "company:settings";
      const cached = await cacheGet(cacheKey);
      if (cached) return { content: [{ type: "text" as const, text: JSON.stringify(cached, null, 2) }] };

      const data = await client.get("/3/settings/company");
      await cacheSet(cacheKey, data, 3600);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );
}
