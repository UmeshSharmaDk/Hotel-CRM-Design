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
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
