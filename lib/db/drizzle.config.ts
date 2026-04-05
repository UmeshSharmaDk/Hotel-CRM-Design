/// <reference types="node" />
import { defineConfig } from "drizzle-kit";
import path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../../artifacts/api-server/.env") });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Check artifacts/api-server/.env");
}
export default defineConfig({
  schema: "./src/schema",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: "127.0.0.1",
    user: "root",
    database: "hotel_crm",
  },
});
