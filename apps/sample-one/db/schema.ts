import { bigserial, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Replace this table with your own schema.
export const posts = pgTable("posts", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
