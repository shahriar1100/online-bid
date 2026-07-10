import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";
import { listingQuestions } from "./listing-question";

export const listingAnswers = sqliteTable(
  "listing_answers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    questionId: integer("question_id")
      .notNull()
      .references(() => listingQuestions.id, { onDelete: "cascade" }),
    listingId: integer("listing_id").notNull(),
    listingType: text("listing_type", { enum: ["realestate", "automobile", "business"] }).notNull(),
    userId: integer("user_id").notNull(),
    role: text("role", { enum: ["seller", "admin", "moderator"] }).notNull(),
    answer: text("answer").notNull(),
    isBestAnswer: integer("is_best_answer", { mode: "boolean" }).default(false).notNull(),
    isVisible: integer("is_visible", { mode: "boolean" }).default(true).notNull(),
    isEdited: integer("is_edited", { mode: "boolean" }).default(false).notNull(),
    editedAt: integer("edited_at"),
    createdAt: integer("created_at").$defaultFn(() => Date.now()).notNull(),
    updatedAt: integer("updated_at").$defaultFn(() => Date.now()).$onUpdateFn(() => Date.now()).notNull(),
  },
  (table) => [
    index("idx_listing_answers_question_id").on(table.questionId),
    index("idx_listing_answers_user_id").on(table.userId),
    index("idx_listing_answers_listing").on(table.listingId, table.listingType),
  ]
);

export type ListingAnswer = typeof listingAnswers.$inferSelect;
export type NewListingAnswer = typeof listingAnswers.$inferInsert;