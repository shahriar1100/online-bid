import { sqliteTable, integer, text, uniqueIndex, index } from "drizzle-orm/sqlite-core";

export const chatRooms = sqliteTable(
  "chat_rooms",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    listingId: integer("listing_id").notNull(),
    listingType: text("listing_type", { enum: ["realestate", "automobile", "business"] }).notNull(),
    buyerId: integer("buyer_id").notNull(),
    sellerId: integer("seller_id").notNull(),
    paymentRequired: integer("payment_required", { mode: "boolean" }).default(false).notNull(),
    paymentCompleted: integer("payment_completed", { mode: "boolean" }).default(false).notNull(),
    stripePaymentId: text("stripe_payment_id"),
    roomStatus: text("room_status", { enum: ["pending", "active", "closed"] }).default("pending").notNull(),
    lastMessageAt: integer("last_message_at"),
    createdAt: integer("created_at").$defaultFn(() => Date.now()).notNull(),
    updatedAt: integer("updated_at").$defaultFn(() => Date.now()).$onUpdateFn(() => Date.now()).notNull(),
  },
  (table) => [
    uniqueIndex("uidx_buyer_seller_listing").on(
      table.buyerId,
      table.sellerId,
      table.listingId,
      table.listingType
    ),
    index("idx_chat_rooms_buyer").on(table.buyerId),
    index("idx_chat_rooms_seller").on(table.sellerId),
    index("idx_chat_rooms_listing").on(table.listingId),
    index("idx_chat_rooms_status").on(table.roomStatus),
    index("idx_last_message").on(table.lastMessageAt)
  ]
);

export type ChatRoom = typeof chatRooms.$inferSelect;
export type NewChatRoom = typeof chatRooms.$inferInsert;