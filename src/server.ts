import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FortnoxClient } from "./client/fortnox.js";

import * as supplierInvoices from "./tools/supplier-invoices.js";
import * as supplierInvoicePayments from "./tools/supplier-invoice-payments.js";
import * as suppliers from "./tools/suppliers.js";
import * as invoices from "./tools/invoices.js";
import * as invoicePayments from "./tools/invoice-payments.js";
import * as articles from "./tools/articles.js";
import * as customers from "./tools/customers.js";
import * as company from "./tools/company.js";
import * as vouchers from "./tools/vouchers.js";
import * as expenses from "./tools/expenses.js";
import * as inbox from "./tools/inbox.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "fortnox",
    version: "1.0.0",
  });

  const client = new FortnoxClient();

  // Register all tools
  supplierInvoices.register(server, client);
  supplierInvoicePayments.register(server, client);
  suppliers.register(server, client);
  invoices.register(server, client);
  invoicePayments.register(server, client);
  articles.register(server, client);
  customers.register(server, client);
  company.register(server, client);
  vouchers.register(server, client);
  expenses.register(server, client);
  inbox.register(server, client);

  return server;
}
