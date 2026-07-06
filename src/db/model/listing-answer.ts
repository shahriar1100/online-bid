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
    parentAnswerId: integer("parent_answer_id"),

    likeCount: integer("like_count")
      .default(0)
      .notNull(),
    isBestAnswer: integer("is_best_answer", { mode: "boolean" }).default(false).notNull(),
    isVisible: integer("is_visible", { mode: "boolean" }).default(true).notNull(),
    isEdited: integer("is_edited", { mode: "boolean" }).default(false).notNull(),
    editedAt: integer("edited_at"),
    createdAt: integer("created_at").$defaultFn(() => Date.now()).notNull(),
    updatedAt: integer("updated_at").$defaultFn(() => Date.now()).$onUpdateFn(() => Date.now()).notNull(),
  },
  (table) => [
    index("idx_listing_answers_question_id").on(table.questionId),
    index("idx_listing_answers_parent").on(table.parentAnswerId),
    index("idx_listing_answers_listing_id").on(table.listingId),
    index("idx_listing_answers_listing_type").on(table.listingType),
    index("idx_listing_answers_user_id").on(table.userId),
    index("idx_listing_answers_role").on(table.role),
    index("idx_listing_answers_created_at").on(table.createdAt),
    index("idx_listing_answers_listing").on(table.listingId, table.listingType),
  ]
);

export type ListingAnswer = typeof listingAnswers.$inferSelect;
export type NewListingAnswer = typeof listingAnswers.$inferInsert;