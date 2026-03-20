import "dotenv/config";
import { FortnoxClient } from "./client/fortnox.js";

async function main() {
  const client = new FortnoxClient();
  try {
    const data = await client.get("/3/companyinformation");
    console.log("✅ Conexión exitosa!\n");
    console.log(JSON.stringify(data, null, 2));
  } catch (e: any) {
    console.error("❌ Error:", e.message);
  }
}

main();
