import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";
import { chatRooms } from "./chat-room";

export const chatMessages = sqliteTable(
  "chat_messages",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    roomId: integer("room_id")
      .notNull()
      .references(() => chatRooms.id, { onDelete: "cascade" }),
    senderId: integer("sender_id").notNull(),
    receiverId: integer("receiver_id").notNull(),
    message: text("message"),
    messageType: text("message_type", {
      enum: ["text", "image", "file", "system"],
    })
      .default("text")
      .notNull(),
    attachmentUrl: text("attachment_url"),
    attachmentName: text("attachment_name"),
    attachmentSize: integer("attachment_size"),
    replyToMessageId: integer("reply_to_message_id"),

    editedAt: integer("edited_at"),
    isRead: integer("is_read", { mode: "boolean" }).default(false).notNull(),
    isDeleted: integer("is_deleted", { mode: "boolean" }).default(false).notNull(),
    createdAt: integer("created_at")
      .$defaultFn(() => Date.now())
      .notNull(),
    updatedAt: integer("updated_at")
      .$defaultFn(() => Date.now())
      .$onUpdateFn(() => Date.now())
      .notNull(),
  },
  (table) => [
    index("idx_chat_messages_room_id").on(table.roomId),
    index("idx_chat_messages_sender_id").on(table.senderId),
    index("idx_chat_messages_receiver_id").on(table.receiverId),
    index("idx_chat_messages_created_at").on(table.createdAt),
    index("idx_chat_messages_room_created_at").on(table.roomId, table.createdAt),
  ]
);

export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;