import {
  sqliteTable,
  integer,
  text,
  index,
} from "drizzle-orm/sqlite-core";

export const notifications = sqliteTable(
  "notifications",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),

    // Notification receiver
    user_id: integer("user_id").notNull(),

    // Related listing (optional)
    listing_id: integer("listing_id"),

    // Notification type
    type: text("type").notNull(),

    // Notification title
    title: text("title").notNull(),

    // Redirect URL
    link: text("link"),

    // Read status
    is_read: integer("is_read", {
      mode: "boolean",
    })
      .default(false)
      .notNull(),

    // Created time
    created_at: integer("created_at", {
      mode: "timestamp_ms",
    })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    userIdx: index("notifications_user_idx").on(table.user_id),
    readIdx: index("notifications_read_idx").on(table.is_read),
    createdIdx: index("notifications_created_idx").on(table.created_at),
  })
);