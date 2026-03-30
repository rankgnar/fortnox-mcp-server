import "dotenv/config";
import { createServer } from "http";
import { exchangeAuthCode } from "./oauth2.js";

/**
 * OAuth2 setup helper — run once to authorize with Fortnox.
 * Usage: npm run auth
 */

const CLIENT_ID = process.env.FORTNOX_CLIENT_ID;
const REDIRECT_URI = "http://localhost:9999/callback";
const AUTH_URL = "https://apps.fortnox.se/oauth-v1/auth";

if (!CLIENT_ID) {
  console.error("ERROR: Set FORTNOX_CLIENT_ID in .env");
  process.exit(1);
}

// Scopes matching permissions enabled in Fortnox portal
const scopes = [
  "article",
  "payment",
  "invoice",
  "companyinformation",
  "supplier",
  "supplierinvoice",
  "bookkeeping",
  "salary",
  "inbox",
  "customer",
  "archive",
].join("%20");

const authorizationUrl = `${AUTH_URL}?client_id=${CLIENT_ID}&scope=${scopes}&state=fornox-setup&response_type=code&access_type=offline`;

console.log("\n========================================");
console.log("  Fortnox OAuth2 Setup");
console.log("========================================\n");
console.log("1. Abre este enlace en tu navegador:\n");
console.log(`   ${authorizationUrl}\n`);
console.log("2. Autoriza la aplicación en Fortnox");
console.log("3. Serás redirigido aquí automáticamente\n");
console.log("Esperando autorización...\n");

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://localhost:9999`);

  if (url.pathname === "/callback") {
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");

    if (error) {
      res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<h1>Error: ${error}</h1><p>${url.searchParams.get("error_description") || ""}</p>`);
      console.error(`ERROR: ${error}`);
      process.exit(1);
    }

    if (!code) {
      res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<h1>Error: No code received</h1>");
      return;
    }

    try {
      const tokens = await exchangeAuthCode(code);

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`
        <h1>✅ Autorización completada!</h1>
        <p>Los tokens se han guardado en <code>.fortnox-tokens.json</code></p>
        <p>Ya puedes cerrar esta ventana y ejecutar el servidor MCP.</p>
      `);

      console.log("✅ Autorización completada!");
      console.log(`   Access Token: ${tokens.access_token.substring(0, 20)}...`);
      console.log(`   Refresh Token: ${tokens.refresh_token.substring(0, 20)}...`);
      console.log(`   Tokens guardados en .fortnox-tokens.json`);
      console.log("\nAhora puedes ejecutar: npm run dev\n");

      setTimeout(() => process.exit(0), 1000);
    } catch (err) {
      res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<h1>Error al intercambiar código</h1><pre>${err}</pre>`);
      console.error("Error:", err);
      process.exit(1);
    }
  }
});

server.listen(9999, () => {
  console.log("Servidor de callback escuchando en http://localhost:9999\n");
});
