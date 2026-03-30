# CLAUDE.md

## Project Overview

Fortnox MCP Server — a read-only MCP (Model Context Protocol) server that wraps the Fortnox ERP API (Swedish accounting/invoicing platform). Designed to be used by AI agents (e.g., OpenClaw) to query Fortnox data without opening the program.

**Company:** HEDBERH AB (559500-0224), Stockholm, Sweden

## Tech Stack

- **Runtime:** Node.js >= 18
- **Language:** TypeScript
- **Framework:** @modelcontextprotocol/sdk
- **Cache:** Redis (optional, via ioredis)
- **Auth:** OAuth2 Authorization Code Flow with auto-refresh
- **Transport:** stdio

## Key Commands

- `npm run build` — Compile TypeScript to `dist/`
- `npm run dev` — Run in dev mode (tsx)
- `npm start` — Run compiled server
- `npm run auth` — One-time OAuth2 authorization setup (port 9999)

## Architecture

- `src/index.ts` — Entry point, stdio transport
- `src/server.ts` — MCP server setup, registers all tools
- `src/auth/oauth2.ts` — Token management (load, refresh, persist to `.fortnox-tokens.json`)
- `src/auth/setup.ts` — One-time OAuth2 flow helper (local server on port 9999)
- `src/client/fortnox.ts` — HTTP client with rate limiting (25 req/5s sliding window)
- `src/cache/redis.ts` — Optional Redis cache (no-op if REDIS_URL not set)
- `src/tools/` — 12 tool files, each exports `register(server, client)`
- `src/types/fortnox.ts` — TypeScript interfaces

## Tools (23, all read-only)

| File | Tools |
|------|-------|
| `supplier-invoices.ts` | `list_supplier_invoices`, `get_supplier_invoice` |
| `supplier-invoice-payments.ts` | `list_supplier_invoice_payments`, `get_supplier_invoice_payment` |
| `suppliers.ts` | `list_suppliers`, `get_supplier` |
| `invoices.ts` | `list_invoices`, `get_invoice` |
| `invoice-payments.ts` | `list_invoice_payments`, `get_invoice_payment` |
| `customers.ts` | `list_customers`, `get_customer` |
| `articles.ts` | `list_articles`, `get_article` |
| `company.ts` | `get_company_info`, `get_company_settings` |
| `vouchers.ts` | `list_vouchers`, `list_vouchers_by_series`, `get_voucher` |
| `expenses.ts` | `list_expenses`, `get_expense` |
| `inbox.ts` | `list_inbox`, `get_inbox_file` |
| `archive.ts` | `list_archive`, `get_archive_file` |

## Fortnox API Details

- Base URL: `https://api.fortnox.se`
- Auth URL: `https://apps.fortnox.se/oauth-v1/auth`
- Token URL: `https://apps.fortnox.se/oauth-v1/token`
- Access token expires: 1 hour (auto-refresh)
- Refresh token expires: 45 days
- Rate limit: 25 requests per 5 seconds
- Scopes enabled: `article`, `payment`, `invoice`, `companyinformation`, `supplier`, `supplierinvoice`, `bookkeeping`, `salary`, `inbox`, `customer`, `archive`

## Auth Notes

- Redirect URI registered in Fortnox: `http://localhost:9999/callback`
- Do NOT send `redirect_uri` in the auth URL — let Fortnox use the registered default (fixes `redirect_uri_mismatch` error)
- The `redirect_uri` IS needed in the token exchange POST

## Sensitive Files (never commit)

- `.env` — Client ID and Secret
- `.fortnox-tokens.json` — Access and refresh tokens

## Deployment

- Repo: https://github.com/rankgnar/fortnox-mcp-server (public)
- VPS user: `hedberh`, path: `/home/hedberh/fortnox-mcp-server/`
- Agent: OpenClaw
- MCP config for agent:
  ```json
  {
    "mcpServers": {
      "fortnox": {
        "command": "node",
        "args": ["/home/hedberh/fortnox-mcp-server/dist/index.js"]
      }
    }
  }
  ```
