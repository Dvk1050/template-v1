import type { Config } from "drizzle-kit"

export default {
  schema: "./lib/schema.ts",
  out: "./drizzle",
  driver: "better-sqlite3",
  dbCredentials: {
    url: process.env.DATABASE_URL || "sqlite.db",
  },
} satisfies Config

