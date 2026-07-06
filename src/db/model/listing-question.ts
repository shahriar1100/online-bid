import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";

export const listingQuestions = sqliteTable(
  "listing_questions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    listingId: integer("listing_id").notNull(),
    listingType: text("listing_type", { enum: ["realestate", "automobile", "business"] }).notNull(),
    userId: integer("user_id").notNull(),
    question: text("question").notNull(),
    status: text("status", { enum: ["pending", "approved", "rejected"] }).default("pending").notNull(),
    isVisible: integer("is_visible", { mode: "boolean" }).default(true).notNull(),
    isPinned: integer("is_pinned", { mode: "boolean" }).default(false).notNull(),
    totalAnswers: integer("total_answers").default(0).notNull(),
    lastAnswerAt: integer("last_answer_at"),
    createdAt: integer("created_at").$defaultFn(() => Date.now()).notNull(),
    updatedAt: integer("updated_at").$defaultFn(() => Date.now()).$onUpdateFn(() => Date.now()).notNull(),
  },
  (table) => [
    index("idx_listing_questions_listing_id").on(table.listingId),
    index("idx_listing_questions_listing_type").on(table.listingType),
    index("idx_listing_questions_user_id").on(table.userId),
    index("idx_listing_questions_status").on(table.status),
    index("idx_listing_questions_listing").on(table.listingId, table.listingType),
  ]
);

export type ListingQuestion = typeof listingQuestions.$inferSelect;
export type NewListingQuestion = typeof listingQuestions.$inferInsert;