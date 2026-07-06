import { sqliteTable, integer, text, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { chatRooms } from "./chat-room";

export const chatParticipants = sqliteTable(
  "chat_participants",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    roomId: integer("room_id")
      .notNull()
      .references(() => chatRooms.id, { onDelete: "cascade" }),
    userId: integer("user_id").notNull(),
    role: text("role", { enum: ["buyer", "seller", "admin", "moderator"] }).notNull(),
    joinedAt: integer("joined_at")
      .$defaultFn(() => Date.now())
      .notNull(),
    lastSeenAt: integer("last_seen_at"),
    unreadCount: integer("unread_count").default(0).notNull(),
    isMuted: integer("is_muted", { mode: "boolean" }).default(false).notNull(),
    isBlocked: integer("is_blocked", { mode: "boolean" }).default(false).notNull(),
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  },
  (table) => [
    uniqueIndex("uidx_chat_participants_room_user").on(table.roomId, table.userId),
    index("idx_chat_participants_room_id").on(table.roomId),
    index("idx_chat_participants_user_id").on(table.userId),
    index("idx_chat_participants_role").on(table.role),
    index("idx_chat_participants_is_active").on(table.isActive),
  ]
);

export type ChatParticipant = typeof chatParticipants.$inferSelect;
export type NewChatParticipant = typeof chatParticipants.$inferInsert;